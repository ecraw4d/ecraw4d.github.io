#!/usr/bin/env python3
"""
build_archive.py: builds the Solidarity newspaper archive on ecraw.com.

    python3 tools/solidarity/build_archive.py ~/solidarity_archive

Reads the per-issue PDFs and OCR text files in your archive folder and writes:

  In the website repo
    solidarity/issues.json               catalog of every issue (the archive page loads this)
    solidarity/issues/<date>.html        one page per issue: the OCR text, split by page
    solidarity/solidarity-ocr-text.zip   all OCR text in one download
    solidarity/pagefind/                 the search index (built by Pagefind)

  In the archive folder (for uploading to the Internet Archive)
    ia_issues.csv                        one Internet Archive item per issue (PDF + text)
    ia_years.csv                         one item per year (the full-year PDFs)

Run it again any time the files change; it overwrites what it made last time.
Needs:  pip3 install "pagefind[extended]"     (for the search index)
"""
import csv, html, json, re, shutil, subprocess, sys, zipfile
from pathlib import Path

# ---------------------------------------------------------------- settings
IA_PREFIX = "iww-solidarity"          # Internet Archive IDs become  iww-solidarity-1913-03-08
SITE = Path(__file__).resolve().parents[2]
OUT = SITE / "solidarity"

SOURCE_CREDIT = ("Scans from the Mapping American Social Movements Project, University of Washington "
                 "(https://depts.washington.edu/iww/solidarity_intro.shtml). "
                 "Text by Ethan Crawford using Google Document AI OCR.")
SUBJECTS = ["Industrial Workers of the World", "IWW", "Labor movement -- United States",
            "Labor newspapers", "Solidarity (New Castle, Pa.)"]

MONTHS = {m: i for i, m in enumerate("jan feb mar apr may jun jul aug sep oct nov dec".split(), 1)}
NAME = re.compile(r"^v0?(?P<vol>\d+)(?:n(?P<no>\d+))?(?:-?w(?P<whole>\d+))?-?(?P<mon>[a-z]{3})-(?P<day>\d{1,2})-"
                  r"(?P<year>\d{4})-solidar\w*(?P<note>.*)\.(?:pdf|txt)$", re.I)

# File names that don't follow the pattern: file stem -> fields
OVERRIDES = {
    "Solidarity_1917-_4-28_comp": dict(vol="8", no=None, whole=None, date="1917-04-28", note="comp"),
}
# Words in the file names -> readable labels (add your own)
NOTE_LABELS = {"2pgs": "2 pages", "10pgs": "10 pages", "comp": "composite", "pg": "page"}


def parse(stem):
    if stem in OVERRIDES:
        return dict(OVERRIDES[stem])
    m = NAME.match(stem + ".pdf")
    if not m:
        return None
    d = m.groupdict()
    date = f"{d['year']}-{MONTHS[d['mon'].lower()]:02d}-{int(d['day']):02d}"
    num = lambda x: str(int(x)) if x else None                      # "01" -> "1"
    return dict(vol=num(d["vol"]), no=num(d["no"]), whole=num(d["whole"]), date=date, note=d["note"].strip("-"))


def labels(note):
    words = [w for w in re.split(r"-+", note or "") if w]
    out, i = [], 0
    while i < len(words):                       # rejoin multi-word notes like "San-Diego"
        w = words[i]
        if i + 1 < len(words) and w[0].isupper() and words[i + 1][0].isupper() and len(w) > 2 and w != "SD":
            w = f"{w} {words[i + 1]}"; i += 1
        out.append(NOTE_LABELS.get(w, w.replace("=", " = ")))
        i += 1
    return out


def pretty_date(iso):
    y, m, d = iso.split("-")
    return f"{['January','February','March','April','May','June','July','August','September','October','November','December'][int(m)-1]} {int(d)}, {y}"


def clean(text):
    """Drop OCR noise lines (masthead ornaments etc.) for display + search. Raw text stays in the downloads."""
    keep = []
    for line in text.splitlines():
        s = line.strip()
        words = re.findall(r"[A-Za-z]{3,}", s)
        if len(s) >= 4 and (any(len(w) >= 4 for w in words) or len(words) >= 2):
            keep.append(s)
        elif not s and keep and keep[-1]:
            keep.append("")
    text = "\n".join(keep).strip()
    # rejoin words hyphenated across line ends ("prac-\ntically" -> "practically") so they're searchable
    return re.sub(r"([A-Za-z])-\n\s*([a-z])", r"\1\2", text)


def issue_title(i):
    bits = [f"Vol. {i['vol']}"]
    if i["no"]: bits.append(f"No. {i['no']}")
    if i["whole"]: bits.append(f"Whole No. {i['whole']}")
    return ", ".join(bits)


PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solidarity, {date_long} | IWW Newspaper Archive</title>
    <meta name="description" content="Full text of Solidarity, the IWW newspaper, {date_long} ({numbers}). Searchable OCR and page scans.">
    <link rel="icon" type="image/png" href="../../images/favicon.png">
    <link rel="stylesheet" href="../../style.css">
</head>
<body data-page="solidarity-issue" data-root="../../">
    <nav id="site-nav"></nav>

    <main class="container">
        <a class="back-link" href="../../solidarity.html">← Solidarity archive</a>
        <header class="project-header">
            <h1 data-pagefind-meta="title">Solidarity: {date_long}</h1>
            <p class="lead">{numbers} · {pages} pages</p>
            {tags}
            <span hidden data-pagefind-filter="year">{year}</span>
            <span hidden data-pagefind-sort="date">{date}</span>
            <span hidden data-pagefind-meta="numbers">{numbers}</span>
        </header>

        <div id="issue" data-ia="{ia}" data-file="{file}" data-txt="{txt}" data-pages="{pages}"></div>

        <section class="ocr" data-pagefind-body>
            <h2 class="section-title">Text</h2>
            <p class="ocr-note">Uncorrected machine-read (OCR) text. Expect errors, and columns that run together. Use the scan above to check a passage.</p>
{body}
        </section>
    </main>

    <footer id="site-footer"></footer>
    <script src="../../projects.js"></script>
    <script src="../../site.js"></script>
    <script src="../archive.js"></script>
</body>
</html>
"""


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1]).expanduser().resolve()
    pdfs = sorted((src / "searchable").glob("*/*.pdf"))
    if not pdfs:
        sys.exit(f"No PDFs found in {src}/searchable/<year>/")

    issues, problems = [], []
    for pdf in pdfs:
        f = parse(pdf.stem)
        if not f:
            problems.append(f"can't read the date from {pdf.name}: add it to OVERRIDES"); continue
        txt = src / "text" / pdf.parent.name / (pdf.stem + ".txt")
        if not txt.exists():
            problems.append(f"no text file for {pdf.name}"); continue
        raw = txt.read_text(errors="replace")
        pages = [p for p in raw.split("\f")]
        while pages and not pages[-1].strip():
            pages.pop()
        issues.append(dict(f, year=f["date"][:4], pdf=pdf, txt=txt, pages_text=pages))

    # Same date twice? Keep IDs unique.
    seen = {}
    for i in sorted(issues, key=lambda i: i["date"]):
        n = seen.get(i["date"], 0); seen[i["date"]] = n + 1
        i["slug"] = i["date"] + (f"-{n + 1}" if n else "")
        i["ia"] = f"{IA_PREFIX}-{i['slug']}"
    issues.sort(key=lambda i: i["slug"])

    # ---------------- issue pages
    pages_dir = OUT / "issues"
    if pages_dir.exists():
        shutil.rmtree(pages_dir)
    pages_dir.mkdir(parents=True)
    for i in issues:
        body = []
        for n, text in enumerate(i["pages_text"], 1):
            body.append(f'            <h2 id="p{n}" class="ocr-page-title">Page {n}</h2>\n'
                        f'            <div class="ocr-page" data-page="{n}">{html.escape(clean(text))}</div>')
        # Topic labels from the file names (Texas, Mexico...) are kept in issues.json but not shown yet.
        # To show them on issue pages again, uncomment the next line.
        tags = ""  # "".join(f'<span class="tag">{html.escape(l)}</span>' for l in labels(i["note"]))
        (pages_dir / f"{i['slug']}.html").write_text(PAGE.format(
            date=i["date"], date_long=pretty_date(i["date"]), year=i["year"], numbers=issue_title(i),
            pages=len(i["pages_text"]), ia=i["ia"], file=html.escape(i["pdf"].name), txt=html.escape(i["txt"].name),
            tags=f'<div class="tag-row">{tags}</div>' if tags else "", body="\n".join(body)))

    # ---------------- catalog for the archive page
    catalog = [dict(slug=i["slug"], date=i["date"], year=i["year"], vol=i["vol"], no=i["no"], whole=i["whole"],
                    pages=len(i["pages_text"]), notes=labels(i["note"]), ia=i["ia"], file=i["pdf"].name)
               for i in issues]
    years = sorted({i["year"] for i in issues})
    year_files = {y: f"Solidarity_{y}.pdf" for y in years if (src / "by_year_searchable" / f"Solidarity_{y}.pdf").exists()}
    (OUT / "issues.json").write_text(json.dumps(
        {"iaPrefix": IA_PREFIX, "years": {y: {"ia": f"{IA_PREFIX}-{y}-full-year", "file": year_files.get(y)} for y in years},
         "issues": catalog}, separators=(",", ":")))

    # ---------------- all text in one zip (raw OCR, untouched)
    with zipfile.ZipFile(OUT / "solidarity-ocr-text.zip", "w", zipfile.ZIP_DEFLATED) as z:
        for i in issues:
            z.write(i["txt"], f"solidarity-ocr-text/{i['year']}/{i['slug']}_{i['txt'].name}")

    # ---------------- Internet Archive upload templates
    cols = ["identifier", "file", "mediatype", "collection", "title", "date", "volume", "issue", "creator",
            "publisher", "language", "licenseurl", "source", "description"] + [f"subject[{n}]" for n in range(len(SUBJECTS))]
    with open(src / "ia_issues.csv", "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=cols); w.writeheader()
        for i in issues:
            rel = lambda p: str(p.relative_to(src))
            w.writerow({"identifier": i["ia"], "file": rel(i["pdf"]), "mediatype": "texts", "collection": "opensource",
                        "title": f"Solidarity (IWW), {pretty_date(i['date'])} ({issue_title(i)})",
                        "date": i["date"], "volume": i["vol"], "issue": i["no"] or "", "creator": "Industrial Workers of the World",
                        "publisher": "Industrial Workers of the World", "language": "eng",
                        "licenseurl": "https://creativecommons.org/publicdomain/mark/1.0/",
                        "source": "https://depts.washington.edu/iww/solidarity_intro.shtml",
                        "description": f"Solidarity, weekly newspaper of the Industrial Workers of the World. {issue_title(i)}, "
                                       f"{pretty_date(i['date'])}. {len(i['pages_text'])} pages. {SOURCE_CREDIT} "
                                       f"Searchable archive: https://ecraw.com/solidarity.html",
                        **{f"subject[{n}]": s for n, s in enumerate(SUBJECTS)}})
            w.writerow({"identifier": i["ia"], "file": rel(i["txt"])})       # same item: add the text file
    with open(src / "ia_years.csv", "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=cols); w.writeheader()
        for y, f in year_files.items():
            w.writerow({"identifier": f"{IA_PREFIX}-{y}-full-year", "file": f"by_year_searchable/{f}", "mediatype": "texts",
                        "collection": "opensource", "title": f"Solidarity (IWW), {y}: all issues", "date": y,
                        "creator": "Industrial Workers of the World", "publisher": "Industrial Workers of the World",
                        "language": "eng", "licenseurl": "https://creativecommons.org/publicdomain/mark/1.0/",
                        "source": "https://depts.washington.edu/iww/solidarity_intro.shtml",
                        "description": f"Every surviving {y} issue of Solidarity, the IWW weekly, in one searchable PDF. "
                                       f"{SOURCE_CREDIT} Per-issue items and search: https://ecraw.com/solidarity.html",
                        **{f"subject[{n}]": s for n, s in enumerate(SUBJECTS)}})
    # first row only: a one-issue test upload
    rows = (src / "ia_issues.csv").read_text().splitlines()
    (src / "ia_test.csv").write_text("\n".join(rows[:3]) + "\n")

    # ---------------- search index
    idx = OUT / "pagefind"
    if idx.exists():
        shutil.rmtree(idx)
    try:
        subprocess.run([sys.executable, "-m", "pagefind", "--site", str(SITE), "--glob", "solidarity/issues/*.html",
                        "--output-path", str(idx), "--quiet"], check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        problems.append('search index not built: run  pip3 install "pagefind[extended]"  and try again')

    total = sum(len(i["pages_text"]) for i in issues)
    print(f"{len(issues)} issues, {total} pages, {len(years)} years ({years[0]}–{years[-1]})")
    for p in problems:
        print("  !", p)


if __name__ == "__main__":
    main()
