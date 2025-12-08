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
const interactionRadius = 3;

interface cellData {
  token: number | null;
  labelMarker?: L.Marker | undefined;
}

const cellTokens = new Map<string, cellData>();

function cellKey(i: number, j: number): string {
  return `${i},${j}`;
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

function cellDistance(i: number, j: number) {
  return Math.sqrt(i * i + j * j);
}

function inRange(i: number, j: number) {
  return cellDistance(i, j) <= interactionRadius;
}

// --- Inventory Display ---
const inventoryPanelDiv = document.createElement("div");
inventoryPanelDiv.id = "inventoryPanel";
inventoryPanelDiv.style.padding = "1rem";
inventoryPanelDiv.style.fontWeight = "bold";
inventoryPanelDiv.textContent = "Holding: none";
document.body.append(inventoryPanelDiv);

let heldToken: number | null = null;

function updateInventoryDisplay() {
  if (heldToken === null) {
    inventoryPanelDiv.textContent = "Holding: none";
  } else {
    inventoryPanelDiv.textContent = `Holding: ${heldToken}`;
  }
}

// --- Draw the grid of cells with token values and click handlers ---
for (let i = -gridSize; i <= gridSize; i++) {
  for (let j = -gridSize; j <= gridSize; j++) {
    const key = cellKey(i, j);
    const bounds = cellBounds(i, j);
    const rect = L.rectangle(bounds, { color: "gray", weight: 1 });
    rect.addTo(map);

    // Determine token value for this cell
    const r = luck(`cell(${i},${j})`);
    const thresholds = [
      { max: 0.7, value: null },
      { max: 0.9, value: 1 },
      { max: 0.97, value: 2 },
      { max: Infinity, value: 4 },
    ];
    const value = thresholds.find((t) => r < t.max)?.value ?? null;

    let marker: L.Marker | undefined;
    if (value !== null) {
      marker = L.marker(bounds.getCenter(), {
        icon: L.divIcon({
          className: "token-label",
          html: `<div style="color: red; font-weight: bold;">${value}</div>`,
        }),
      }).addTo(map);
    }

    cellTokens.set(key, { token: value, labelMarker: marker });

    rect.on("click", () => {
      if (!inRange(i, j)) {
        return;
      }

      const cell = cellTokens.get(key)!;

      if (cell.token !== null && heldToken === null) {
        return;
      }

      heldToken = cell.token;

      cell.token = null;

      if (cell.labelMarker) {
        map.removeLayer(cell.labelMarker);
        cell.labelMarker = undefined;
      }
      updateInventoryDisplay();
    });
  }
}
