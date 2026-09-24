/* =====================================================================
   solidarity/archive.js: the Solidarity newspaper archive.
   Loaded only on solidarity.html and the issue pages.
   ===================================================================== */

const ARCHIVE = {
    // Flip to true once the issues are uploaded to the Internet Archive.
    // Until then, issue pages show the text only (no scan viewer or PDF links).
    iaLive: false,
    resultsPerPage: 15,
};

const IA = {
    viewer:   (id, page = 1, q = "") => `https://archive.org/embed/${id}/page/n${page - 1}/mode/1up${q ? `?q=${encodeURIComponent(q)}` : ""}`,
    details:  (id) => `https://archive.org/details/${id}`,
    download: (id, file) => `https://archive.org/download/${id}/${encodeURIComponent(file)}`,
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const longDate = (iso) => { const [y, m, d] = iso.split("-"); return `${MONTHS[m - 1]} ${+d}, ${y}`; };
const numbers = (i) => [`Vol. ${i.vol}`, i.no && `No. ${i.no}`, i.whole && `Whole No. ${i.whole}`].filter(Boolean).join(", ");


/* ---------------------------------------------------------------------
   Archive home: search + browse
   --------------------------------------------------------------------- */
async function archiveHome() {
    const data = await fetch("solidarity/issues.json").then((r) => r.json());
    const issues = data.issues;
    const years = Object.keys(data.years);
    const params = new URLSearchParams(location.search);
    let year = params.get("year") || "All";
    let query = params.get("q") || "";
    let pagefind = null, results = [], shown = 0, searchId = 0;

    const form = $("#search-form"), input = $("#search-input"), bar = $("#year-filter");
    const status = $("#search-status"), list = $("#results"), more = $("#more-results");
    input.value = query;

    // Year buttons
    function drawYears() {
        bar.innerHTML = ["All", ...years].map((y) =>
            `<button class="tag${y === year ? " active" : ""}" data-year="${y}">${y}</button>`).join("");
    }
    bar.addEventListener("click", (e) => {
        if (!e.target.dataset.year) return;
        year = e.target.dataset.year;
        drawYears(); update();
    });

    // Browse list (no search)
    function browse() {
        const pick = year === "All" ? issues : issues.filter((i) => i.year === year);
        status.textContent = `${pick.length} issues${year === "All" ? `, ${years[0]}–${years.at(-1)}` : ` in ${year}`}`;
        let html = "", current = "";
        for (const i of pick) {
            if (i.year !== current) { current = i.year; html += `<h3 class="year-head">${current}</h3>`; }
            html += `<a class="issue-row" href="solidarity/issues/${i.slug}.html">
                <span class="date">${longDate(i.date)}</span>
                <span class="nums">${numbers(i)} · ${i.pages} pp.</span></a>`;
        }
        list.innerHTML = html;
        more.hidden = true;
    }

    // Search (Pagefind loads only when someone actually searches)
    async function search() {
        const id = ++searchId;
        status.textContent = "Searching…";
        if (!pagefind) {
            pagefind = await import("./pagefind/pagefind.js");
            await pagefind.options({ excerptLength: 30 });
        }
        const r = await pagefind.search(query, year === "All" ? {} : { filters: { year } });
        if (id !== searchId) return;                     // a newer search started
        results = r.results; shown = 0; list.innerHTML = "";
        status.textContent = `${results.length} issue${results.length === 1 ? "" : "s"} mention “${query}”${year === "All" ? "" : ` in ${year}`}`;
        await showMore();
    }
    async function showMore() {
        const batch = await Promise.all(results.slice(shown, shown + ARCHIVE.resultsPerPage).map((r) => r.data()));
        shown += batch.length;
        list.insertAdjacentHTML("beforeend", batch.map(resultHTML).join(""));
        more.hidden = shown >= results.length;
    }
    function resultHTML(d) {
        const url = "solidarity/issues/" + d.url.split("/issues/")[1].replace(/(\.html)?$/, ".html");
        const pages = d.sub_results
            .filter((s) => /#p\d+$/.test(s.url))
            .sort((a, b) => b.locations.length - a.locations.length)
            .slice(0, 3)
            .sort((a, b) => +a.url.split("#p")[1] - +b.url.split("#p")[1]);
        return `<div class="result">
            <a class="result-title" href="${url}?q=${encodeURIComponent(query)}">${esc(d.meta.title.replace("Solidarity: ", ""))}</a>
            <span class="nums">${esc(d.meta.numbers || "")}</span>
            ${pages.map((s) => {
                const p = s.url.split("#p")[1];
                return `<a class="result-page" href="${url}?q=${encodeURIComponent(query)}#p${p}"><b>Page ${p}</b> ${s.excerpt}</a>`;
            }).join("")}
        </div>`;
    }
    more.addEventListener("click", showMore);

    function update() {
        const qs = new URLSearchParams();
        if (query) qs.set("q", query);
        if (year !== "All") qs.set("year", year);
        history.replaceState(null, "", "solidarity.html" + (qs.toString() ? "?" + qs : ""));
        query.trim().length >= 2 ? search() : browse();
    }
    form.addEventListener("submit", (e) => { e.preventDefault(); query = input.value.trim(); update(); });
    let t; input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { query = input.value.trim(); update(); }, 350); });

    // Downloads
    const dl = $("#downloads");
    if (dl) dl.innerHTML =
        `<a class="btn" href="solidarity/solidarity-ocr-text.zip">↓ All OCR text (zip)</a>` +
        (ARCHIVE.iaLive ? years.filter((y) => data.years[y].file).map((y) =>
            `<a class="btn outline" href="${IA.download(data.years[y].ia, data.years[y].file)}">↓ ${y} (PDF)</a>`).join("") : "");

    drawYears(); update();
}


/* ---------------------------------------------------------------------
   Issue page: scan viewer + highlighted text
   --------------------------------------------------------------------- */
function archiveIssue() {
    const box = $("#issue");
    const { ia, file, txt } = box.dataset;
    const pages = +box.dataset.pages;
    const q = new URLSearchParams(location.search).get("q") || "";
    let page = +(location.hash.match(/^#p(\d+)$/) || [0, 1])[1];

    if (ARCHIVE.iaLive) {
        box.innerHTML = `
            <div class="page-picker">Page: ${Array.from({ length: pages }, (_, n) =>
                `<button class="tag" data-p="${n + 1}">${n + 1}</button>`).join("")}</div>
            <div class="media-block"><iframe class="frame issue-viewer" title="Scan" allowfullscreen></iframe></div>
            <div class="btn-row">
                <a class="btn" href="${IA.download(ia, file)}">↓ PDF</a>
                <a class="btn outline" href="${IA.download(ia, txt)}">↓ Text</a>
                <a class="btn outline" href="${IA.details(ia)}" target="_blank" rel="noopener">Internet Archive ↗</a>
            </div>`;
        const frame = box.querySelector("iframe");
        const show = (p) => {
            page = p;
            frame.src = IA.viewer(ia, p, q);
            box.querySelectorAll("[data-p]").forEach((b) => b.classList.toggle("active", +b.dataset.p === p));
        };
        box.addEventListener("click", (e) => { if (e.target.dataset.p) show(+e.target.dataset.p); });
        document.querySelectorAll(".ocr-page-title").forEach((h) => {
            const p = +h.id.slice(1);
            h.insertAdjacentHTML("beforeend", ` <button class="tag" data-view="${p}">view scan</button>`);
        });
        document.addEventListener("click", (e) => {
            if (e.target.dataset.view) { show(+e.target.dataset.view); box.scrollIntoView({ behavior: "smooth" }); }
        });
        show(page);
    } else {
        box.innerHTML = `<p class="ocr-note">Page scans and PDF downloads are coming soon.</p>`;
    }

    // Highlight the search words in the text
    if (q) {
        const words = q.split(/\s+/).filter((w) => w.length > 1).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
        const re = new RegExp(`\\b(${words.join("|")})`, "gi");
        document.querySelectorAll(".ocr-page").forEach((el) => { el.innerHTML = el.innerHTML.replace(re, "<mark>$1</mark>"); });
    }
    // Scroll to the page in the text if the link asked for one
    if (location.hash) (ARCHIVE.iaLive ? box : document.querySelector(location.hash))?.scrollIntoView();
}


/* ---------- start ---------- */
if (document.body.dataset.page === "solidarity") archiveHome();
if (document.body.dataset.page === "solidarity-issue") archiveIssue();
