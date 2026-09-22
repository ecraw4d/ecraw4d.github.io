#!/usr/bin/env python3
"""
add_project.py — turn a folder of exports into a project on the site.

    python3 tools/add_project.py ~/Desktop/my-new-map

What goes in the folder (any mix):
    *.png / *.jpg / *.tif      map exports and figures  → web-sized .webp
    thumb.png (optional)       the card image; otherwise the first image is used
    *.pdf                      report/layout            → Download + View buttons
    *.geojson                  vector data              → automatic interactive map
    *.js                       your own Leaflet code    → runs instead of the auto map
    anything else              copied and listed as a download link

It asks a few questions (title, summary, tags…), writes everything to
projects/<slug>/, and adds an entry to the top of projects.js. Open
projects.js afterwards to write the Overview/Methodology text.

Needs Pillow for images:  pip3 install pillow
(On a Mac without Pillow it falls back to the built-in `sips` tool and makes .jpg.)
"""
import json, re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MARKER = "// @@ new projects are added above this line"
FULL_W, THUMB_W = 2400, 800
IMG = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".webp", ".bmp"}

try:
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = None
except ImportError:
    Image = None


def ask(q, default=""):
    a = input(f"{q}{f' [{default}]' if default else ''}: ").strip()
    return a or default


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def to_web(src, dest_dir, name, width):
    """Resize to `width` px max and save as .webp (or .jpg via sips). Returns file name."""
    if Image:
        im = Image.open(src)
        im.load()
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA")
        if im.width > width:
            im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        out = dest_dir / f"{name}.webp"
        im.save(out, "WEBP", quality=85 if width > THUMB_W else 78, method=6)
    elif shutil.which("sips"):
        out = dest_dir / f"{name}.jpg"
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "82",
                        "--resampleWidth", str(width), str(src), "--out", str(out)],
                       check=True, capture_output=True)
    else:
        sys.exit("Install Pillow first:  pip3 install pillow")
    print(f"  image  {src.name} → {out.name} ({out.stat().st_size // 1024} KB)")
    return out.name


def pdf_first_page(pdf, tmp):
    """Render page 1 of a PDF to PNG, for a preview/thumbnail."""
    if shutil.which("pdftoppm"):
        subprocess.run(["pdftoppm", "-r", "150", "-png", "-singlefile", str(pdf), str(tmp)], check=True)
        return tmp.with_suffix(".png")
    if shutil.which("sips"):  # macOS built-in
        out = tmp.with_suffix(".png")
        subprocess.run(["sips", "-s", "format", "png", str(pdf), "--out", str(out)], check=True, capture_output=True)
        return out
    return None


def copy_pdf(src, dest):
    """Copy a PDF, shrinking it with Ghostscript when available (keeps print quality)."""
    shutil.copy2(src, dest)
    if shutil.which("gs"):
        tmp = dest.with_suffix(".small.pdf")
        subprocess.run(["gs", "-q", "-dNOPAUSE", "-dBATCH", "-sDEVICE=pdfwrite", "-dPDFSETTINGS=/printer",
                        f"-sOutputFile={tmp}", str(src)], capture_output=True)
        if tmp.exists() and tmp.stat().st_size < dest.stat().st_size:
            tmp.replace(dest)
        tmp.unlink(missing_ok=True)
    print(f"  pdf    {src.name} → {dest.name} ({dest.stat().st_size // 1024} KB)")


def format_entry(entry):
    """Write the entry in the same hand-edited style as the rest of projects.js."""
    j = lambda v: json.dumps(v, ensure_ascii=False)
    obj = lambda d: "{ " + ", ".join(f"{k}: {j(v)}" for k, v in d.items()) + " }"
    out = ["    {"]
    for k, v in entry.items():
        if k == "writeup":
            out.append("        writeup: {")
            out += [f"            {j(h)}: {j(t)}," for h, t in v.items()]
            out.append("        },")
        elif isinstance(v, list) and v and isinstance(v[0], dict):
            out.append(f"        {k}: [")
            out += [f"            {obj(d)}," for d in v]
            out.append("        ],")
        else:
            out.append(f"        {k}: {j(v)},")
    out.append("    },")
    return "\n".join(out) + "\n"


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src_dir = Path(sys.argv[1]).expanduser().resolve()
    files = sorted(f for f in src_dir.iterdir() if f.is_file() and not f.name.startswith("."))
    if not files:
        sys.exit(f"No files in {src_dir}")

    print("\nNew project from", src_dir, "\n")
    title = ask("Title")
    slug = slugify(ask("URL name (slug)", slugify(title or src_dir.name)))
    summary = ask("One-sentence summary (for the card)")
    tags = [t.strip() for t in ask("Topics, comma separated (e.g. Cartography, Remote Sensing)").split(",") if t.strip()]
    tools = [t.strip() for t in ask("Tools, comma separated (e.g. ArcGIS Pro, QGIS)").split(",") if t.strip()]
    date = ask("Date (optional, e.g. Spring 2025)")
    embed = ask("Embed URL (StoryMap / ArcGIS Online / GEE app — optional)")
    featured = ask("Feature on home page? y/n", "n").lower().startswith("y")

    dest = ROOT / "projects" / slug
    if dest.exists() and any(dest.iterdir()):
        if ask(f"projects/{slug} already has files. Add to it anyway? y/n", "n").lower() != "y":
            sys.exit("Stopped.")
    dest.mkdir(parents=True, exist_ok=True)

    entry = {"slug": slug, "title": title, "summary": summary, "thumb": ""}
    if featured: entry["featured"] = True
    if date: entry["date"] = date
    if tags: entry["tags"] = tags
    if tools: entry["tools"] = tools
    if embed: entry["embed"] = embed
    images, maps, links, thumb_src, pdf_path = [], [], [], None, None

    print()
    for f in files:
        ext = f.suffix.lower()
        if ext in IMG:
            if f.stem.lower().startswith("thumb"):
                thumb_src = f
                continue
            name = to_web(f, dest, slugify(f.stem), FULL_W)
            images.append({"src": name, "caption": ""})
            thumb_src = thumb_src or f
        elif ext == ".pdf" and not pdf_path:
            pdf_path = dest / (slugify(f.stem) + ".pdf")
            copy_pdf(f, pdf_path)
            entry["pdf"] = pdf_path.name
        elif ext in (".geojson", ".json", ".js"):
            shutil.copy2(f, dest / f.name)
            maps.append(f.name)
            print(f"  map    {f.name}")
        else:
            shutil.copy2(f, dest / f.name)
            links.append({"label": f"Download {f.name}", "url": f"projects/{slug}/{f.name}"})
            print(f"  file   {f.name}")

    # No images but a PDF? Use its first page as the picture.
    if not images and pdf_path:
        png = pdf_first_page(pdf_path, dest / "_page1")
        if png:
            images.append({"src": to_web(png, dest, "preview", FULL_W), "caption": "First page. Download the PDF for full resolution."})
            thumb_src = thumb_src or png

    if thumb_src:
        entry["thumb"] = to_web(thumb_src, dest, "thumb", THUMB_W)
    for p in dest.glob("_page1*"):
        p.unlink()
    if not entry["thumb"]:
        print("\n  ! No image found for the card. Add thumb.webp to the folder and set thumb in projects.js.")

    if images: entry["images"] = images
    if maps: entry["map"] = maps
    if links: entry["links"] = links
    entry["writeup"] = {"Overview": "", "Methodology": ""}

    # Insert at the top of the PROJECTS list (newest first)
    js_path = ROOT / "projects.js"
    js = js_path.read_text()
    block = format_entry(entry)
    start = js.index("const PROJECTS = [") + len("const PROJECTS = [\n")
    if MARKER not in js:
        sys.exit("Couldn't find the marker line in projects.js; paste this in by hand:\n" + block)
    js_path.write_text(js[:start] + block + js[start:])

    print(f"\nDone. Added '{title}' to the top of projects.js → project.html?p={slug}")
    print("Next: open projects.js, fill in the writeup text and any image captions,")
    print("then preview with:  python3 -m http.server   →  http://localhost:8000\n")


if __name__ == "__main__":
    main()
