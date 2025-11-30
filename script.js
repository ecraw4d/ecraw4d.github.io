// Initialize the map
var map = L.map('map').setView([47.618, -122.321], 11);

// Add OpenStreetMap tiles
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Add a marker
var marker = L.marker([47.618, -122.321]).addTo(map);
marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();

// Add a circle
var circle = L.circle([47.618, -122.321], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);
circle.bindPopup("I am a circle.");

// Add a polygon
var polygon = L.polygon([
    [47.618, -122.38],
    [47.618, -122.39],
    [47.618, -122.392]
]).addTo(map);
polygon.bindPopup("I am a polygon.");

// Click event for the map
var popup = L.popup();

function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map);
}

map.on('click', onMapClick);
