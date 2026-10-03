"""Run the reviewed, local-only lab fixtures and selected regression cases.

Run from any directory with Python 3. No files are written. This is not a
sandbox: review changes to the Markdown commands before running this test.
"""

import contextlib
import io
import math
from pathlib import Path
import re
import subprocess


ROOT = Path(__file__).resolve().parents[3]
LABS = Path(__file__).resolve().parent


def run(source, expected):
    output = io.StringIO()
    with contextlib.redirect_stdout(output):
        exec(compile(source, "<reviewed-lab-fixture>", "exec"), {})
    result = output.getvalue()
    for fragment in expected:
        assert fragment in result, (fragment, result)
    return result


def main():
    expected = {
        "01": ["input 7900", "total 11539 fits True spare 4845", "max_sequences 1", "0.005556"],
        "02": ["r1 small ok 3000", "r2 DENY policy 0", "r3 large ok 48000", "r4 large ok 12000", "units 63000"],
        "03": ["q1 exact ['a', 'b'] approx ['a', 'b'] recall 1.0 work 4 of 6", "q2 exact ['c', 'd'] approx ['d', 'e'] recall 0.5 work 2 of 6"],
        "04": ["d1 0.032266", "d3 0.032266", "top3 ['d1', 'd3', 'd2']", "reciprocal_rank 1.0"],
        "05": ["macro_recall 0.5", "mrr 0.5", "citation_support 0.5", "unanswerable_abstention 1.0"],
        "06": ["chunks 4 visible_after_delete 0"],
        "07": ["workflow_success 0.991025", "0.941192", "0.903921", "0.817073", "stopped True"],
        "08": ["attempt1 TimeoutError", "effect_count 1 call_count 2"],
        "09": ["effects {'r9:lookup': 'effect-1'} events 6"],
        "10": ["mean_delta 0.1000", "ci95 0.0015 0.1985", "quality_pass True", "latency_pass False", "release False"],
        "11": ["proposal search_catalog (True, 'allowed')", "proposal send_email (False, 'capability')", "secret_in_output False"],
        "12": ["demand_tok_s 2800.0 usable_tok_s 768.0 growth_tok_s 2032.0", "after_shed 1800.0 headroom -1032.0"],
    }
    fixtures = {}
    baselines = {}
    for number, fragments in expected.items():
        path, = LABS.glob(number + "-*.md")
        source, = re.findall(r"python3 - <<'PY'\n(.*?)\nPY", path.read_text(), re.S)
        fixtures[number] = source
        baselines[number] = run(source, fragments)
        print("PASS baseline", path.name)

    cases = [
        ("01", "5*1100", "10*1100", ["total 17039 fits False spare -655"]),
        ("01", "5*1100", "9*1100", ["total 15939 fits True spare 445", "max_sequences 1"]),
        ("02", "('r2','restricted',3000,False)", "('r2','restricted',3000,True)", ["r2 DENY policy 0"]),
        ("03", "(.4,.6)", "(.51,.49)", ["q2 exact ['c', 'd'] approx ['c', 'b'] recall 0.5"]),
        ("04", "vec=['d3','d5','d1','d6']", "vec=['d3','d5','d6']", ["top3 ['d3', 'd1', 'd2']"]),
        ("04", "k=60", "k=1", ["d1 0.750000", "d3 0.750000"]),
        ("05", "('q4',set(),['x','y'],False,True)", "('q4',set(),['x','y'],True,False)", ["citation_support 0.3333333333333333", "unanswerable_abstention 0.0", "macro_recall 0.5"]),
        ("06", "f'{version}:{start}:{text}'", "f'{start}:{text}'", ["chunks 4 visible_after_delete 0"]),
        ("07", "budget=5", "budget=3", ["bounded_trace ['plan', 'read', 'read'] stopped True"]),
        ("08", "print('attempt2',commit(key,500))", "print('attempt2',commit('order-77:charge:v2',500))", ["effect_count 2 call_count 2"]),
        ("09", "e[1]=='tool_result'", "e[1]=='decision'", ["effects {'r9:lookup': 'effect-1'} events 7"]),
        ("10", "[1]*18+[-1]*8+[0]*74", "[1]*12+[-1]*8+[0]*80", ["mean_delta 0.0400", "quality_pass False", "release False"]),
        ("11", "capabilities={'search_catalog'}", "capabilities={'search_catalog','send_email'}", ["proposal send_email (False, 'data-loss')", "secret_in_output False"]),
        ("12", "('standard',2.0,600)", "('standard',0.2,600)", ["after_shed 720.0 headroom 48.0", "drain_seconds_for_60000 1250.0"]),
    ]
    for number, old, new, fragments in cases:
        assert old in fixtures[number], (number, old)
        run(fixtures[number].replace(old, new), fragments)
    encoded = fixtures["11"].replace("capabilities={'search_catalog'}", "capabilities={'search_catalog','send_email'}")
    encoded = encoded.replace("('send_email',{'body':SECRET})", "('send_email',{'body':'REVNT19TRUNSRVQ='})")
    run(encoded, ["proposal send_email (True, 'allowed')", "secret_in_output True"])
    print("PASS injected variants", len(cases) + 1)

    for number, source in fixtures.items():
        assert run(source, expected[number]) == baselines[number], number
    print("PASS restored baselines", len(fixtures))

    assert math.ceil(math.log(.05) / math.log(.99)) == 299
    assert round(1 - .05 ** (1 / 300), 6) == .009936
    assert sum([9, 10, 12, 10, 12, 14, 14, 10, 6, 3]) == 100
    assert round(28 / 36 * 40) == 31
    assert math.ceil(18000 / 660) == 28 and 28 * 660 >= 18000
    assert math.ceil((120000000 * 420 / 86400) / 12600) == 47
    assert 2000 * 86400 * .01 * 40000 == 69120000000
    print("PASS selected chapter arithmetic 7")

    pages = sorted((ROOT / "docs/applied-ai").rglob("*.md"))
    diagrams = 0
    for page in pages:
        text = page.read_text()
        assert text.isascii(), page
        assert len(re.findall(r"<details(?:\s[^>]*)?>", text)) == text.count("</details>"), page
        assert len(re.findall(r"^```", text, re.M)) % 2 == 0, page
        diagrams += len(re.findall(r"^```mermaid$", text, re.M))
        relative = page.relative_to(ROOT).as_posix()
        before = subprocess.run(["git", "show", "HEAD:" + relative], cwd=ROOT, capture_output=True, text=True, check=True).stdout
        headings = lambda value: re.findall(r"^#{1,6} .+$", value, re.M)
        assert headings(before) == headings(text), (page, "heading changed")
    print("PASS structural pages", len(pages), "mermaid blocks", diagrams)
    print("NOTE: structural checks do not establish source accuracy, link validity, or visual rendering.")


if __name__ == "__main__":
    main()
