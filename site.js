/* =====================================================================
   site.js — shared code for every page.
   ---------------------------------------------------------------------
   SETTINGS below are the only part you normally need to edit.
   Each page says what it is with <body data-page="...">, and the
   matching function at the bottom fills that page in.
   ===================================================================== */

const SETTINGS = {
    email:    "ecraw4d2003@gmail.com",
    linkedin: "https://www.linkedin.com/in/ethan-crawford-982472286/",
    resumePdf: "Ethan_Crawford_Resume_s26.pdf",

    // Top navigation. Add, remove or reorder links here.
    // A link with "children" becomes a dropdown menu.
    nav: [
        { label: "projects", href: "projects.html" },
        { label: "resume",   href: "resume.html" },
        { label: "about",    href: "about.html" },
        { label: "more", children: [
            { label: "writing",                      href: "writing.html" },
            { label: "designs",                      href: "designs.html" },
            { label: "solidarity newspaper archive", href: "solidarity.html" },
            // { label: "photography", href: "photography.html" },
        ]},
    ],
};


/* ---------- helpers ---------- */
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const projectPath = (p, file) => /^https?:|^\//.test(file) ? file : `projects/${p.slug}/${file}`;
const projectUrl = (p) => `project.html?p=${encodeURIComponent(p.slug)}`;

/* A project card (used on Home and Projects) */
function cardHTML(p) {
    const badge = p.badge || (p.tags && p.tags[0]) || "";
    return `
    <a class="project-card" href="${projectUrl(p)}">
        <div class="thumb">
            <img src="${projectPath(p, p.thumb)}" alt="" loading="lazy" decoding="async">
            ${badge ? `<span class="badge">${esc(badge)}</span>` : ""}
        </div>
        <div class="info">
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.summary)}</p>
        </div>
    </a>`;
}


/* ---------- nav + footer (every page) ---------- */
function renderChrome() {
    // Pages in subfolders (e.g. solidarity/issues/) set <body data-root="../../"> so links still work.
    const root = document.body.dataset.root || "";
    const here = location.pathname.includes("/solidarity/") ? "solidarity.html"
               : (location.pathname.split("/").pop() || "index.html");
    const nav = $("#site-nav");
    if (nav) {
        nav.className = "site-nav";
        const isHere = (l) => here === l.href || (here === "project.html" && l.href === "projects.html");
        const link = (l) => `<a href="${root}${l.href}"${isHere(l) ? ' aria-current="page"' : ""}>${esc(l.label)}</a>`;
        nav.innerHTML =
            `<a class="brand" href="${root}index.html">ecraw.com</a>` +
            SETTINGS.nav.map((l) => l.children
                ? `<details class="nav-menu"><summary${l.children.some(isHere) ? ' class="current"' : ""}>${esc(l.label)}</summary>` +
                  `<div class="nav-dropdown">${l.children.map(link).join("")}</div></details>`
                : link(l)
            ).join("");
        // Close an open dropdown when clicking anywhere else
        document.addEventListener("click", (e) => {
            nav.querySelectorAll("details[open]").forEach((d) => { if (!d.contains(e.target)) d.open = false; });
        });
    }
    const foot = $("#site-footer");
    if (foot) {
        foot.className = "site-footer";
        foot.innerHTML = `
            <a href="mailto:${SETTINGS.email}">${SETTINGS.email}</a>
            <a href="${SETTINGS.linkedin}" target="_blank" rel="noopener">LinkedIn</a>
            <a href="${root}${SETTINGS.resumePdf}" target="_blank">Resume (PDF)</a>
            <span class="spacer">© ${new Date().getFullYear()} Ethan Crawford</span>`;
    }
}


/* ---------- page: home ---------- */
function pageHome() {
    const featured = PROJECTS.filter((p) => p.featured);
    const box = $("#featured");
    if (box) box.innerHTML = featured.map(cardHTML).join("");
}


/* ---------- page: projects (gallery + filters) ---------- */
function pageProjects() {
    const grid = $("#gallery");
    const bar = $("#filters");
    const tags = [...new Set(PROJECTS.flatMap((p) => p.tags || []))];
    const params = new URLSearchParams(location.search);
    let active = params.get("tag") || "All";

    function draw() {
        const list = active === "All" ? PROJECTS : PROJECTS.filter((p) =>
            (p.tags || []).includes(active) || (p.tools || []).includes(active));
        grid.innerHTML = list.map(cardHTML).join("") || "<p>No projects with that tag yet.</p>";
        const buttons = ["All", ...tags];
        if (!buttons.includes(active)) buttons.push(active);   // e.g. a tool linked from the resume
        bar.innerHTML = buttons.map((t) =>
            `<button class="tag${t === active ? " active" : ""}" data-tag="${esc(t)}">${esc(t)}</button>`).join("");
    }
    bar.addEventListener("click", (e) => {
        const t = e.target.dataset.tag;
        if (!t) return;
        active = t;
        history.replaceState(null, "", t === "All" ? "projects.html" : `projects.html?tag=${encodeURIComponent(t)}`);
        draw();
    });
    draw();
}


/* ---------- page: a single project ---------- */
function pageProject() {
    const slug = new URLSearchParams(location.search).get("p");
    const i = PROJECTS.findIndex((p) => p.slug === slug);
    const p = PROJECTS[i];
    const main = $("#project");
    if (!p) {
        main.innerHTML = `<h1>Project not found</h1><p><a href="projects.html">See all projects →</a></p>`;
        return;
    }
    document.title = `${p.title} | ecraw.com`;
    const tagLinks = (list) => (list || []).map((t) =>
        `<a class="tag" href="projects.html?tag=${encodeURIComponent(t)}">${esc(t)}</a>`).join("");

    let html = `
        <a class="back-link" href="projects.html">← all projects</a>
        <header class="project-header">
            <h1>${esc(p.title)}</h1>
            ${p.date ? `<p class="when"><strong>${esc(p.date)}</strong></p>` : ""}
            <p class="lead">${esc(p.summary)}</p>
            ${p.tags ? `<div class="tag-row"><span class="label">Topics</span>${tagLinks(p.tags)}</div>` : ""}
            ${p.tools ? `<div class="tag-row"><span class="label">Tools</span>${tagLinks(p.tools)}</div>` : ""}
        </header>`;

    // Media, in this order: embed → interactive map → images → pdf
    if (p.embed) html += `
        <div class="media-block">
            <iframe class="frame" src="${esc(p.embed)}" loading="lazy" allowfullscreen allow="geolocation" title="${esc(p.title)}"></iframe>
            <a href="${esc(p.embed)}" target="_blank" rel="noopener">Open full screen ↗</a>
        </div>`;
    if (p.map) html += `<div class="media-block"><div id="project-map" class="frame map-frame"></div></div>`;
    (p.images || []).forEach((img) => {
        const src = projectPath(p, img.src);
        html += `
        <figure class="media-block">
            <a href="${src}" target="_blank"><img class="frame" src="${src}" alt="${esc(img.caption || p.title)}" loading="lazy" decoding="async"></a>
            ${img.caption ? `<figcaption>${esc(img.caption)}</figcaption>` : ""}
        </figure>`;
    });
    if (p.pdf) html += `
        <div class="media-block">
            <div class="btn-row">
                <a class="btn" href="${projectPath(p, p.pdf)}" target="_blank">↓ Download PDF</a>
                <button class="btn outline" id="pdf-toggle">View here</button>
            </div>
            <div id="pdf-slot"></div>
        </div>`;

    // Write-up
    if (p.writeup) {
        html += `<section class="writeup">`;
        for (const [heading, text] of Object.entries(p.writeup)) {
            if (!text) continue;
            html += `<h2>${esc(heading)}</h2>` + text.split(/\n\s*\n/).map((para) => `<p>${esc(para)}</p>`).join("");
        }
        html += `</section>`;
    }
    if (p.links && p.links.length) html += `<div class="btn-row">` + p.links.map((l) =>
        `<a class="btn outline" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join("") + `</div>`;

    // Previous / next
    const prev = PROJECTS[(i - 1 + PROJECTS.length) % PROJECTS.length];
    const next = PROJECTS[(i + 1) % PROJECTS.length];
    html += `<nav class="pager"><a href="${projectUrl(prev)}">← ${esc(prev.title)}</a><a href="${projectUrl(next)}">${esc(next.title)} →</a></nav>`;

    main.innerHTML = html;

    // PDF: only load the (possibly large) file when asked
    const toggle = $("#pdf-toggle");
    if (toggle) toggle.addEventListener("click", () => {
        const slot = $("#pdf-slot");
        if (slot.innerHTML) { slot.innerHTML = ""; toggle.textContent = "View here"; return; }
        slot.innerHTML = `<iframe class="frame" style="width:100%;height:85vh" src="${projectPath(p, p.pdf)}" title="${esc(p.title)} PDF"></iframe>`;
        toggle.textContent = "Hide";
    });

    // Leaflet: load the library, then the project's own scripts, in order
    if (p.map) {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(css);
        const files = [].concat(p.map);
        const scripts = files.filter((f) => f.endsWith(".js"));
        const layers = files.filter((f) => /\.(geo)?json$/.test(f));
        const queue = ["https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js", ...scripts.map((f) => projectPath(p, f))];
        (function next() {
            if (!queue.length) { if (!scripts.length) autoMap(p, layers); return; }
            const s = document.createElement("script");
            s.src = queue.shift();
            s.onload = next;
            document.body.appendChild(s);
        })();
    }
}


/* No map.js? Then any .geojson files listed in `map` are drawn
   automatically on a light basemap, with a popup of each feature's fields. */
async function autoMap(p, layers) {
    const map = L.map("project-map");
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
    }).addTo(map);
    const css = getComputedStyle(document.documentElement);
    const color = css.getPropertyValue("--maroon").trim(), fill = css.getPropertyValue("--red").trim();
    const bounds = L.latLngBounds([]);
    for (const f of layers) {
        const data = await fetch(projectPath(p, f)).then((r) => r.json());
        const layer = L.geoJSON(data, {
            style: { color, weight: 1.5, fillColor: fill, fillOpacity: 0.35 },
            pointToLayer: (_, ll) => L.circleMarker(ll, { radius: 6, color, weight: 2, fillColor: fill, fillOpacity: 0.8 }),
            onEachFeature: (feat, lyr) => {
                const rows = Object.entries(feat.properties || {}).map(([k, v]) => `<b>${esc(k)}</b>: ${esc(v)}`);
                if (rows.length) lyr.bindPopup(rows.join("<br>"));
            },
        }).addTo(map);
        bounds.extend(layer.getBounds());
    }
    bounds.isValid() ? map.fitBounds(bounds, { padding: [20, 20] }) : map.setView([39.8, -98.6], 4);
}


/* ---------- page: resume (link skills to projects) ---------- */
function pageResume() {
    const used = new Set(PROJECTS.flatMap((p) => [...(p.tools || []), ...(p.tags || [])]));
    document.querySelectorAll(".skill-group li").forEach((li) => {
        const name = li.dataset.tag || li.textContent.trim();
        if (used.has(name)) {
            const n = PROJECTS.filter((p) => (p.tools || []).includes(name) || (p.tags || []).includes(name)).length;
            li.innerHTML = `<a href="projects.html?tag=${encodeURIComponent(name)}" title="See ${n} project${n > 1 ? "s" : ""}">${esc(li.textContent.trim())} ↗</a>`;
        }
    });
}


/* ---------- start ---------- */
renderChrome();
({ home: pageHome, projects: pageProjects, project: pageProject, resume: pageResume }[document.body.dataset.page] || (() => {}))();
