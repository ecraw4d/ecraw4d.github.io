/* =====================================================================
   projects.js — every project on the site lives in this one list.
   ---------------------------------------------------------------------
   • The ORDER here is the order on the Projects page.
   • Each project's files go in  projects/<slug>/  (paths below are
     relative to that folder).
   • Only slug, title, summary and thumb are required. Leave out
     anything you don't need.
   • tools/add_project.py creates the folder + an entry for you.

   FIELDS
     slug      folder name + URL (project.html?p=<slug>). lowercase-with-dashes
     title     project title
     summary   1–2 sentences, shown on the card and at the top of the page
     thumb     card image (800px wide .webp is ideal)
     featured  true = shown on the home page
     tags      topics — become the filter buttons on the Projects page
     tools     software/data used — linked from the resume skills
     date      optional text, e.g. "Spring 2025"
     badge     optional label on the card image (defaults to first tag)

     images    [{ src: "map.webp", caption: "…" }, …]  static maps/figures
     embed     "https://…"   StoryMap / ArcGIS Online / Earth Engine app
     map       ["layer.geojson"]      → automatic interactive map of that data
               ["data.js", "map.js"]  → your own Leaflet code instead
     pdf       "report.pdf"  adds Download + View-here buttons
     links     [{ label: "GitHub", url: "https://…" }, …]
     writeup   { "Overview": "…", "Methodology": "…" }  any headings you like;
               a blank line (\n\n) starts a new paragraph
   ===================================================================== */

const PROJECTS = [
    {
        slug: "warbler-ridge",
        title: "Sentinel-2, Sentinel-1 SAR, and Random Forest Classification at Warbler Ridge Conservation Area, 2017–2024",
        summary: "Can free satellite imagery and a simple machine-learning workflow help small land trusts monitor restoration? Land-cover classification at Warbler Ridge Conservation Area, IL, 2017–2024.",
        thumb: "thumb.webp",
        featured: true,
        tags: ["Remote Sensing", "Machine Learning", "Conservation"],
        tools: ["Google Earth Engine"],
        images: [{ src: "figure.webp", caption: "" }],
        pdf: "report.pdf",
        writeup: {
            "Overview": "Small land trusts protect a lot of restored land across the Midwest, but they rarely have the resources to monitor restoration outcomes systematically. This project asks whether free satellite imagery and a simple machine learning workflow can fill that gap.\n\nI used Sentinel-2 optical imagery and Sentinel-1 synthetic aperture radar (SAR) to map land cover at Warbler Ridge Conservation Area (WRCA), a 447-hectare property in Coles County, Illinois owned by Grand Prairie Friends, for five years between 2017 and 2024."
        }
    },
    {
        slug: "brazoria-prisons",
        title: "Brazoria County: Historical Plantations to Modern Prisons",
        summary: "A cartographic layout mapping the overlap between 19th-century cotton plantations and modern Texas prison units in Brazoria County, TX.",
        thumb: "thumb.webp",
        featured: true,
        tags: ["Cartography", "Historical GIS"],
        tools: ["ArcGIS Pro", "Illustrator"],
        images: [{ src: "map.webp", caption: "Final layout. Click to open full size." }],
        pdf: "map.pdf",
        writeup: {
            "Overview": "This map documents the spatial continuity between the plantation economy of the antebellum South and the contemporary carceral landscape in Brazoria County, Texas. Six modern TDCJ prison units sit on or adjacent to land historically recorded as plantation sites, including the Darrington, Ramsey, Terrell, Stringfellow, Scott, and Clemens Units.",
            "Methodology": "Historical plantation boundaries were digitized from archival county records and georeferenced in ArcGIS Pro. Modern prison footprints were sourced from publicly available TDCJ facility data. The final layout was designed in ArcGIS Pro with custom symbology to distinguish plantations with and without co-located prisons."
        }
    },
    {
        slug: "crop-heat-stress",
        title: "Thermal Band Indicators of Crop Heat Stress Before NDVI Decline",
        summary: "Using thermal imagery to detect crop heat stress before it shows up as an NDVI decline.",
        thumb: "thumb.webp",
        tags: ["Remote Sensing", "Agriculture"],
        tools: ["ENVI"],
        images: [{ src: "figure.webp", caption: "" }]
    },
    {
        slug: "seattle-environmental-health",
        title: "Spatial Analysis of Environmental Health Risks in Seattle",
        summary: "An intersectional GIS analysis combining noise, air toxicity, water toxicity, and PM2.5 with demographic indicators across Seattle census tracts.",
        thumb: "thumb.webp",
        featured: true,
        tags: ["Spatial Analysis", "Public Health", "Environmental Justice"],
        tools: ["QGIS", "Census Data"],
        images: [{ src: "figure.webp", caption: "" }],
        pdf: "report.pdf",
        writeup: {
            "Overview": "This paper studies physical environment risk levels in Seattle through an intersectional framework, examining how race, income, education, and housing affordability correlate with environmental health burdens at the census tract level. The model adapts Eco-Intersectional Multilevel modeling to an urban scale to identify reoccurring intersectional identities that surface as health inequity indicators.",
            "Methodology": "Four environmental risk indicators were used: noise exposure (EPA population-weighted exposure, 2020), air toxicity (Washington Tracking Network RSEI, 2018–2021), water toxicity, and PM2.5 (WTN/EJSCREEN, 2021). Demographic data came from the 2019 ACS five-year estimates. A four-digit stratum ID intersectionality approach was applied using the QGIS field calculator, with affordability data from the HUD Location Affordability Index (v.3)."
        }
    },
    {
        slug: "santiago-segregation",
        title: "The Segregated Capital of Santiago",
        summary: "An interactive StoryMap exploring spatial division and urban planning in Chile's capital.",
        thumb: "thumb.webp",
        badge: "StoryMap",
        tags: ["Urban Planning", "Web Mapping"],
        tools: ["ArcGIS StoryMaps", "ArcGIS Online"],
        embed: "https://storymaps.arcgis.com/stories/f410a9146ed74cfcbe4d2bfb5cae7e5f",
        writeup: {
            "Overview": "This ArcGIS StoryMap explores the spatial division and historical segregation within Santiago, Chile. It combines interactive web maps with narrative text to analyze how urban planning and historical policies have shaped the city's current socio-economic landscape.",
            "Methodology": "I used ArcGIS Online to host the spatial data and designed the narrative flow using the StoryMaps builder. Data layers include demographic distributions, transit accessibility, and historical boundary maps."
        }
    },
    {
        slug: "chicago-health",
        title: "Socio-Economic Factors & Health Outcomes in Chicago",
        summary: "Choropleth mapping, Moran's I, and regression of poverty, unemployment, diabetes deaths, and infant mortality across Chicago's 77 community areas (2005–2011).",
        thumb: "thumb.webp",
        tags: ["Spatial Analysis", "Public Health"],
        tools: ["GeoDa"],
        images: [{ src: "figure.webp", caption: "" }],
        pdf: "report.pdf",
        writeup: {
            "Overview": "This project explores how socioeconomic factors like poverty and unemployment correlate with health outcomes — specifically diabetes-related deaths and infant mortality — across Chicago's 77 community areas from 2005 to 2011. Choropleth maps revealed consistent spatial clustering of high-risk conditions in the city's southern community areas.",
            "Methodology": "Data was sourced from the GeoDa 'Chicago Health Indicators 2005–2011' dataset. Analysis included Natural Breaks choropleth mapping, Moran's I spatial autocorrelation (rook contiguity weights), scatter plot matrices, and multiple regression for diabetes-related deaths (R² = 0.592) and infant mortality (R² = 0.641)."
        }
    },
    {
        slug: "us-population-density",
        title: "US Population Density",
        summary: "An interactive Leaflet choropleth of population density by state, using US Census Bureau data.",
        thumb: "thumb.webp",
        badge: "Interactive",
        tags: ["Web Mapping"],
        tools: ["Leaflet", "JavaScript", "Census Data"],
        map: ["us-states.js", "map.js"],
        writeup: {
            "Overview": "This interactive web map visualizes population density across the United States using a choropleth technique. Data was sourced from the US Census Bureau.",
            "Methodology": "The map was built with the Leaflet.js library. I classified the population density data into distinct bins and assigned a sequential color scheme to highlight areas of high concentration (like the Northeast corridor) versus lower-density regions."
        }
    },
    // @@ new projects are added above this line by tools/add_project.py
];
