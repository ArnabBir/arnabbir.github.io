"""Offline teaching fixtures, Python 3.9+, stdlib only. Not production code."""

import argparse
import collections
import itertools
import json
import os
from pathlib import Path
import random
import sqlite3
import subprocess
import sys
import tempfile


class OracleFailure(Exception):
    pass


def equal(actual, expected, context):
    if actual != expected:
        raise OracleFailure(f"{context}: observed={actual!r}, expected={expected!r}")


def counter_worker(path, command, delta, cut, fixed):
    db = sqlite3.connect(path)
    db.execute("PRAGMA synchronous=FULL")
    if cut == "before":
        os._exit(0)
    db.execute("BEGIN IMMEDIATE")
    receipt = db.execute("SELECT delta, result FROM receipts WHERE id=?", (command,)).fetchone()
    if receipt:
        if receipt[0] != delta:
            db.rollback()
            print("CONFLICT", flush=True)
            db.close()
            return
        result = receipt[1]
    else:
        db.execute("UPDATE counter SET value=value+?", (delta,))
        result = db.execute("SELECT value FROM counter").fetchone()[0]
        db.execute("INSERT INTO receipts VALUES (?, ?, ?)", (command, delta, result))
    if cut == "updated":
        os._exit(0)
    if cut == "ack" and not fixed:
        print(result, flush=True)
        os._exit(0)
    db.commit()
    if cut == "committed":
        os._exit(0)
    print(result, flush=True)
    if cut == "ack":
        os._exit(0)
    db.close()


def durable_counter(seed, fixed):
    delta = random.Random(seed).randint(1, 50)
    # Expected state is specified from the cut contract, not read from the DB.
    for cut, expected_before_retry in [("ack", delta), ("before", 0),
                                       ("updated", 0), ("committed", delta)]:
        with tempfile.TemporaryDirectory(prefix="atlas-counter-") as directory:
            path = Path(directory) / "counter.sqlite"
            with sqlite3.connect(path) as db:
                equal(db.execute("PRAGMA journal_mode=DELETE").fetchone()[0], "delete",
                      "explicit rollback-journal mode")
                db.executescript("CREATE TABLE counter(value INTEGER NOT NULL);"
                                 "INSERT INTO counter VALUES (0);"
                                 "CREATE TABLE receipts(id TEXT PRIMARY KEY, delta INTEGER, result INTEGER);")
            db.close()

            def invoke(command, amount, boundary, guarded):
                process = subprocess.run(
                    [sys.executable, str(Path(__file__).resolve()), "--counter-worker",
                     str(path), command, str(amount), boundary, str(int(guarded))],
                    capture_output=True, text=True, timeout=10, check=True)
                return process.stdout.strip()

            response = invoke("one", delta, cut, fixed)
            with sqlite3.connect(path) as db:
                recovered = db.execute("SELECT value FROM counter").fetchone()[0]
            db.close()
            if cut == "ack":
                equal(response, str(delta), "acknowledgment received by independent parent")
            equal(recovered, expected_before_retry, f"restart after {cut}")
            equal(invoke("one", delta, "normal", fixed), str(delta), "retry result")
            equal(invoke("one", delta, "normal", fixed), str(delta), "duplicate result")
            equal(invoke("one", delta + 1, "normal", fixed), "CONFLICT", "different intent")
            equal(invoke("two", 3, "normal", fixed), str(delta + 3), "distinct command")
            equal(invoke("one", delta, "normal", fixed), str(delta),
                  "old receipt stays stable after a later command")
            with sqlite3.connect(path) as db:
                equal(db.execute("SELECT value FROM counter").fetchone()[0], delta + 3,
                      "unique command oracle")
                equal(db.execute("SELECT COUNT(*) FROM receipts").fetchone()[0], 2,
                      "receipt cardinality")
            db.close()


def fenced_worker(seed, fixed):
    epoch = random.Random(seed).randint(2, 100)
    current = epoch
    value = "original"
    accepted = []

    def write(token, payload):
        nonlocal value
        # Atomic sink operation in this sequential model; not a preflight RPC.
        if not fixed or token == current:
            value = payload
            accepted.append(token)

    write(epoch, "old-authorized")
    current = epoch + 1  # Handoff installs authority before it is reported complete.
    write(epoch, "paused-before-new-write")
    write(epoch + 1, "new-owner")
    write(epoch, "paused-after-new-write")
    write(epoch + 2, "invented-future-token")
    equal(accepted, [epoch, epoch + 1], "only installed authority can commit")
    equal(value, "new-owner", "stale worker cannot overwrite")


def outbox_inbox(seed, fixed):
    rng = random.Random(seed)
    commands = [(f"event-{i}", rng.randint(1, 30)) for i in range(4)]
    oracle = dict(commands)
    violations = {}
    # Each scenario restarts producer/consumer at an explicit transition cut.
    for producer_cut, consumer_cut in itertools.product(["business", "committed"],
                                                        ["effect", "committed"]):
        business, outbox, inbox, effects = {}, {}, set(), []

        def produce(identifier, amount, crash=False):
            if identifier in business:
                return
            if crash and producer_cut == "business":
                if not fixed:
                    business[identifier] = amount
                return  # Fixed transaction rolls back business and outbox together.
            business[identifier] = amount
            outbox[identifier] = amount

        for identifier, amount in commands:
            produce(identifier, amount, crash=True)
            produce(identifier, amount)
        deliveries = list(outbox.items()) * 3
        rng.shuffle(deliveries)
        crashed = set()

        def consume(identifier, amount, crash=False):
            if identifier in inbox:
                return
            if crash and consumer_cut == "effect":
                if not fixed:
                    effects.append((identifier, amount))
                return  # Fixed inbox and effect transaction aborts together.
            effects.append((identifier, amount))
            inbox.add(identifier)

        for identifier, amount in deliveries:
            first = identifier not in crashed
            crashed.add(identifier)
            consume(identifier, amount, crash=first)
        try:
            equal(business, oracle, "all source commands committed")
            equal(dict(outbox), oracle, f"outbox completeness after {producer_cut}")
            equal(collections.Counter(effects), collections.Counter(commands),
                  f"one effect per source ID after {consumer_cut}")
            equal(inbox, set(oracle), "all effects have receipts")
        except OracleFailure as error:
            if fixed:
                raise
            violations[(producer_cut, consumer_cut)] = str(error)
    if not fixed:
        expected_failures = {("business", "effect"), ("business", "committed"),
                             ("committed", "effect")}
        if set(violations) != expected_failures:
            raise RuntimeError("outbox/inbox mutation coverage changed; inspect each crash cut")
        raise OracleFailure("independent producer-gap and consumer-gap mutations detected in "
                            f"{len(violations)} crash combinations")


def versioned_cache(seed, fixed):
    rng = random.Random(seed)
    # None is an explicit deletion, not the absence of version knowledge.
    events = [(1, "old"), (2, "new"), (3, None)]
    schedules = list(itertools.permutations(events))
    rng.shuffle(schedules)
    for schedule in schedules:
        cache, watermark = {}, 0

        def apply(version, payload):
            nonlocal watermark
            if not fixed or version > watermark:
                watermark = version
                cache["key"] = payload

        for event in schedule:
            apply(*event)
        cache.clear()  # Eviction must not erase the retained deletion/version fence.
        apply(1, "old")  # A fill started before deletion returns after eviction.
        equal(watermark, 3, "highest authoritative revision retained")
        equal(cache.get("key"), None, "deleted value cannot resurrect")
        apply(4, "recreated")
        apply(4, "duplicate-must-not-change-value")
        equal(cache.get("key"), "recreated", "newer recreation and duplicate delivery")


def shard_movement(seed, fixed):
    rng = random.Random(seed)
    base = rng.randint(1, 50)
    snapshot = {"a": (1, base), "b": (1, 9)}
    # Independent source command ledger defines the cutover state.
    expected = {"a": base + 1, "b": None, "c": 7}
    changes = [("a", 2, base + 1), ("b", 2, None), ("c", 1, 7)]
    rng.shuffle(changes)
    target = {}

    def install(key, version, value):
        if not fixed or version > target.get(key, (0, None))[0]:
            target[key] = (version, value)

    for key, version, value in changes:
        install(key, version, value)
    for key, (version, value) in snapshot.items():
        install(key, version, value)  # Delayed backfill must not overwrite CDC.
    for key, version, value in changes[:1]:
        install(key, version, value)  # Duplicate delivery is harmless.
    equal({key: row[1] for key, row in target.items()}, expected,
          "snapshot plus change log at cutover watermark")
    owner_epoch = 2
    old_write_accepted = not fixed or 1 == owner_epoch
    equal(old_write_accepted, False, "stale router cannot write old owner after cutover")
    # A new write makes routing-only rollback unsafe; preserve it in reverse catchup.
    install("a", 3, base + 2)
    reverse = dict(snapshot)
    for key, row in target.items():
        if row[0] > reverse.get(key, (0, None))[0]:
            reverse[key] = row
    equal(reverse["a"], (3, base + 2), "reverse catchup includes post-cutover write")
    equal(reverse["b"], (2, None), "reverse catchup retains deletion")


def temporal_corrections(seed, fixed):
    rng = random.Random(seed)
    rows = [(1, 31, 1, 1, 100), (10, 15, 20, 2, 80)]
    rng.shuffle(rows)

    def query(valid_at, known_at):
        matches = [row for row in rows if row[2] <= known_at and
                   (not fixed or row[0] <= valid_at < row[1])]
        return max(matches, key=lambda row: (row[2], row[3]))[4] if matches else None

    # Hand-specified point oracle does not reuse query filtering logic.
    cases = [(12, 15, 100), (12, 25, 80), (9, 25, 100), (10, 25, 80),
             (15, 25, 100), (31, 25, None), (12, 0, None)]
    for valid_at, known_at, expected in cases:
        equal(query(valid_at, known_at), expected,
              f"valid={valid_at}, known={known_at}")
    rows.append((10, 15, 20, 2, 80))
    equal(query(12, 25), 80, "duplicate assertion")


def permission_revocation(seed, fixed):
    rng = random.Random(seed)
    version = rng.randint(1, 100)
    policies = {("tenant-a", "alice"): (version, True),
                ("tenant-b", "alice"): (version, False)}
    effects = []

    def commit(tenant, principal, expected_version, cached_allow, operation):
        policy = policies.get((tenant, principal), (0, False))
        allowed = policy == (expected_version, True) if fixed else cached_allow
        if allowed:
            effects.append(operation)

    commit("tenant-a", "alice", version, True, "before-revoke")
    policies[("tenant-a", "alice")] = (version + 1, False)
    commit("tenant-a", "alice", version, True, "stale-allow")
    commit("tenant-b", "alice", version, True, "cross-tenant")
    commit("tenant-a", "mallory", version, True, "unknown-principal")
    policies[("tenant-a", "alice")] = (version + 2, True)
    commit("tenant-a", "alice", version, True, "old-capability-after-regrant")
    commit("tenant-a", "alice", version + 2, True, "fresh-regrant")
    equal(effects, ["before-revoke", "fresh-regrant"], "effect-time policy oracle")


def bounded_scheduling(seed, fixed):
    rng = random.Random(seed)
    arrivals = [("a", f"a{i}") for i in range(rng.randint(6, 12))] + [("b", "b0")]
    total_limit, tenant_limit = 4, 2
    queues = {"a": collections.deque(), "b": collections.deque()}
    admitted, rejected, completed, cancelled = [], [], [], []
    peak, tenant_peak = 0, 0

    def admit(tenant, identifier):
        nonlocal peak, tenant_peak
        occupancy = sum(map(len, queues.values()))
        if fixed and (occupancy >= total_limit or len(queues[tenant]) >= tenant_limit):
            rejected.append(identifier)
        else:
            queues[tenant].append(identifier)
            admitted.append(identifier)
        peak = max(peak, sum(map(len, queues.values())))
        tenant_peak = max(tenant_peak, max(map(len, queues.values())))

    for tenant, identifier in arrivals:
        admit(tenant, identifier)
    # Cancellation consumes one queued item and releases its slot exactly once.
    def cancel(tenant, identifier):
        if identifier not in queues[tenant]:
            return False
        queues[tenant].remove(identifier)
        cancelled.append(identifier)
        return True

    victim = queues["a"][-1]
    equal(cancel("a", victim), True, "queued cancellation succeeds")
    equal(cancel("a", victim), False, "duplicate cancellation cannot release twice")
    arrivals.append(("a", "replacement"))
    admit("a", "replacement")
    equal("replacement" in admitted, True, "cancelled slot can be reused")
    while any(queues.values()):
        for tenant in ["a", "b"]:
            if queues[tenant]:
                completed.append(queues[tenant].popleft())
    equal(peak <= total_limit, True, "global waiting-work bound")
    equal(tenant_peak <= tenant_limit, True, "per-tenant waiting-work bound")
    equal(completed.index("b0") <= 1, True, "small tenant served within two dispatches")
    equal(collections.Counter(completed + cancelled), collections.Counter(admitted),
          "every admitted ID finishes or cancels exactly once")
    equal(collections.Counter(admitted + rejected),
          collections.Counter(identifier for _, identifier in arrivals), "admission conservation")
    equal(set(completed) & set(rejected), set(), "rejected work never executes")
    equal(sum(map(len, queues.values())), 0, "shutdown drains all waiting work")


LABS = {
    "durable-counter": durable_counter,
    "fenced-worker": fenced_worker,
    "outbox-inbox": outbox_inbox,
    "versioned-cache": versioned_cache,
    "shard-movement": shard_movement,
    "temporal-corrections": temporal_corrections,
    "permission-revocation": permission_revocation,
    "bounded-scheduling": bounded_scheduling,
}


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--counter-worker":
        _, _, path, command, delta, cut, fixed = sys.argv
        counter_worker(path, command, int(delta), cut, bool(int(fixed)))
        return 0
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lab", choices=["all"] + list(LABS), default="all")
    parser.add_argument("--seed", type=int, default=17)
    parser.add_argument("--seeds", type=int, default=5)
    parser.add_argument("--mode", choices=["verify", "broken", "fixed"], default="verify")
    args = parser.parse_args()
    if not 1 <= args.seeds <= 1000:
        parser.error("--seeds must be between 1 and 1000")
    selected = LABS if args.lab == "all" else {args.lab: LABS[args.lab]}
    for name, fixture in selected.items():
        first_counterexample = None
        for seed in range(args.seed, args.seed + args.seeds):
            if args.mode in ("verify", "broken"):
                try:
                    fixture(seed, False)
                except OracleFailure as error:
                    first_counterexample = first_counterexample or str(error)
                    if args.mode == "broken":
                        print(f"FAIL {name} seed={seed}: {error}")
                        return 1
                else:
                    raise OracleFailure(f"{name} seed={seed}: broken mutation escaped oracle")
            if args.mode in ("verify", "fixed"):
                fixture(seed, True)
        print(json.dumps({"lab": name, "mode": args.mode, "seed_start": args.seed,
                          "seeds": args.seeds, "status": "PASS",
                          "counterexample": first_counterexample}, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OracleFailure, subprocess.SubprocessError, sqlite3.Error) as error:
        print(f"FAIL: {error}", file=sys.stderr)
        sys.exit(1)
