// @deno-types="npm:@types/leaflet"
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./_leafletWorkaround.ts";
import luck from "./_luck.ts";

// --- Create the map ---
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

// --- Draw the player's location on the map ---
const playerMarker = L.marker(CLASSROOM).addTo(map);
playerMarker.bindTooltip("You are here!", { permanent: true });
playerMarker.addTo(map);

// --- Define grid cells ---
const cellSizeDegrees = 0.0001;
const gridSize = 5;
const cellTokens = new Map<string, number | null>();

function cellKey(i: number, j: number): string {
  return `${i},${j}`;
}

function tokenForCell(i: number, j: number): number | null {
  const key = cellKey(i, j);
  if (cellTokens.has(key)) {
    return cellTokens.get(key)!;
  }

  const r = luck(`cell(${i},${j})`);
  const thresholds = [
    { max: 0.7, value: null },
    { max: 0.9, value: 1 },
    { max: 0.97, value: 2 },
    { max: Infinity, value: 4 },
  ];
  const value = thresholds.find(t => r < t.max)?.value ?? null;

  cellTokens.set(key, value);
  return value;
}

function cellBounds(i: number, j: number) {
  return L.latLngBounds(
    [CLASSROOM.lat + i * cellSizeDegrees, CLASSROOM.lng + j * cellSizeDegrees],
    [
      CLASSROOM.lat + (i + 1) * cellSizeDegrees,
      CLASSROOM.lng + (j + 1) * cellSizeDegrees,
    ],
  );
}

// --- Draw the grid of cells and show token values ---
for (let i = -gridSize; i <= gridSize; i++) {
  for (let j = -gridSize; j <= gridSize; j++) {
    const bounds = cellBounds(i, j);
    const _rectangle = L.rectangle(bounds, { color: "gray", weight: 1 }).addTo(
      map,
    );

    const token = tokenForCell(i, j);
    if (token !== null) {
      const center = bounds.getCenter();
      L.marker(center, {
        icon: L.divIcon({
          className: "token-label",
          html: `<div style="color: red; font-weight: bold;">${token}</div>`,
        }),
      }).addTo(map);
    }
  }
}

// --- Inventory Display ---
const inventoryPanelDiv = document.createElement("div");
inventoryPanelDiv.id = "inventoryPanel";
inventoryPanelDiv.style.padding = "1rem";
inventoryPanelDiv.style.fontWeight = "bold";
inventoryPanelDiv.textContent = "Holding: none";
document.body.append(inventoryPanelDiv);

const _inventory: number | null = null;
