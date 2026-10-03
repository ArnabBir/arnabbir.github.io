#!/usr/bin/env python3
"""Offline arithmetic, framing, scoring and model regressions for network docs.

No sockets, external services, money, routing changes or file writes. These
models test stated rules, not a deployed payment/session/transport system.
"""
from pathlib import Path
from fractions import Fraction
import ipaddress
import math
import re

ROOT = Path(__file__).resolve().parent
checks = 0


def check(ok, why):
    global checks
    if not ok:
        raise RuntimeError(why)
    checks += 1


def near(actual, expected, why, tolerance=.001):
    check(abs(actual - expected) <= tolerance, why)


def decode_uncompressed(chunks, maximum=1024):
    pending = b''; messages = []
    for chunk in chunks:
        pending += chunk
        while len(pending) >= 5:
            if pending[0] != 0:
                raise ValueError('compression not supported by this fixture')
            length = int.from_bytes(pending[1:5], 'big')
            if length > maximum:
                raise ValueError('message exceeds allocation limit')
            if len(pending) < 5+length:
                break
            messages.append(pending[5:5+length]); pending = pending[5+length:]
    if pending:
        raise ValueError('truncated header or body')
    return messages


def main():
    # Every workbook problem has an independently evaluated result/bound.
    network = ipaddress.ip_network
    address = ipaddress.ip_address
    cases = [
        (1, (network('10.42.16.0/20').num_addresses, len(list(network('10.42.16.0/20').subnets(new_prefix=24)))), (4096, 16)),
        (2, str(network('192.0.2.141/26', strict=False)), '192.0.2.128/26'),
        (3, [str(n) for n in network('10.8.0.0/21').subnets(new_prefix=23)],
         ['10.8.0.0/23', '10.8.2.0/23', '10.8.4.0/23', '10.8.6.0/23']),
        (4, [str(n) for n in ipaddress.collapse_addresses([network(f'172.16.{i}.0/24') for i in range(8, 12)])], ['172.16.8.0/22']),
        (5, (1500 * 140 // 100, 2**11 - 5, 2**12 - 5), (2100, 2043, 4091)),
        (6, (2**(48-40), 2**(64-48)), (256, 65536)),
        (7, 1.5e6 * 8 / 1e8, .12),
        (8, (1500 * 8 / 1e9, 10e6 * 8 / 1e9), (.000012, .08)),
        (9, 2 * 6000 / 200000, .06),
        (10, 2e9 * .080 / 8, 20e6),
        (11, 3e6 / .075 * 8, 320e6),
        (12, min(4 * 320e6, 1e9), 1e9),
        (13, (3 * 45 + 30, 45 + 30), (165, 75)),
        (14, 2 * 45 + 30, 120),
        (15, 1000 * (900 + 36) + 4000, 940000),
        (16, (400 / 10 * 8, 460 / 10 * 8), (320, 368)),
        (17, (80 * 100000 * 8 / 1e6, 150 * 100000 * 8 / 1e6), (64, 120)),
        (18, Fraction(28000, 60), Fraction(1400, 3)),
        (19, math.ceil(Fraction(3000, 1) / Fraction(3, 4) / Fraction(28000, 60)), 9),
        (20, (12000 * 40, 480000 / 600000), (480000, .8)),
        (21, 100000 / 8000, 12.5),
        (22, round(8000 * .0012 / .6, 6), 16),
        (23, round(2000 * .0012 + 8000 * .00025, 6), 4.4),
        (24, round(18000 * .022, 6), 396),
        (25, 18000 * .180, 3240),
        (26, 7500 / (19000-14000), 1.5),
        (27, (3*2*2, 5000*3*2*2), (12, 60000)),
        (28, (20000 + 20000*.3, 20000*.05), (26000, 1000)),
        (29, 20 * 60, 1200),
        (30, (30000/2, 1000/16000), (15000, .0625)),
        (31, round(24000/(300-40), 3), 92.308),
        (32, round(18000*2*1.2*1.15/1000*2, 6), 99.36),
        (33, (500+220*.55, 300+220*.3, 140+220*.15), (621, 366, 173)),
        (34, round(75000*32000/1e9*.4*86400*.01, 6), 829.44),
        (35, round(829.44*30*.75-12*180, 6), 16502.4),
        (36, 700-80-2*90-45-250, 145),
    ]
    for number, actual, expected in cases:
        check(actual == expected, f'workbook problem {number}: {actual} != {expected}')
    near(900000/940000*100, 95.74468, 'wire efficiency')
    near(400/460*100, 86.95652, 'retransmission efficiency')

    # Chapter bounds and independently constructed route/fragment examples.
    check((65536 // 1460, 65536 % 1460) == (44, 1296), 'packet count')
    near(12 * 2**20 * 8 / 1e9 * 1000, 100.663296, 'egress queue')
    check(str(network('10.24.37.142/20', strict=False)) == '10.24.32.0/20', 'CIDR20')
    check(str(network('172.20.77.9/21', strict=False)) == '172.20.72.0/21', 'CIDR21')
    check(address('172.20.80.1') not in network('172.20.72.0/21'), 'prefix boundary')
    routes = [network(n) for n in ['10.0.0.0/8', '10.64.0.0/10', '10.80.0.0/16', '10.80.4.0/22']]
    for ip, prefix in [('10.80.6.7', 22), ('10.80.9.1', 16), ('10.100.1.1', 10)]:
        check(max(n.prefixlen for n in routes if address(ip) in n) == prefix, 'longest match')
    check(math.ceil(369/256) == 2, 'deployment needs a /23 not /24')
    check(1500-76-50 == 1374 and 1374-60 == 1314, 'nested MTU')
    for size, mtu, expected in [(4000, 1500, [1480, 1480, 1020]), (3000, 1000, [976, 976, 976, 52])]:
        remaining = size-20
        fragment = (mtu-20)//8*8
        parts = []
        while remaining:
            take = min(fragment, remaining)
            parts.append(take); remaining -= take
        check(parts == expected and all(p+20 <= mtu for p in parts), 'IPv4 fragments')
    check(math.ceil(2**30/1460) == 735440 and math.ceil(2**30/1360) == 789517, 'MSS packet counts')
    near(1-.999**3, .002997001, 'fragment loss')
    near(4*2**20/.05*8/1e6, 671.08864, 'window bound')
    check(math.ceil(2000/.7) == 2858, 'pool ceiling')
    near(104000*96/1024**2, 9.521484, 'socket GiB')
    check(math.ceil(450000/(60000*.7))+1 == 12, 'NAT N+1')
    near(600000+800000*.55, 1040000, 'anycast B')
    near(900000+500000*.7*1.1, 1285000, 'anycast Y')
    near(60000*.15*(.8+2)*2*1.25/1000, 63, 'TURN aggregate')
    check(2000*500*20*10*3 == 600000000, 'metric cardinality')

    # Incremental five-byte gRPC prefix handling under arbitrary read partition.
    wire = b'\0' + (7).to_bytes(4, 'big') + b'payload'
    wire += b'\0' + (2).to_bytes(4, 'big') + b'ok'
    for chunk in range(1, len(wire)+1):
        messages = decode_uncompressed(wire[i:i+chunk] for i in range(0, len(wire), chunk))
        check(messages == [b'payload', b'ok'], 'read boundaries are not message boundaries')
    for invalid, reason in [(b'\0'+b'\xff'*4, 'allocation limit'),
                            (wire[:-1], 'truncated'), (wire[:3], 'truncated')]:
        try:
            decode_uncompressed([invalid])
        except ValueError as error:
            check(reason in str(error), 'expected framing failure, not an unrelated error')
        else:
            raise RuntimeError('invalid frame was accepted')

    # Checkout: separate physical connections, call permits and offered demand.
    check(80*4*4 == 1280 and 3920*.18 < 1280, 'baseline payment feasibility')
    check(7700*.88 > 1280 and round(7700*.93) == 7161, 'incident required versus admitted load')
    near(20900/7700, 2.714286, 'offered attempt ratio')
    check(2**4 == 16, 'four retry layers')
    # Single-dispatch claim: a stable key alone is the known-broken alternative.
    for atomic_claim in (False, True):
        claimed = False; dispatched = 0
        for _ in range(2):
            if not atomic_claim or not claimed:
                claimed = True; dispatched += 1
        check(dispatched == (1 if atomic_claim else 2), 'dispatch mutation/control')
    # Installed-epoch equality, not a read-before-write flag, excludes stale effects.
    installed = 8
    check(7 != installed and 8 == installed, 'stale session generation denied')
    old_final, shadow_before, shadow_after = 101, 100, 101
    check(shadow_before != old_final and shadow_after == old_final, 'post-fence catch-up gate')
    cursor = 100; buffered = set()
    for seq in (102, 101, 101, 103):
        if seq > cursor:
            buffered.add(seq)
        while cursor+1 in buffered:
            buffered.remove(cursor+1); cursor += 1
    check(cursor == 103 and not buffered, 'contiguous replay with duplication/reorder')
    check(99 < 100, 'cursor older than retained lower bound requires full sync')

    # Global failover, burst envelope and impossible three-second mass recovery.
    check(24000000/5 == 4800000 and 24000000/4 == 6000000, 'N-1/N-2')
    near(.4/5.2*100, 7.692308, 'N-1 margin')
    check(24000000-4*5200000 == 3200000, 'regional admission deficit')
    check(4000000/5 == 800000 and 4000000/1 == 4000000, 'cycle mean versus burst')
    check(4000000/(5*18000) > 3, 'mass warm-reconnect SLO impossible')
    near(4000000/(5*12000), 66.666667, 'ideal gated recovery')
    check(8*55000-401000 == 39000, 'hot destination NAT margin')
    check(24000000/30 == 800000, 'heartbeat load')

    # Score each displayed vector; reject inflated totals and banker's rounding.
    for pack in ['checkout-edge-brownout', 'global-realtime-failover']:
        text = (ROOT / 'scenarios' / pack / 'exemplars.md').read_text()
        vectors = re.findall(r'A([0-4]) B([0-4]) C([0-4]) D([0-4]) E([0-4]) F([0-4]) G([0-4]) H([0-4]) I([0-4]) J([0-4]) = \*\*(\d+)/40', text)
        check(len(vectors) == 5, f'{pack}: five explicit exemplar scores')
        for row in vectors:
            check(sum(map(int, row[:10])) == int(row[10]), f'{pack}: score sum')
        table_rows = 0
        for line in text.splitlines():
            cells = [c.strip() for c in line.strip('|').split('|')]
            if len(cells) >= 12 and all(re.fullmatch('[0-4]', c) for c in cells[1:11]):
                check(sum(map(int, cells[1:11])) == int(cells[11]), f'{pack}: score table')
                table_rows += 1
        check(table_rows == 5, f'{pack}: five table rows')
    check(math.floor(40*26/32+.5) == 33, 'half-up normalization')
    check(math.floor(40*25/36+.5) == 28, 'global normalization')
    check(math.floor(40*23/28+.5) == 33, 'checkout normalization')
    pages = sorted(ROOT.rglob('*.md'))
    check(len(pages) == 67, 'assigned page inventory')
    for page in pages:
        text = page.read_text()
        depth = 0
        for line in re.sub(r'^```[^\n]*\n[\s\S]*?^```\s*$', '', text, flags=re.M).splitlines():
            if '<details' in line:
                check(' open' not in line, f'{page.name}: disclosure starts open')
                depth += 1
            if '</details>' in line:
                depth -= 1
                check(depth >= 0, f'{page.name}: extra disclosure close')
            if re.match(r'^\*\*Solution[.:]', line):
                check(depth > 0, f'{page.name}: visible worked solution')
            if re.match(r'^### (?:Problem \d|Exercise \d)', line):
                check(depth == 0, f'{page.name}: next question hidden in prior answer')
        check(depth == 0, f'{page.name}: unclosed disclosure')
    check(len(re.findall(r'<details\b[^>]*>', (ROOT / 'calculations-workbook.md').read_text())) == 36,
          'all 36 workbook answers individually folded')
    print(f'PASS: {checks} offline checks; 36 workbook problems, chapter arithmetic, '
          'framing, 10 exemplar vectors/tables, and bounded scenario models')


if __name__ == '__main__':
    main()
