# Project Onboarding: ecraw4d.github.io
**Target:** Claude Code (AI Assistant)
**Project Context:** Personal portfolio for Ethan Crawford (GIS Specialist, Urban Planner, Labor Historian). Hosted on GitHub Pages. Built with vanilla HTML, CSS, and JS. 

## 1. Design System & Theme
*   **Aesthetic:** Bold, "Brutalist" design. Heavy borders, hard drop-shadows, uppercase text.
*   **Colors:** Red (`#fc5b5b`), Dark Red (`#421414`), Gold (`#ffd700`), White/Off-White backgrounds.
*   **Typography:** Custom font `ecraw` (`fonts/Nonserif.ttf`) for headings/special text. Standard `Helvetica, sans-serif` for body.
*   **UI Components:** Cards utilize hover effects with translation (`-5px, -5px`) and hard solid shadows (`#fc5b5b` or `#421414`). 

## 2. File Structure & Architecture
```text
/ecraw4d.github.io
├── fonts/               # Contains custom font (Nonserif.ttf)
├── images/              # Current image assets (thumbnails, old icons)
├── style.css            # Global stylesheet (includes all brutalist UI classes)
├── script.js            # Global JS (currently handles gallery grid/list toggle)
├── index.html           # Homepage (Hero bio, split grid layout)
├── maps.html            # Map Portfolio Gallery (Grid/List toggle UI)
├── project1.html        # Map template 1: Interactive Leaflet map (US Population)
├── project1.js          # Specific JS for project1.html (Leaflet logic)
├── us-states.js         # GeoJSON data for project 1
├── project2.html        # Map template 2: ArcGIS StoryMap iframe embed
├── resume.html          # Digital Resume (Marquee, interactive skill filters, timeline)
├── resume.js            # Specific JS for resume filter logic
├── photography.html     # [PENDING]
├── writing.html         # [PENDING]
└── lab11.html, cities.csv, data.js  # Legacy/coursework files (IGNORE for now)
## 3. Recently Accomplished

* **Global Nav:** Cleaned up global `<nav>` across active pages. Fixed duplicate IDs to `.special-text`.
* **Maps Gallery:** Built `maps.html` with a brutalist card grid and a JS toggle to switch to list view.
* **Project Templates:** Abstracted map-specific Leaflet JS out of the global `script.js` into `project1.js` to prevent global console errors. Set up `project2.html` as an iframe embed template.
* **Interactive Resume:** Redesigned `resume.html` with a scrolling marquee, a "Contact Strip", a filterable skills grid (`resume.js`), and a vertical timeline.

## 4. Immediate Directives & Next Steps (For Claude)

**Task A: Establish the `assets/` Directory**
Currently, `resume.html` points to `assets/Ethan_Crawford_Resume.pdf` and `assets/icons/...`, but this folder does not exist.

* **Action:** Create the `assets/` directory and an `assets/icons/` subdirectory.
* **Action:** Migrate relevant local SVGs/PNGs for the resume skills grid into `assets/icons/` and update paths if necessary.

**Task B: Create a "New Project" Workflow**
The user has ~4 more map projects to add, but creating individual HTML/JS files manually is tedious.

* **Action:** Architect a scalable workflow. This could involve creating a reusable `project-template.html` snippet, or setting up a simple JSON-based rendering system if appropriate for vanilla JS, so the user can easily plug in new static maps, PDFs, or web maps without rewriting boilerplate HTML.

## 5. Backlog & Low Priority

* **Photography & Writing:** `photography.html` and `writing.html` remain untouched. Leave these alone until the user dictates a layout strategy.
* **Legacy Files:** Ignore `lab11.html`, `cities.csv`, and `data.js`. They are retained for archiving purposes and should not be modified.
*** 
