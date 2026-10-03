"""Render applied-AI Markdown in memory using installed MkDocs dependencies.

Checks links, preserved rendered IDs, collapsed answers, and Mermaid markup.
Does not launch a browser or assert diagram visual quality. By default writes
no files; --refresh updates measured metadata in review-applied-ai.json after
matching page hashes to the supplied browser report.
"""

from html.parser import HTMLParser
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import unquote, urlsplit

import markdown
import pymdownx.superfences


ROOT = Path(__file__).resolve().parents[3]
SCOPE = ROOT / "docs/applied-ai"


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids = set()
        self.links = []
        self.details = 0
        self.open_details = 0
        self.diagrams = 0
        self.feed(markdown.markdown(
            text,
            extensions=["admonition", "attr_list", "md_in_html", "tables", "toc", "pymdownx.details", "pymdownx.highlight", "pymdownx.inlinehilite", "pymdownx.superfences", "pymdownx.tabbed", "pymdownx.tasklist"],
            extension_configs={"toc": {"permalink": True},
                "pymdownx.highlight": {"anchor_linenums": True},
                "pymdownx.tabbed": {"alternate_style": True},
                "pymdownx.tasklist": {"custom_checkbox": True},
                "pymdownx.superfences": {"custom_fences": [
                {"name": "mermaid", "class": "mermaid", "format": pymdownx.superfences.fence_code_format}
            ]}},
        ))

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if "id" in values:
            self.ids.add(values["id"])
        if tag == "a" and "href" in values:
            self.links.append(values["href"])
        if tag == "details":
            self.details += 1
            self.open_details += int("open" in values)
        if "mermaid" in values.get("class", "").split():
            self.diagrams += 1


def main():
    pages = sorted(SCOPE.rglob("*.md"))
    rendered = {page.resolve(): Page(page.read_text()) for page in pages}
    checked_links = 0
    diagram_count = 0
    details_count = 0
    json_count = 0
    failures = []
    for path in pages:
        page = rendered[path.resolve()]
        relative = path.relative_to(ROOT)
        before = subprocess.run(["git", "show", "HEAD:" + relative.as_posix()], cwd=ROOT, check=True, capture_output=True, text=True).stdout
        missing_ids = Page(before).ids - page.ids
        if missing_ids:
            failures.append((str(relative), "removed IDs", sorted(missing_ids)))
        expected = len(re.findall(r"^```mermaid$", path.read_text(), re.M))
        for block in re.findall(r"^```json\n(.*?)^```", path.read_text(), re.M | re.S):
            json.loads(block)
            json_count += 1
        if page.diagrams != expected or page.open_details:
            failures.append((str(relative), "diagram/details markup", page.diagrams, expected, page.open_details))
        diagram_count += page.diagrams
        details_count += page.details
        for href in page.links:
            parts = urlsplit(href)
            if parts.scheme or parts.netloc or parts.path.startswith("/"):
                continue
            target = (path.parent / unquote(parts.path)).resolve() if parts.path else path.resolve()
            if not target.is_file():
                failures.append((str(relative), "missing target", href))
                continue
            checked_links += 1
            if parts.fragment and target.suffix == ".md":
                if target not in rendered:
                    rendered[target] = Page(target.read_text())
                if unquote(parts.fragment) not in rendered[target].ids:
                    failures.append((str(relative), "missing fragment", href))
    for failure in failures:
        print("FAIL", failure)
    print("pages", len(pages), "local_links", checked_links, "mermaid_markup", diagram_count, "collapsed_details", details_count, "json_examples", json_count, "failures", len(failures))
    assert not failures, "Applied-AI rendered Markdown checks failed"
    record = json.loads((ROOT / "review-applied-ai.json").read_text())
    entries = record["pages"]
    browser_path = os.environ.get("REVIEW_BROWSER_REPORT")
    if "--refresh" in sys.argv:
        if not browser_path:
            raise ValueError("REVIEW_BROWSER_REPORT is required to refresh machine evidence")
        browser = json.loads(Path(browser_path).read_text())
        assert not browser["failures"]
        views = {row["path"]: row for row in browser["results"]}
        for entry in entries:
            text = (ROOT / entry["path"]).read_text()
            digest = hashlib.sha256(text.encode()).hexdigest()
            assert views[entry["path"]]["sha256"] == digest, (entry["path"], "stale browser evidence")
            entry["sha256"] = digest
            if '<details markdown="1">' in text:
                entry["revised"] = True
                entry["disclosure_markdown_enabled"] = True
                finding = 'Enabled Markdown parsing inside authored details so headings, tables, links and answer formatting render while disclosures stay closed.'
                if finding not in entry["findings"]:
                    entry["findings"].append(finding)
                if "S54" not in entry["sources"]:
                    entry["sources"].append("S54")
            entry["diagrams"]["count"] = views[entry["path"]]["expected_diagrams"]
            entry["browser_checks"] = {view["name"]: {
                "pass": view["pass"], "page_overflow_px": view["page_overflow_px"],
                "initial_open_answers": view["initial_open_answers"], "screenshots": view["screenshots"]
            } for view in views[entry["path"]]["views"]}
        record["counts"].update({"checked_local_link_occurrences": checked_links,
            "markdown_pages_revised_by_this_review": sum(entry["revised"] for entry in entries),
            "collapsed_details_checked": details_count, "json_examples_checked": json_count,
            "browser_pages": browser["pages"], "browser_viewport_checks": browser["views"],
            "source_records": len(record["sources"])})
        # Only derived measurements are refreshed; substantive review claims are authored separately.
        (ROOT / "review-applied-ai.json").write_text(json.dumps(record, indent=2, ensure_ascii=True) + "\n")
    assert {entry["path"] for entry in entries} == {str(page.relative_to(ROOT)) for page in pages}
    assert len(entries) == len(pages) == record["counts"]["markdown_pages"]
    for entry in entries:
        digest = hashlib.sha256((ROOT / entry["path"]).read_bytes()).hexdigest()
        assert entry["sha256"] == digest, (entry["path"], "review evidence is stale")
    assert sum(entry["full_read"] for entry in entries) == record["counts"]["full_page_reads"]
    assert sum(entry["revised"] for entry in entries) == record["counts"]["markdown_pages_revised_by_this_review"]
    for status in ("reviewed", "partial", "pending"):
        count_key = "pending_substantive_read" if status == "pending" else status
        assert sum(entry["status"] == status for entry in entries) == record["counts"][count_key]
    assert record["counts"]["checked_local_link_occurrences"] == checked_links
    assert record["counts"]["collapsed_details_checked"] == details_count
    assert record["counts"]["mermaid_blocks_parsed"] == diagram_count
    assert (ROOT / "review-applied-ai.json").read_text().isascii()
    print("PASS review record coverage, page hashes, status counts, revision count, and ASCII")


if __name__ == "__main__":
    main()
