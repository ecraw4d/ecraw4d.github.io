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
        id: 7,
        title: "Brazoria County: Historical Plantations to Modern Prisons",
        type: "pdf",
        badges: ["Cartography", "ArcGIS Pro", "Labor History"],
        src: "braz_final_layout.pdf",
        thumbnail: "images/hooded_pic.png",       // TODO: replace with map thumbnail
        desc: "A cartographic layout mapping the direct geographic overlap between 19th-century cotton plantations and modern Texas Department of Criminal Justice prison units in Brazoria County, TX.",
        overview: "This map documents the spatial continuity between the plantation economy of the antebellum South and the contemporary carceral landscape in Brazoria County, Texas. Six modern TDCJ prison units sit on or adjacent to land historically recorded as plantation sites, including the Darrington, Ramsey, Terrell, Stringfellow, Scott, and Clemens Units.",
        methodology: "Historical plantation boundaries were digitized from archival county records and georeferenced in ArcGIS Pro. Modern prison footprints were sourced from publicly available TDCJ facility data. The final layout was designed in ArcGIS Pro with custom symbology to distinguish plantations with and without co-located prisons."
    },
    {
        id: 8,
        title: "Socio-Economic Factors & Health Outcomes in Chicago",
        type: "pdf",
        badges: ["Spatial Analysis", "GeoDa", "QGIS"],
        src: "Chi_spatial_analysis.pdf",
        thumbnail: "images/hooded_pic.png",       // TODO: replace with map thumbnail
        desc: "Spatial analysis of poverty, unemployment, diabetes-related deaths, and infant mortality across Chicago community areas (2005–2011) using choropleth mapping and Moran's I autocorrelation.",
        overview: "This project explores how socioeconomic factors like poverty and unemployment correlate with health outcomes — specifically diabetes-related deaths and infant mortality — across Chicago's 77 community areas from 2005 to 2011. Choropleth maps revealed consistent spatial clustering of high-risk conditions in the city's southern community areas.",
        methodology: "Data was sourced from the GeoDa 'Chicago Health Indicators 2005–2011' dataset. Analysis included Natural Breaks choropleth mapping, Moran's I spatial autocorrelation (rook contiguity weights), scatter plot matrices, and multiple regression for both Diabe_lated (R²=0.592) and Infan_Rate (R²=0.641)."
    }
];
