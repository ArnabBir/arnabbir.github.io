"""Independent arithmetic and calibration regression checks; no external calls."""

from datetime import datetime
import hashlib
import math
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]


def main():
    # One independently calculated scalar per numbered workbook problem.
    dcg = 7 + 1 / math.log2(3) + 3 / math.log2(4)
    ideal = 7 + 3 / math.log2(3) + 1 / math.log2(4)
    values = [
        (16384 - (900 + 700 + 4800 + 1600 + 2000 + math.ceil(16384 * .1)), 4745),
        (5250 // 750, 7), (19200 - 16384, 2816), (3 * 600, 1800),
        (math.ceil(1800 / (125 * .8)), 18), (8 * 400 / 32, 100),
        (.7 + 479 / 60, 8.6833333333), (2400 / 800, 3),
        (7e9 * 2 / 1e9, 14), (13e9 * 4 / 8 * 1.08 / 1e9, 7.02),
        (2 * 32 * 8 * 128 * 2, 131072), (131072 * 8000 / 2**30, .9765625),
        (math.floor(12 / .977), 12), (48 - 30 - 48 * .15, 10.8),
        (60 / 4 * 1.1, 16.5), (4000 * .8 - 3100, 100),
        (3 / (150 * 3600) * 1e6, 5.5555555556),
        (3000 / 1e6 * 2 + 500 / 1e6 * 8, .01), (10 * 86400 * .006, 5184),
        (2000 - 2000 * (.65 + .35 * .2), 560), (25 * 7200 * (.04 - .01), 5400),
        (12000 * 2 * (2500 / 1e6 + 300 / 1e6 * 5), 96),
        (3 / 5, .6), (3 / 6, .5), (1 / 4, .25), ((1 + .5 + 0 + .25) / 4, .4375),
        (dcg, 9.1309297536), (dcg / ideal, .9721212198),
        (1 / 62 + 1 / 65, .0315136476), (80 / 100, .8),
        (1 - 40000 / 2000000, .98), (10e6 * 768 * 4 / 1e9, 30.72),
        (800 / (800 - 200), 1.3333333333),
        (math.sqrt(.85 * .15 / 1000), .0112915898),
        (math.sqrt((.8 * .2 + .84 * .16) / 1000), .0171580885),
        (math.ceil(3 / .01), 300), (87 / 100, .87), (30 / 40, .75),
        (.995**4, .9801495006), (12000 / 10000, 1.2),
        ((2500 - 2000) * 180, 90000), (90000 / (2000 - 1500), 180),
        (4 * 6, 24), (2 / 1000, .002),
    ]
    text = (ROOT / 'calculations-workbook.md').read_text()
    numbered = re.findall(r'^### (\d+)\.', text, re.M)
    assert numbered == [str(i) for i in range(1, 45)]
    assert len(values) == 44
    for number, (actual, expected) in enumerate(values, 1):
        assert math.isclose(actual, expected, rel_tol=1e-7, abs_tol=1e-8), (number, actual, expected)
    print('PASS 44 numbered workbook calculations')

    scores = {
        'enterprise-knowledge-assistant': ([3, 16, 29, 27, 38], [3, 16, 29, 27, 38]),
        'incident-response-copilot': ([0, 10, 32, 33, 38], [0, 10, 32, 33, 38]),
        'support-resolution-agent': ([1, 8, 17, 28, 37], [1, 8, 17, 28, 37]),
    }
    for pack, (expected_raw, expected_final) in scores.items():
        rows = []
        for line in (ROOT / 'scenarios' / pack / 'exemplars.md').read_text().splitlines():
            cells = [x.strip() for x in line.strip('|').split('|')]
            if len(cells) == 13 and all(x.isdigit() for x in cells[1:12]):
                assert all(0 <= int(x) <= 4 for x in cells[1:11]), cells
                assert sum(map(int, cells[1:11])) == int(cells[11]), cells
                final = int(re.match(r'\d+', cells[12]).group())
                assert final <= int(cells[11]), cells
                rows.append((int(cells[11]), final))
        assert rows == list(zip(expected_raw, expected_final)), (pack, rows)
    for available in (16, 20, 24, 28, 32, 36, 40):
        for subtotal in range(available + 1):
            rounded = (subtotal * 80 + available) // (2 * available)
            assert 0 <= rounded <= 40
            assert rounded == math.floor(subtotal / available * 40 + .5)
    print('PASS 15 exemplar raw/final scores and exhaustive mode rounding')

    assert math.ceil(2400 / (8 - 20000 / 3600)) == 982
    allocation = 600e6 * (1024 * 2 + 576 + 1500) * 2 / .7 / 1e12
    assert round(allocation, 2) == 7.07
    assert round(allocation * 2.2, 2) == 15.55
    assert round((600e6 / (14 * 86400) + 5e6 * 12 / 86400) * 2) == 2381
    assert 16 * (4096 + 4096) == 131072
    assert 10e6 * .8 * .95 * .6 * .5 == 2280000
    assert math.ceil(2000 / 120) == 17
    assert math.ceil(math.log(.05) / math.log(.99)) == 299
    assert (1 / 62 + 1 / 65) > 0 and (3 / 6) == .5
    assert math.isclose(2 * sum(math.comb(26, j) for j in range(9)) / 2**26, .0755186975)
    assert datetime.fromisoformat('2026-09-06T10:00:00') < datetime.fromisoformat('2026-09-06T10:01:40')
    assert 864 / 360 == 2.4 and 39 / 24 == 1.625
    assert 39 / 24 != 1.61  # Single-run and aggregate denominators are distinct.
    assert 1397 - 1284 == 113 and 186400 / 100 == 1864
    assert 40 <= 50 and 40 + 40 > 60  # Cumulative race without per-case rejection.
    assert (6 - 2) * 1200 == 4800 and 4800 / (8 - 2) == 800
    assert 300 + 180 == 480 and 300 + 40 + 180 + 50 == 570
    print('PASS 17 chapter/scenario regression assertions')

    source = 'Policy A. Refunds require receipt. Exceptions require manager approval.'
    def chunks(version, with_version):
        result = []
        for start in range(0, len(source), 18):
            span = source[start:start + 24]
            identity = f'{version}:{start}:{span}' if with_version else f'{start}:{span}'
            result.append(hashlib.sha256(identity.encode()).hexdigest())
            if start + len(span) == len(source):
                break
        return result
    assert chunks('policy-7', False) == chunks('policy-8', False)
    assert not set(chunks('policy-7', True)) & set(chunks('policy-8', True))
    assert len(source) == 71 and sum((24, 24, 24, 17)) - len(source) == 18
    print('PASS 3 cross-version ingestion identity assertions')


if __name__ == '__main__':
    main()
