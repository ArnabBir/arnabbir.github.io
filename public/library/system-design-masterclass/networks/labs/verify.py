#!/usr/bin/env python3
"""Bounded regression of the Python programs actually printed in network labs.

Uses loopback ports 18081-18088 sequentially. No shell, external dependencies,
privileged networking, or production endpoints. Models are not protocol tests.
"""

from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
from pathlib import Path
import http.client
import os
import re
import socket
import subprocess
import sys
import time


HERE = Path(__file__).resolve().parent
CHECKS = 0


def check(condition, message):
    global CHECKS
    if not condition:
        raise RuntimeError(message)
    CHECKS += 1


def program(number, block=0):
    pages = list(HERE.glob(f"{number:02d}-*.md"))
    check(len(pages) == 1, f"lab {number}: ambiguous page")
    blocks = re.findall(r"python3 - <<'PY'\n(.*?)\nPY", pages[0].read_text(), re.S)
    return blocks[block]


def unused(port):
    with socket.socket() as listener:
        listener.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        listener.bind(("127.0.0.1", port))


def run(source, expected_success=True, expected_error=None):
    result = subprocess.run([sys.executable, "-u", "-c", source],
                            capture_output=True, text=True, timeout=15)
    check((result.returncode == 0) == expected_success,
          f"unexpected fixture exit {result.returncode}: "
          + "\n".join(result.stderr.splitlines()[-3:]))
    if expected_success:
        check(not result.stderr, "fixture background failure: " + result.stderr[-300:])
    if expected_error:
        check(expected_error in result.stderr,
              f"expected {expected_error!r}, not an unrelated fixture failure")
    return result.stdout


@contextmanager
def serving(source, ports):
    for port in ports:
        unused(port)
    # A hostile proxy environment must not redirect the fixed local upstream.
    env = dict(os.environ, http_proxy="http://192.0.2.1:9",
               HTTP_PROXY="http://192.0.2.1:9", no_proxy="", NO_PROXY="")
    process = subprocess.Popen([sys.executable, "-u", "-c", source],
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                               text=True, env=env)
    try:
        for port in ports:
            deadline = time.monotonic() + 5
            while True:
                if process.poll() is not None:
                    raise RuntimeError(f"fixture stopped before listening on {port}")
                try:
                    with socket.create_connection(("127.0.0.1", port), timeout=.1):
                        break
                except OSError:
                    if time.monotonic() >= deadline:
                        raise RuntimeError(f"fixture did not listen on {port}")
                    time.sleep(.01)
        yield
    finally:
        process.terminate()
        try:
            _, errors = process.communicate(timeout=3)
        except subprocess.TimeoutExpired:
            process.kill()
            _, errors = process.communicate(timeout=3)
        check(not errors, "server fixture stderr: " + errors[-300:])
        for port in ports:
            with socket.socket() as probe:
                probe.settimeout(.2)
                check(probe.connect_ex(("127.0.0.1", port)) != 0,
                      f"fixture listener leaked on {port}")


def request(port, path="/", headers=None):
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=2)
    try:
        connection.request("GET", path, headers=headers or {})
        response = connection.getresponse()
        return response.status, response.read().decode()
    finally:
        connection.close()


def main():
    # Syntax-check every standalone heredoc, including optional probe programs.
    for page in sorted(HERE.glob("[0-9][0-9]-*.md")):
        for index, code in enumerate(re.findall(r"python3 - <<'PY'\n(.*?)\nPY",
                                                page.read_text(), re.S)):
            compile(code, f"{page.name}:block{index}", "exec")
            check(True, "compiled")

    with serving(program(1), [18081]):
        status, body = request(18081, "/?delay_ms=0")
        check(status == 200 and len(body) == 2048, "trace baseline body")
        check(request(18081, "/?delay_ms=bad")[0] == 400, "invalid delay")
        check("delay_ms=0" in request(18081, "/?delay_ms=-1")[1], "negative delay")
        started = time.monotonic()
        request(18081, "/?delay_ms=40")
        check(time.monotonic() - started >= .035, "injected delay absent")
        with ThreadPoolExecutor(max_workers=8) as pool:
            bodies = list(pool.map(lambda _: request(18081, "/?delay_ms=40")[1], range(8)))
        ids = [re.search(r"request_id=(\d+)", body)[1] for body in bodies]
        check(len(set(ids)) == 8, "concurrent request IDs collided")
        check("status=200 bytes=2048" in run(program(1, 1)), "Python trace client")
    check("not-connected" in run(program(1, 2)), "trace cleanup probe")

    with serving(program(2), [18082]):
        check("http_status=204" in run(program(2, 1)), "layered probe")
    run(program(2, 1), expected_success=False, expected_error="ConnectionRefusedError")

    unused(18083)
    output = run(program(3))
    check("bytes=1048576" in output, "transfer byte count")
    output = run(program(3).replace("RECEIVER_DELAY = 0.0", "RECEIVER_DELAY = 0.040"))
    duration = float(re.search(r"receiver_seconds=([0-9.]+)", output)[1])
    check(duration >= .035, "receiver delay not observed")
    run(program(3).replace('payload = b"x" * SIZE', 'payload = b"x" * (SIZE - 1)'),
        expected_success=False, expected_error="short transfer: 1 bytes missing")
    with socket.socket() as occupied:
        occupied.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        occupied.bind(("127.0.0.1", 18083)); occupied.listen(1)
        run(program(3), expected_success=False, expected_error="Address already in use")

    with serving(program(4), [18084, 18085]):
        status, body = request(18084, "/demo", {"X-Forwarded-For": "203.0.113.9",
                                                "X-Request-Id": "forged"})
        check(status == 200 and "x-forwarded-for=127.0.0.1" in body,
              "proxy accepted spoof or used environment proxy")
        check("forged" not in body, "request ID spoof")
        check("x-forwarded-for=\n" in request(18085)[1], "direct origin baseline")
        check(request(18084, "http://192.0.2.1/")[0] == 400, "absolute target accepted")
    unused(18085)
    broken_origin = program(4).replace('HTTPConnection("127.0.0.1", 18085',
                                     'HTTPConnection("127.0.0.1", 18089')
    unused(18089)
    with serving(broken_origin, [18084, 18085]):
        check(request(18084)[0] == 502, "upstream refusal not classified")

    output = run(program(5))
    check("negative t=54 ('cache', 'NX', None, 1)" in output, "negative TTL")
    check("negative t=56 ('authority', 'A', '127.0.0.2', 30)" in output, "DNS recovery")
    boundary = program(5).replace("(35, 40, 54, 56)", "(35, 40, 55, 56)")
    check("negative t=55 ('authority', 'A'" in run(boundary), "TTL expiry boundary")

    unused(18086)
    check("SSLError" in run(program(6)), "plaintext peer must fail TLS")
    with socket.socket() as occupied:
        occupied.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        occupied.bind(("127.0.0.1", 18086)); occupied.listen(1)
        run(program(6), expected_success=False, expected_error="Address already in use")

    unused(18087)
    for pool in (4, 8, 16):
        output = run(program(7).replace("40, 16, 4, 100, 50", f"40, 16, {pool}, 100, 50"))
        ok, rejected, errors = map(int, re.search(r"ok=(\d+) rejected=(\d+) errors=(\d+)", output).groups())
        check(ok + rejected + errors == 40 and ok > 0, "pool lost outcomes")
        check(errors == 0, "pool transport interference; rerun on idle host")
    output = run(program(7).replace("40, 16, 4, 100, 50", "40, 16, 4, 300, 50"))
    check("errors=0" in output, "slow dependency fixture")
    output = run(program(7).replace('HTTPConnection("127.0.0.1", 18087',
                                   'HTTPConnection("127.0.0.1", 18089'))
    check("ok=0 rejected=0 errors=40" in output, "all-error pool statistics")

    unused(18088)
    for policy in ("immediate", "backoff", "jitter", "budget"):
        output = run(program(8).replace('= "immediate", 503, 2.0', f'= "{policy}", 503, 2.0'))
        attempts = int(re.search(r"attempts=(\d+)", output)[1])
        check(20 <= attempts <= (40 if policy == "budget" else 80), "retry cap")
    output = run(program(8).replace("code = FAILURE_CODE if elapsed < FAIL_MS else 200", "code = 400"))
    check("attempts=20 " in output and "'non_retryable': 20" in output, "retried HTTP 400")
    output = run(program(8).replace("20, 4, 250", "20, 4, 0"))
    check("successes=20" in output and "attempts=20 " in output, "healthy retry recovery")

    outputs = {number: run(program(number)) for number in range(9, 17)}
    check("h2-loss  B 80" in outputs[9] and "h2-loss  A 65" in outputs[9], "H2 loss gate")
    check("fallback_ready_ms 440" in outputs[10], "QUIC fallback arithmetic")
    check("120 0 300 0 300" in outputs[11], "drain populations")
    check("conntrack_exhaustion_s 15.0" in outputs[12], "conntrack slope")
    check("B 120.0 620.0 8.82" in outputs[13] and "C 72.0 402.0 10.67" in outputs[13], "anycast veto")
    check("spike_bucket_attempts_s 249333.33" in outputs[14], "fixed-delay burst")
    check("remaining_queue_fill_s 0.08" in outputs[15], "mesh intervention window")
    check(outputs[16].count("mtls=PASS") == 10 and outputs[16].count("mtls=FAIL") == 6,
          "mTLS must require both trust directions")

    for page in HERE.glob("[0-9][0-9]-*.md"):
        text = page.read_text()
        check('<details markdown="1">' in text and not re.search(r"<details\b[^>]*\bopen\b", text), f"answer exposed: {page.name}")
        check(len(re.findall(r"<details\b[^>]*>", text)) == text.count("</details>"), f"unbalanced answer: {page.name}")

    root = HERE.parent
    mesh = root / "scenarios/mesh-certificate-rotation"
    rows = 0
    for line in (mesh / "exemplars.md").read_text().splitlines():
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if len(cells) >= 11 and all(re.fullmatch(r"[0-4]", cell) for cell in cells[:10]):
            check(sum(map(int, cells[:10])) == int(cells[10].split("/")[0]),
                  "mesh exemplar raw score mismatch")
            rows += 1
    check(rows == 5, "all five exemplar vectors must be checked")
    check((2 * 26 * 40 + 32) // (2 * 32) == 33, "normalization half-up tie")
    weights = re.findall(r"^### \d+\..* - (\d+) points$",
                         (root / "l5-l6-rubric.md").read_text(), re.M)
    check(len(weights) == 10 and sum(map(int, weights)) == 100, "track rubric weights")
    check(2 * 3 * 2 * 2 == 24 and 12000 * 24 == 288000, "mesh attempt tree")
    check(abs((14 * .18) / (43200 * .0005) * 100 - 11.6666667) < .0001,
          "constant-volume error budget sensitivity")
    check(24 - (8 + 12 + 6) == -2, "certificate runway shortfall")
    check(abs((2 * 1024**2 / .06) * 8 / 1e6 - 279.6202667) < .0001,
          "binary window and decimal bit-rate conversion")
    for name in ("design-review.md", "failure-lab.md"):
        text = (mesh / name).read_text()
        check(len(re.findall(r"<details\b[^>]*>", text)) == text.count("</details>") == 1,
              f"mesh answer disclosure: {name}")
    for name in ("07-http2-http3-quic.md", "08-tls-pki.md"):
        text = (root / name).read_text()
        check(len(re.findall(r"<details\b[^>]*>", text)) == text.count("</details>") == 3,
              f"chapter answer disclosure: {name}")
    print(f"PASS: {CHECKS} checks across 16 labs plus mesh/chapter regressions; "
          "loopback fixtures and offline models only")


if __name__ == "__main__":
    main()
