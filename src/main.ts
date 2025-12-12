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

const map = L.map(mapContainer, {
  center: [36.997936938057016, -122.05703507501151],
  zoom: 19,
  zoomControl: false,
  scrollWheelZoom: false,
});

// Add OpenStreetMap tile layer
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

// --- Draw the player's location on the map ---
const playerMarker = L.marker([36.997936938057016, -122.05703507501151]).addTo(
  map,
);
playerMarker.bindTooltip("You are here!", { permanent: true });
playerMarker.addTo(map);

// --- Define grid cells and tokens ---
const CELL_DEGREES = 0.0001;
const INTERACTION_RADIUS = 3;
const TOKEN_STYLE = "color: red; font-weight: bold;";
const VICTORY_THRESHOLD = 8;

interface cellData {
  value: number | null;
  labelMarker?: L.Marker | undefined;
  rectangle?: L.Rectangle | undefined;
}

// Persistent storage for modified cells
const persistentCells = new Map<string, cellData>();

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

// --- Victory Popup Element ---
const victoryDiv = document.createElement("div");
victoryDiv.id = "victory";
victoryDiv.style.position = "absolute";
victoryDiv.style.top = "10px";
victoryDiv.style.left = "50%";
victoryDiv.style.transform = "translateX(-50%)";
victoryDiv.style.padding = "1rem 2rem";
victoryDiv.style.backgroundColor = "yellow";
victoryDiv.style.fontWeight = "bold";
victoryDiv.style.fontSize = "1.2rem";
victoryDiv.style.display = "none";
victoryDiv.style.zIndex = "1000";
victoryDiv.textContent = "Congratulations!";
document.body.append(victoryDiv);

// --- Determine player's current cell ---
const playerCell = {
  i: Math.floor(36.997936938057016 / CELL_DEGREES),
  j: Math.floor(-122.05703507501151 / CELL_DEGREES),
};

// --- Helper functions ---
function cellKey(i: number, j: number) {
  return `${i},${j}`;
}

function cellBounds(i: number, j: number) {
  return L.latLngBounds(
    [i * CELL_DEGREES, j * CELL_DEGREES],
    [(i + 1) * CELL_DEGREES, (j + 1) * CELL_DEGREES],
  );
}

function cellDistance(i: number, j: number) {
  return Math.max(Math.abs(i - playerCell.i), Math.abs(j - playerCell.j));
}

function inRange(i: number, j: number) {
  return cellDistance(i, j) <= INTERACTION_RADIUS;
}

// --- Draw the grid of cells with assigned token values ---
function generateTokenValue(i: number, j: number): number | null {
  const r = luck(`cell(${i},${j})`);
  if (r >= 0.7 && r < 0.9) return 1;
  if (r >= 0.9 && r < 0.97) return 2;
  if (r >= 0.97) return 4;
  return null;
}

// --- Save and load game state ---
function saveGame() {
  const cellsObj: Record<string, { value: number | null }> = {};
  for (const [key, cell] of persistentCells.entries()) {
    cellsObj[key] = { value: cell.value };
  }

  const saveData = {
    heldToken,
    playerCell,
    cells: cellsObj,
    hasWon: victoryDiv.style.display === "block",
  };

  localStorage.setItem("leafletGameSave", JSON.stringify(saveData));
}

function loadGame() {
  const raw = localStorage.getItem("leafletGameSave");
  if (!raw) return false;

  try {
    const data = JSON.parse(raw);

    heldToken = data.heldToken;
    playerCell.i = data.playerCell.i;
    playerCell.j = data.playerCell.j;
    updateInventoryDisplay();

    const newLat = playerCell.i * CELL_DEGREES + CELL_DEGREES / 2;
    const newLng = playerCell.j * CELL_DEGREES + CELL_DEGREES / 2;
    playerMarker.setLatLng([newLat, newLng]);
    map.panTo([newLat, newLng]);

    for (const key in data.cells) {
      persistentCells.set(key, { value: data.cells[key].value });
    }

    if (data.hasWon) {
      victoryDiv.style.display = "block";
    }

    return true;
  } catch {
    console.warn("Save data corrupted or invalid. Starting new game.");
    return false;
  }
}

// --- Cell clicks ---
function handleCellClick(i: number, j: number) {
  const key = cellKey(i, j);
  const cell = persistentCells.get(key);
  if (!cell) return;
  if (!inRange(i, j)) return;

  if (heldToken === null && cell.value !== null) {
    heldToken = cell.value;
    cell.value = null;
    if (cell.labelMarker) {
      cell.labelMarker.remove();
      cell.labelMarker = undefined;
    }
    updateInventoryDisplay();
    saveGame();
    return;
  }

  if (heldToken !== null && cell.value !== null && cell.value === heldToken) {
    const newValue = heldToken * 2;
    heldToken = null;

    if (cell.labelMarker) {
      cell.labelMarker.remove();
    }

    cell.value = newValue;
    cell.labelMarker = L.marker(cellBounds(i, j).getCenter(), {
      icon: L.divIcon({
        className: "token-label",
        html: `<div style="${TOKEN_STYLE}">${newValue}</div>`,
      }),
    }).addTo(map);

    updateInventoryDisplay();

    if (newValue >= VICTORY_THRESHOLD) {
      victoryDiv.style.display = "block";
    }
    saveGame();
  }
}

// --- Draw the one of the cells ---
function drawCell(i: number, j: number) {
  const key = cellKey(i, j);

  // Reuse persistent cell data if it exists
  let cell = persistentCells.get(key);

  if (!cell) {
    const value = generateTokenValue(i, j);
    cell = { value };
    persistentCells.set(key, cell);
  }

  if (cell.rectangle) return;

  const bounds = cellBounds(i, j);
  const rect = L.rectangle(bounds, { color: "gray", weight: 1 }).addTo(map);
  rect.on("click", () => handleCellClick(i, j));

  cell.rectangle = rect;

  if (cell.value !== null) {
    cell.labelMarker = L.marker(bounds.getCenter(), {
      icon: L.divIcon({
        className: "token-label",
        html: `<div style="${TOKEN_STYLE}">${cell.value}</div>`,
      }),
    }).addTo(map);
  }
}

// --- Update visible cells dynamically ---
function updateVisibleCells() {
  const bounds = map.getBounds();
  const topLeft = {
    i: Math.floor(bounds.getNorth() / CELL_DEGREES),
    j: Math.floor(bounds.getWest() / CELL_DEGREES),
  };
  const bottomRight = {
    i: Math.floor(bounds.getSouth() / CELL_DEGREES),
    j: Math.floor(bounds.getEast() / CELL_DEGREES),
  };

  const newVisible = new Set<string>();

  for (let i = bottomRight.i; i <= topLeft.i; i++) {
    for (let j = topLeft.j; j <= bottomRight.j; j++) {
      drawCell(i, j);
      newVisible.add(cellKey(i, j));
    }
  }

  // Remove cells that are no longer visible
  for (const [key, cell] of persistentCells.entries()) {
    if (!newVisible.has(key)) {
      if (cell.rectangle) {
        cell.rectangle.remove();
        cell.rectangle = undefined;
      }
      if (cell.labelMarker) {
        cell.labelMarker.remove();
        cell.labelMarker = undefined;
      }
    }
  }
}

// --- Initial drawing ---
map.on("moveend", updateVisibleCells);
if (!loadGame()) {
  updateVisibleCells();
  saveGame();
} else {
  updateVisibleCells();
}

// --- Player movement buttons ---
const controlPanelDiv = document.createElement("div");
controlPanelDiv.id = "controlPanel";
controlPanelDiv.style.padding = "1rem";
controlPanelDiv.style.display = "flex";
controlPanelDiv.style.gap = "0.5rem";
document.body.append(controlPanelDiv);

function movePlayer(di: number, dj: number) {
  playerCell.i += di;
  playerCell.j += dj;

  const newLat = playerCell.i * CELL_DEGREES + CELL_DEGREES / 2;
  const newLng = playerCell.j * CELL_DEGREES + CELL_DEGREES / 2;
  const newLatLng = L.latLng(newLat, newLng);

  playerMarker.setLatLng(newLatLng);
  map.panTo(newLatLng);
  updateVisibleCells();
  saveGame();
}

const directions: { label: string; di: number; dj: number }[] = [
  { label: "↑", di: 1, dj: 0 },
  { label: "↓", di: -1, dj: 0 },
  { label: "←", di: 0, dj: -1 },
  { label: "→", di: 0, dj: 1 },
];

directions.forEach(({ label, di, dj }) => {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.style.width = "2rem";
  btn.style.height = "2rem";
  btn.addEventListener("click", () => movePlayer(di, dj));
  controlPanelDiv.append(btn);
});

// --- New Game Button ---
const resetBtn = document.createElement("button");
resetBtn.textContent = "New Game";
resetBtn.style.marginLeft = "1rem";
resetBtn.style.padding = "0.5rem 1rem";
resetBtn.style.fontWeight = "bold";
resetBtn.addEventListener("click", () => {
  localStorage.removeItem("leafletGameSave");
  location.reload();
});
controlPanelDiv.append(resetBtn);

// --- Movement toggle button ---
const movementToggleBtn = document.createElement("button");
movementToggleBtn.textContent = "Use GPS";
movementToggleBtn.style.marginLeft = "1rem";
movementToggleBtn.style.padding = "0.5rem 1rem";
movementToggleBtn.style.fontWeight = "bold";
controlPanelDiv.append(movementToggleBtn);

let useGeolocation = false;
let geoWatchId: number | null = null;

movementToggleBtn.addEventListener("click", () => {
  useGeolocation = !useGeolocation;

  if (useGeolocation) {
    movementToggleBtn.textContent = "Use Buttons";
    controlPanelDiv.querySelectorAll("button").forEach((btn) => {
      if (btn !== movementToggleBtn && btn !== resetBtn) {
        btn.style.display = "none";
      }
    });
    startGeolocation();
  } else {
    movementToggleBtn.textContent = "Use GPS";
    controlPanelDiv.querySelectorAll("button").forEach((btn) => {
      if (btn !== movementToggleBtn && btn !== resetBtn) {
        btn.style.display = "inline-block";
      }
    });
    stopGeolocation();
  }
});

function startGeolocation() {
  if (!navigator.geolocation) return alert("Geolocation not supported.");
  geoWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      playerCell.i = Math.floor(latitude / CELL_DEGREES);
      playerCell.j = Math.floor(longitude / CELL_DEGREES);
      const newLatLng = L.latLng(latitude, longitude);
      playerMarker.setLatLng(newLatLng);
      map.panTo(newLatLng);
      updateVisibleCells();
      saveGame();
    },
    (err) => console.error("Geolocation error:", err),
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 },
  );
}

function stopGeolocation() {
  if (geoWatchId !== null) {
    navigator.geolocation.clearWatch(geoWatchId);
    geoWatchId = null;
  }
}
