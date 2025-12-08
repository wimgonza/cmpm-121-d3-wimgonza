// @deno-types="npm:@types/leaflet"
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./_leafletWorkaround.ts";

// --- 1. Create the map ---
const mapContainer = document.createElement("div");
mapContainer.id = "map";
mapContainer.style.width = "100%";
mapContainer.style.height = "100vh";
document.body.appendChild(mapContainer);

const CLASSROOM = L.latLng(36.997936938057016, -122.05703507501151);

const map = L.map(mapContainer, {
  center: CLASSROOM,
  zoom: 19,
  zoomControl: false,
  scrollWheelZoom: false,
});

// Add OpenStreetMap tile layer
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

// --- 2. Draw the player's location on the map ---
const playerMarker = L.marker(CLASSROOM).addTo(map);
playerMarker.bindTooltip("You are here!", { permanent: true });
playerMarker.addTo(map);

// --- 3. Draw a rectangle representing one cell on the map ---
const cellSizeDegrees = 0.0001;
function cellBounds(i: number, j: number) {
  return L.latLngBounds(
    [CLASSROOM.lat + i * cellSizeDegrees, CLASSROOM.lng + j * cellSizeDegrees],
    [
      CLASSROOM.lat + (i + 1) * cellSizeDegrees,
      CLASSROOM.lng + (j + 1) * cellSizeDegrees,
    ],
  );
}

L.rectangle(cellBounds(0, 0), { color: "blue", weight: 1 }).addTo(map);

// --- 4. Use loops to draw a whole grid of cells on the map ---
const gridSize = 5;
for (let i = -gridSize; i <= gridSize; i++) {
  for (let j = -gridSize; j <= gridSize; j++) {
    L.rectangle(cellBounds(i, j), { color: "gray", weight: 1 }).addTo(map);
  }
}
