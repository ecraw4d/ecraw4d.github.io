# ecraw.com

Ethan Crawford's GIS portfolio. Plain HTML/CSS/JS on GitHub Pages: no build step, no framework.
Edit a file, push, and the site updates in about a minute.

---

## 1. How the site is put together

```
index.html          Home page
projects.html       Project gallery (cards + topic filter)
project.html        ONE template that shows any project: project.html?p=<slug>
resume.html         Resume (the text is written directly in this file)
photography.html    Placeholder, currently not in the nav
404.html            "Page not found" page
maps.html           Old URL; redirects to projects.html

style.css           ALL styling. The THEME block at the top controls colors, fonts, borders
site.js             Shared code: nav, footer, and filling in each page. SETTINGS at the top
projects.js         THE LIST OF PROJECTS: the only file you edit to add or change a project

projects/<slug>/    One folder per project: thumb.webp, images, PDF, map data
images/             Site images (portrait, museum photo, favicon)
fonts/              The 'ecraw' display font (woff2 + ttf backup)
tools/add_project.py  Turns a folder of exports into a new project
archive/            Old coursework (lab11) kept for reference, not linked
Ethan_Crawford_Resume_s26.pdf   Resume PDF (kept at this path so old links keep working)
```

Every page has an empty `<nav id="site-nav">` and `<footer id="site-footer">`; `site.js` fills them in.
Change the nav or footer **once** in `site.js` and every page updates.

---

## 2. Previewing on your computer

Open Terminal in the repo folder and run:

```
python3 -m http.server
```

Then go to **http://localhost:8000**. Press `Ctrl+C` to stop.
(Opening the .html files straight from Finder mostly works, but PDFs and GeoJSON maps need the local server.)

---

## 3. Adding a project

### The fast way (recommended)

1. Put everything for the project in one folder, e.g. `~/Desktop/chicago-transit/`:
   - map exports / figures (`.png`, `.jpg`, `.tif`): any size, the script shrinks them
   - optional `thumb.png`: the card image (otherwise the first image is used)
   - a `.pdf` report or layout
   - `.geojson` files → an interactive map is built automatically
   - anything else (`.zip`, `.csv`, …) becomes a download link
2. Run:
   ```
   python3 tools/add_project.py ~/Desktop/chicago-transit
   ```
   Answer the questions (title, summary, topics, tools, embed link, featured?).
3. Open `projects.js`. Your project is now at the top. Fill in the `writeup` text and image captions.
4. Preview (section 2), then commit and push.

First time only: `pip3 install pillow` (the script uses it to make the `.webp` images).
Without it, the script falls back to macOS's built-in `sips` and makes `.jpg` files.

### By hand

1. Make a folder `projects/my-slug/` and put in a `thumb.webp` (about 800px wide) and your files.
2. Copy an existing entry in `projects.js`, change `slug` to `my-slug`, and edit the fields.

### What each field does (all optional except slug, title, summary, thumb)

| Field | Example | What it does |
|---|---|---|
| `slug` | `"chicago-transit"` | Folder name and URL. Lowercase, dashes. |
| `title`, `summary` | | Card + page heading. Keep the summary to 1–2 sentences. |
| `thumb` | `"thumb.webp"` | Card image. Cards crop to 4:3. |
| `featured` | `true` | Also show on the home page (3 is a good number). |
| `tags` | `["Cartography"]` | Topics → filter buttons on the Projects page. |
| `tools` | `["ArcGIS Pro"]` | Shown on the page; also links resume skills to this project. |
| `date` | `"Spring 2025"` | Shown under the title. |
| `badge` | `"StoryMap"` | Label on the card image (default: first tag). |
| `images` | `[{ src: "map.webp", caption: "…" }]` | Static maps/figures. Click opens full size. |
| `embed` | `"https://storymaps.arcgis.com/…"` | StoryMap, ArcGIS Online map, Experience Builder, Earth Engine app, etc. |
| `map` | `["roads.geojson"]` | Automatic interactive map of your GeoJSON. |
| `map` | `["data.js", "map.js"]` | Or: your own Leaflet code (see `projects/us-population-density/`). |
| `pdf` | `"report.pdf"` | Adds **Download PDF** and **View here** buttons. The PDF only loads when clicked. |
| `links` | `[{ label: "GitHub", url: "…" }]` | Extra buttons. |
| `writeup` | `{ "Overview": "…", "Methodology": "…" }` | Any headings you like, in order. `\n\n` = new paragraph. |

Blocks show in this order: embed → interactive map → images → PDF → writeup → links.
You can combine them (e.g. images **and** a PDF, or an embed **and** a PDF).

**Reorder projects:** move entries up or down in `projects.js`. The gallery follows that order.
**Remove a project:** delete its entry and its `projects/<slug>/` folder.

### Size rules of thumb
- Thumbnails: about 800px wide, under 100 KB. Page images: up to 2400px, under 400 KB. The script does this for you.
- Don't commit huge PNG exports or `.docx` files. Git keeps every version forever, so the repo only grows.
- For a large PDF (like the 14 MB Brazoria layout), always include an image of it so visitors don't have to download the PDF to see the map.

---

## 4. Changing the look

Open `style.css`. The **THEME** block at the top controls almost everything:

```css
--red:    #fc5b5b;   /* page background + hover accents */
--maroon: #421414;   /* nav, borders, headings, buttons */
--paper:  #fedede;   /* main content panel */
--card:   #ffffff;   /* cards/boxes */
--border-w: 3px;     /* thickness of every border */
--shadow: 6px 6px 0 var(--maroon);   /* the hard drop shadow on framed maps */
--max-width: 1400px; /* content width on big screens */
```

- **Colors:** change a value and it updates across the site. For example, to try a darker red, set `--red: #d94040;`.
- **Heavier brutalism:** raise `--border-w` to `4px` and the shadow offset to `10px 10px`.
- **Fonts:** `--font-display` is the 'ecraw' font (nav, buttons, section labels). `--font-body` is everything else.
  To use a different font file, put it in `fonts/` and change the `@font-face` `src` line.
- **Home page column widths:** `.home-grid { grid-template-columns: 3fr 2fr; }` in section 5 of the CSS.
- **Card image shape:** `.project-card .thumb { aspect-ratio: 4 / 3; }` (try `16 / 9` or `1 / 1`).

The rest of `style.css` is split into numbered sections (Nav, Buttons, Home, Cards, Project page, Resume, Small screens).
Search for the section name to find what you want to change.

Tip: in Chrome, right-click → **Inspect**. You can edit CSS live in the Styles panel to try things, then copy the change into `style.css`.

---

## 5. Everyday edits

| I want to… | Edit |
|---|---|
| Change nav links | `SETTINGS.nav` at the top of `site.js` (photography is commented out; remove the `//` to show it) |
| Change email / LinkedIn / resume PDF link | `SETTINGS` in `site.js` **and** the contact strip + button in `resume.html` |
| Update the resume PDF | Replace `Ethan_Crawford_Resume_s26.pdf` (same name) or change `resumePdf` in `site.js` + the link in `resume.html` |
| Add a job | Copy a `<div class="entry">` block in `resume.html` (newest first) |
| Add a skill | Add an `<li>` in `resume.html`. It links to projects automatically if a project lists the same name in `tools`. |
| Change the bio or photos | `index.html`. Put new photos in `images/` as `.webp`, about 1200px wide. |
| Change the home page heading line | `.home-headline` paragraph in `index.html` |
| Change the social/share preview | `<meta property="og:…">` lines at the top of each page |

---

## 6. Publishing

```
git add -A
git commit -m "Add Chicago transit project"
git push
```

GitHub Pages rebuilds automatically. `CNAME` keeps the site on ecraw.com; don't delete it.
