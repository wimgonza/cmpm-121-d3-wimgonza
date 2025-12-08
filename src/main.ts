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

// --- Define grid cells and tokens ---
const cellSizeDegrees = 0.0001;
const interactionRadius = 3;
const tokenStyle = "color: red; font-weight: bold;";

interface cellData {
  value: number | null;
  labelMarker: L.Marker | undefined;
  rectangle: L.Rectangle | undefined;
}

// Map to hold visible cell data
const visibleMarkers = new Map<string, cellData>();

let heldToken: number | null = null;

// --- Inventory Display ---
const inventoryPanelDiv = document.createElement("div");
inventoryPanelDiv.id = "inventoryPanel";
inventoryPanelDiv.style.padding = "1rem";
inventoryPanelDiv.style.fontWeight = "bold";
inventoryPanelDiv.textContent = "Holding: none";
document.body.append(inventoryPanelDiv);

function updateInventoryDisplay() {
  if (heldToken === null) {
    inventoryPanelDiv.textContent = "Holding: none";
  } else {
    inventoryPanelDiv.textContent = `Holding: ${heldToken}`;
  }
}

// --- Determine player's current cell ---
const playerCell = {
  i: Math.floor(CLASSROOM.lat / cellSizeDegrees),
  j: Math.floor(CLASSROOM.lng / cellSizeDegrees),
};

// --- Helper functions ---
function cellKey(i: number, j: number): string {
  return `cell(${i},${j})`;
}

function cellBounds(i: number, j: number) {
  return L.latLngBounds(
    [i * cellSizeDegrees, j * cellSizeDegrees],
    [(i + 1) * cellSizeDegrees, (j + 1) * cellSizeDegrees],
  );
}

function cellDistance(i: number, j: number, playerI: number, playerJ: number) {
  return Math.max(Math.abs(i - playerI), Math.abs(j - playerJ));
}

function inRange(i: number, j: number, playerI: number, playerJ: number) {
  return cellDistance(i, j, playerI, playerJ) <= interactionRadius;
}

// --- Draw the grid of cells with assigned token values ---
function generateTokenValue(i: number, j: number): number | null {
  const r = luck(`cell(${i},${j})`);
  if (r >= 0.7 && r < 0.9) return 1;
  if (r >= 0.9 && r < 0.97) return 2;
  if (r >= 0.97) return 4;
  return null;
}

// --- Cell clicks (memoryless) ---
function handleCellClick(i: number, j: number) {
  const key = cellKey(i, j);
  const cell = visibleMarkers.get(key);
  if (!cell) return;
  if (!inRange(i, j, playerCell.i, playerCell.j)) return;

  if (heldToken === null && cell.value !== null) {
    heldToken = cell.value;
    if (cell.labelMarker) cell.labelMarker.remove();
    cell.value = null;
    cell.labelMarker = undefined;
    updateInventoryDisplay();
    return;
  }

  if (heldToken !== null && cell.value === heldToken) {
    const newValue = heldToken * 2;
    heldToken = null;

    if (cell.labelMarker) cell.labelMarker.remove();

    cell.value = newValue;
    cell.labelMarker = L.marker(cellBounds(i, j).getCenter(), {
      icon: L.divIcon({
        className: "token-label",
        html: `<div style="${tokenStyle}">${newValue}</div>`,
      }),
    }).addTo(map);

    updateInventoryDisplay();
  }
}

// --- Draw the one of the cells ---
function drawCell(i: number, j: number) {
  const key = cellKey(i, j);
  if (visibleMarkers.has(key)) return; // already drawn

  const bounds = cellBounds(i, j);
  const rect = L.rectangle(bounds, { color: "gray", weight: 1 }).addTo(map);
  rect.on("click", () => handleCellClick(i, j));

  const value = generateTokenValue(i, j);
  const marker = value !== null
    ? L.marker(bounds.getCenter(), {
      icon: L.divIcon({
        className: "token-label",
        html: `<div style="${tokenStyle}">${value}</div>`,
      }),
    }).addTo(map)
    : undefined;

  visibleMarkers.set(key, { value, rectangle: rect, labelMarker: marker });
}

// --- Update visible cells dynamically ---
function updateVisibleCells() {
  const bounds = map.getBounds();
  const topLeft = {
    i: Math.floor(bounds.getNorth() / cellSizeDegrees),
    j: Math.floor(bounds.getWest() / cellSizeDegrees),
  };
  const bottomRight = {
    i: Math.floor(bounds.getSouth() / cellSizeDegrees),
    j: Math.floor(bounds.getEast() / cellSizeDegrees),
  };

  const newVisible = new Set<string>();
  for (let i = bottomRight.i; i <= topLeft.i; i++) {
    for (let j = topLeft.j; j <= bottomRight.j; j++) {
      drawCell(i, j);
      newVisible.add(cellKey(i, j));
    }
  }
  for (const [key, cell] of visibleMarkers.entries()) {
    if (!newVisible.has(key)) {
      if (cell.labelMarker) cell.labelMarker.remove();
      if (cell.rectangle) cell.rectangle.remove();
      visibleMarkers.delete(key);
    }
  }
}

// --- Initial drawing ---
map.on("moveend", updateVisibleCells);
updateVisibleCells();
