// =============================================================
//  projects-data.js — Single source of truth for map projects
//  To add a project: append a new object to this array and add
//  a card to maps.html pointing to project.html?id=<your new id>
//
//  Types:
//    "leaflet" — Interactive Leaflet map. Requires `scripts` array.
//    "iframe"  — Embed a StoryMap or web map via <iframe>. Requires `src`.
//    "image"   — Static image (JPG/PNG/SVG). Requires `src`.
//    "pdf"     — Embedded PDF viewer. Requires `src`.
// =============================================================

const PROJECTS = [
    {
        id: 1,
        title: "US Population Density",
        type: "leaflet",
        badges: ["Interactive Leaflet", "Choropleth"],
        thumbnail: "images/pop_density1.png",
        desc: "An interactive choropleth map showing population density using US Census Bureau data.",
        overview: "This interactive web map visualizes population density across the United States using a choropleth technique. Data was sourced from the US Census Bureau.",
        methodology: "The map was built using the Leaflet.js library. I classified the population density data into distinct bins and assigned a sequential color scheme to highlight areas of high concentration (like the Northeast corridor) versus lower density regions.",
        scripts: ["us-states.js", "project1.js"]
    },
    {
        id: 2,
        title: "The Segregated Capital of Santiago",
        type: "iframe",
        badges: ["ArcGIS StoryMap", "Urban Planning"],
        src: "https://storymaps.arcgis.com/stories/f410a9146ed74cfcbe4d2bfb5cae7e5f",
        thumbnail: "images/santiago_thumbnail.png",
        desc: "An interactive narrative exploring spatial division and urban planning in Chile's capital.",
        overview: "This ArcGIS StoryMap explores the spatial division and historical segregation within Santiago, Chile. It combines interactive web maps with narrative text to analyze how urban planning and historical policies have shaped the city's current socio-economic landscape.",
        methodology: "I utilized ArcGIS Online to host the spatial data and designed the narrative flow using the StoryMaps builder. Data layers include demographic distributions, transit accessibility, and historical boundary maps."
    },
    {
        id: 3,
        title: "Thermal Band Indicators of Crop Heat Stress Before NDVI Decline",
        type: "image",
        badges: ["Remote Sensing", "ENVI"],
        src: "images/remsens-thumb.png",         // TODO: replace with full-resolution export
        thumbnail: "images/remsens-thumb.png",
        desc: "Spatial analysis of thermal imagery to identify pre-NDVI decline crop heat stress.",
        overview: "TODO: Add overview text.",
        methodology: "TODO: Add methodology text."
    },
    {
        id: 4,
        title: "Custom Transit Map",
        type: "image",
        badges: ["Illustrator", "Cartography"],
        src: "images/hooded_pic.png",             // TODO: replace with final map export
        thumbnail: "images/hooded_pic.png",
        desc: "A stylized, schematic subway map created using Adobe Illustrator.",
        overview: "TODO: Add overview text.",
        methodology: "TODO: Add methodology text."
    },
    {
        id: 5,
        title: "Historical Redlining",
        type: "pdf",
        badges: ["PDF", "QGIS"],
        src: "assets/redlining-map.pdf",          // TODO: add PDF to assets/
        thumbnail: "images/hooded_pic.png",
        desc: "Digitizing historical maps to analyze modern urban impacts.",
        overview: "TODO: Add overview text.",
        methodology: "TODO: Add methodology text."
    },
    {
        id: 6,
        title: "Native Plant Sighting Map",
        type: "iframe",
        badges: ["Web Map", "Survey123"],
        src: "",                                  // TODO: add embed URL
        thumbnail: "images/hooded_pic.png",
        desc: "Crowdsourced locations of native plants around the UIUC campus.",
        overview: "TODO: Add overview text.",
        methodology: "TODO: Add methodology text."
    }
];
