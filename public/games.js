const GRID_SIZE = 4;
let grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
let lastGrid = null;
let moveCount = 0;
let gameOver = false;

function createTileElement(value, index) {
  const tile = document.createElement("div");
  const baseClasses = "w-20 h-20 flex items-center justify-center text-xl font-bold rounded shadow";
  const bgClass = getTileColor(value);
  tile.className = `${baseClasses} ${bgClass}`;
  tile.textContent = value !== 0 ? value : "";
  return tile;
}

function getTileColor(value) {
  switch (value) {
    case 0: return "bg-gray-200";
    case 2: return "bg-yellow-100 text-gray-800";
    case 4: return "bg-yellow-200 text-gray-800";
    case 8: return "bg-yellow-300 text-white";
    case 16: return "bg-orange-300 text-white";
    case 32: return "bg-orange-400 text-white";
    case 64: return "bg-orange-500 text-white";
    case 128: return "bg-green-300 text-white";
    case 256: return "bg-green-400 text-white";
    case 512: return "bg-green-500 text-white";
    case 1024: return "bg-blue-400 text-white";
    case 2048: return "bg-blue-600 text-white";
    default: return "bg-black text-white";
  }
}

function renderGrid() {
  const gridEl = document.getElementById("grid");
  gridEl.innerHTML = "";
  grid.flat().forEach((val, i) => gridEl.appendChild(createTileElement(val, i)));
  document.getElementById("moveCount").textContent = moveCount;
  updateRedoButton();
}

function updateRedoButton() {
  const redoButton = document.getElementById("redo");
  if (lastGrid) {
    redoButton.disabled = false;
    redoButton.classList.remove("opacity-50", "cursor-not-allowed");
  } else {
    redoButton.disabled = true;
    redoButton.classList.add("opacity-50", "cursor-not-allowed");
  }
}

function addRandomTile() {
  const empty = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function saveHistory() {
  lastGrid = JSON.parse(JSON.stringify(grid));
}

function handleRedo() {
  if (!lastGrid) return;
  grid = JSON.parse(JSON.stringify(lastGrid));
  lastGrid = null;
  moveCount = Math.max(0, moveCount - 1);
  renderGrid();
  document.getElementById("gameOverScreen").classList.add("hidden");
}

function slideAndMerge(row, rowIndex) {
  const nonZero = row.filter(n => n !== 0);
  const merged = [];
  for (let i = 0; i < nonZero.length; i++) {
    if (nonZero[i] === nonZero[i + 1]) {
      const newVal = nonZero[i] * 2;
      merged.push(newVal);
      i++;
    } else {
      merged.push(nonZero[i]);
    }
  }
  while (merged.length < GRID_SIZE) merged.push(0);
  return merged;
}

function rotateGridCW(g) {
  return g[0].map((_, i) => g.map(row => row[i]).reverse());
}

function rotateGridCCW(g) {
  return g[0].map((_, i) => g.map(row => row[GRID_SIZE - 1 - i]));
}

function rotateGrid180(g) {
  return g.map(row => [...row].reverse()).reverse();
}

function handleMove(direction) {
  if (gameOver) return;

  let rotated;
  if (direction === "left") rotated = grid;
  else if (direction === "right") rotated = rotateGrid180(grid);
  else if (direction === "up") rotated = rotateGridCCW(grid);
  else if (direction === "down") rotated = rotateGridCW(grid);

  const newGrid = rotated.map((row, i) => slideAndMerge(row, i));

  let unrotated;
  if (direction === "left") unrotated = newGrid;
  else if (direction === "right") unrotated = rotateGrid180(newGrid);
  else if (direction === "up") unrotated = rotateGridCW(newGrid);
  else if (direction === "down") unrotated = rotateGridCCW(newGrid);

  if (JSON.stringify(grid) !== JSON.stringify(unrotated)) {
    saveHistory();
    grid = unrotated;
    moveCount++;
    addRandomTile();
    renderGrid();
    checkWin();
    checkGameOver();
  }
}

function checkWin() {
  for (const row of grid) {
    if (row.includes(2048)) {
      document.getElementById("winMessage").classList.remove("hidden");
    }
  }
}

function checkGameOver() {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) return;
      const val = grid[r][c];
      if (r < GRID_SIZE - 1 && grid[r + 1][c] === val) return;
      if (c < GRID_SIZE - 1 && grid[r][c + 1] === val) return;
    }
  }
  gameOver = true;
  document.getElementById("gameOverScreen").classList.remove("hidden");
}

function restartGame() {
  grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
  lastGrid = null;
  moveCount = 0;
  gameOver = false;
  document.getElementById("winMessage").classList.add("hidden");
  document.getElementById("gameOverScreen").classList.add("hidden");
  addRandomTile();
  addRandomTile();
  renderGrid();
}

function handleKeyDown(e) {
  switch (e.key) {
    case "ArrowUp":
      handleMove("up");
      break;
    case "ArrowDown":
      handleMove("down");
      break;
    case "ArrowLeft":
      handleMove("left");
      break;
    case "ArrowRight":
      handleMove("right");
      break;
  }
}

function setupTouchControls() {
  let startX = 0;
  let startY = 0;

  window.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
  });

  window.addEventListener("touchend", (e) => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) handleMove("right");
      else if (dx < -30) handleMove("left");
    } else {
      if (dy > 30) handleMove("down");
      else if (dy < -30) handleMove("up");
    }
  });
}

document.getElementById("redo").addEventListener("click", handleRedo);
document.getElementById("restart").addEventListener("click", restartGame);
window.addEventListener("keydown", handleKeyDown);

addRandomTile();
addRandomTile();
renderGrid();
setupTouchControls();