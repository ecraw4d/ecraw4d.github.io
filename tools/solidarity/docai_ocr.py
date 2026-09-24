#!/usr/bin/env python3
"""
docai_ocr.py: OCR the Solidarity scans with Google Document AI (Enterprise Document OCR).

Test on a few issues first (costs a few cents):
    python3 docai_ocr.py ~/solidarity_archive --project MY-PROJECT --processor PROCESSOR_ID --test

Then everything (1,632 pages, about $2.50 at $1.50 per 1,000 pages):
    python3 docai_ocr.py ~/solidarity_archive --project MY-PROJECT --processor PROCESSOR_ID

Other options:
    --only 1913            only issues whose path contains this text (repeatable)
    --location eu          if you created the processor in the EU region (default: us)
    --workers 4            requests sent at the same time

Reads the ORIGINAL scans in  issues/<year>/*.pdf  (never changes them) and writes:
    text_docai/<year>/<same name>.txt        text in reading order, pages separated by a form feed
    docai_json/<year>/<same name>.json.gz    Google's full answer (word positions etc.), kept for later use
    docai_compare.txt                        each processed issue compared with your current text/ files

Safe to stop and restart: finished issues are skipped.
Login: set GOOGLE_APPLICATION_CREDENTIALS to your service-account key file (see DOCUMENT_AI_GUIDE.md).
Needs:  pip install google-cloud-documentai
"""
import argparse, gzip, os, re, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

# A spread of layouts and scan conditions, used by --test
TEST_ISSUES = [
    "1911/v02n51-w103-dec-09-1911",    # dark scan
    "1913/v04n11-w167-mar-08-1913",    # classic 5-column pages
    "1914/v05-w240-aug-15-1914",       # mixed column widths
    "1915/v06-w280-may-22-1915",       # wide editorial columns, column rules
    "1916/v7-w328-apr-22-1916",
    "1917/v8-w384-may-19-1917",        # dark scan, big picture, facing-page bleed
]
PRICE_PER_PAGE = 1.50 / 1000
MAX_PAGES = 15


def page_texts(document):
    """Text of each page, paragraph by paragraph, in Document AI's reading order."""
    full = document.text
    def seg(layout):
        return "".join(full[int(s.start_index):int(s.end_index)] for s in layout.text_anchor.text_segments)
    out = []
    for page in document.pages:
        paras = [seg(p.layout).strip() for p in page.paragraphs]
        out.append("\n\n".join(p for p in paras if p))
    return out


def pdf_pages(path):
    info = subprocess.run(["pdfinfo", str(path)], capture_output=True, text=True).stdout
    return int(re.search(r"Pages:\s+(\d+)", info).group(1))


def send(client, name, pdf_bytes):
    from google.cloud import documentai
    request = documentai.ProcessRequest(
        name=name,
        raw_document=documentai.RawDocument(content=pdf_bytes, mime_type="application/pdf"),
        process_options=documentai.ProcessOptions(
            ocr_config=documentai.OcrConfig(
                enable_native_pdf_parsing=False,           # read the scan images, not an old text layer
                hints=documentai.OcrConfig.Hints(language_hints=["en"]),
            )
        ),
    )
    document = client.process_document(request=request, timeout=300).document
    for page in document.pages:                            # drop Google's copy of the page image (~8 MB per issue)
        page._pb.ClearField("image")
    return document


def ocr_issue(client, name, src, out_txt, out_json):
    import tempfile
    from google.cloud import documentai
    t0 = time.time()
    n = pdf_pages(src)
    if n <= MAX_PAGES:
        docs = [send(client, name, src.read_bytes())]
    else:
        # Document AI takes at most 15 pages per request: send longer issues in pieces
        docs = []
        with tempfile.TemporaryDirectory() as tmp:
            for first in range(1, n + 1, MAX_PAGES):
                last = min(first + MAX_PAGES - 1, n)
                part = Path(tmp) / f"part{first}.pdf"
                subprocess.run(["qpdf", str(src), "--pages", ".", f"{first}-{last}", "--", str(part)],
                               check=True, capture_output=True)
                docs.append(send(client, name, part.read_bytes()))
    pages = [t for d in docs for t in page_texts(d)]
    out_txt.parent.mkdir(parents=True, exist_ok=True)
    out_json.parent.mkdir(parents=True, exist_ok=True)
    for i, d in enumerate(docs, 1):
        target = out_json if len(docs) == 1 else out_json.with_name(out_json.name.replace(".json.gz", f".part{i}.json.gz"))
        with gzip.open(target, "wt") as fh:
            fh.write(documentai.Document.to_json(d))
    tmp = out_txt.with_suffix(".part")
    tmp.write_text("\n\f".join(pages) + "\n")
    tmp.replace(out_txt)                                  # the .txt appearing = issue done
    return src.name, len(pages), time.time() - t0


def compare(root, done):
    """How the new text compares with the current text/ files, page by page."""
    words = lambda t: len(re.findall(r"[A-Za-z]{3,}", t))
    merged = lambda t: sum(len(l) > 65 for l in t.splitlines())
    lines = ["Compared with your current text/ files.",
             "words = words of 3+ letters found (more is usually better; a big drop means text was missed)",
             "long  = lines over 65 characters (a rough sign of columns running together; wide columns also count)", ""]
    for rel in sorted(done):
        new = (root / "text_docai" / rel).read_text(errors="replace").split("\f")
        old_path = root / "text" / rel
        old = old_path.read_text(errors="replace").split("\f") if old_path.exists() else []
        old = [p for p in old if p.strip()]
        lines.append(str(rel))
        for i, n in enumerate(new):
            o = old[i] if i < len(old) else ""
            lines.append(f"  page {i + 1}:  words {words(o):>5} -> {words(n):>5}    long {merged(o):>4} -> {merged(n):>4}")
    (root / "docai_compare.txt").write_text("\n".join(lines) + "\n")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("archive", type=Path)
    ap.add_argument("--project", required=True, help="Google Cloud project ID")
    ap.add_argument("--processor", required=True, help="Document AI processor ID")
    ap.add_argument("--location", default="us")
    ap.add_argument("--only", action="append", help="part of a path or file name (repeatable)")
    ap.add_argument("--test", action="store_true", help="only the six test issues")
    ap.add_argument("--workers", type=int, default=4)
    a = ap.parse_args()

    try:
        from google.api_core.client_options import ClientOptions
        from google.cloud import documentai
    except ImportError:
        sys.exit("Missing library. Run:  pip install google-cloud-documentai")
    if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        print("! GOOGLE_APPLICATION_CREDENTIALS is not set; trying your default Google login.\n")

    root = a.archive.expanduser().resolve()
    filters = TEST_ISSUES if a.test else (a.only or [])
    jobs, skipped = [], 0
    for src in sorted((root / "issues").glob("*/*.pdf")):
        rel = src.relative_to(root / "issues")
        if filters and not any(f in str(rel) for f in filters):
            continue
        out_txt = (root / "text_docai" / rel).with_suffix(".txt")
        out_json = (root / "docai_json" / rel).with_suffix(".json.gz")
        if out_txt.exists():
            skipped += 1; continue
        jobs.append((src, out_txt, out_json))

    pages = 0
    for src, *_ in jobs:
        try:
            info = subprocess.run(["pdfinfo", str(src)], capture_output=True, text=True).stdout
            pages += int(re.search(r"Pages:\s+(\d+)", info).group(1))
        except Exception:
            pages = None; break
    cost = f", {pages} pages, about ${pages * PRICE_PER_PAGE:.2f}" if pages else ""
    print(f"{len(jobs)} issues to send ({skipped} already done){cost}")

    client = documentai.DocumentProcessorServiceClient(
        client_options=ClientOptions(api_endpoint=f"{a.location}-documentai.googleapis.com"))
    name = client.processor_path(a.project, a.location, a.processor)

    done, failed, t0 = [], [], time.time()
    with ThreadPoolExecutor(a.workers) as pool:
        futs = {pool.submit(ocr_issue, client, name, *j): j[0] for j in jobs}
        for i, f in enumerate(as_completed(futs), 1):
            src = futs[f]
            try:
                fname, n, secs = f.result()
                done.append(src.relative_to(root / "issues").with_suffix(".txt"))
                print(f"[{i}/{len(jobs)}] {fname}: {n} pages, {secs:.0f}s", flush=True)
            except Exception as e:
                failed.append(src.name)
                print(f"[{i}/{len(jobs)}] FAILED {src.name}: {str(e)[:500]}", flush=True)

    all_done = [p.relative_to(root / "text_docai") for p in (root / "text_docai").glob("*/*.txt")] \
        if (root / "text_docai").exists() else []
    if all_done:
        compare(root, all_done)
    print(f"\nDone in {(time.time() - t0) / 60:.1f} min." + (f" {len(failed)} failed: {failed}" if failed else ""))
    if all_done:
        print("Comparison with your current text: docai_compare.txt")


if __name__ == "__main__":
    main()
