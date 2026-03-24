let gridSize = 5;
let cellSize = 80;
let tiles = [];
let colors = ["#ff4444", "#03D93A", "#1B8CE3", "#ffff44", "#ffffff", "#ff88cc", "#FA9300", "#630563"];
let currentColor = colors[0];
let currentPattern = "smooth";
let canvas;
let previewCanvas;
let color_block_bk = "#207CA5";
let color_devideline = "#2E4068";
let compressedMode = false;
let outline_stroke = 8;
let compressed_alpha = 140;
let layout_padding = 40;
let board_stroke_color = "#2E4068";
let board_fill_color = "#2E4068";

const i18n = {
  zh: {
    title: "Uninstall - Navi Cust Painter",
    information: "预览",
    program: "绘画工具",
    preview: "预览",
    color_select: "颜色选择",
    custom_color: "自定义颜色",
    compressed_mode: "压缩模式（半透明）",
    clear_mode: "清除模式",
    clear_all: "全部清除",
    pattern_select: "花纹选择",
    export: "导出图像",
    export_setting: "导出设置",
    export_size: "边长（像素）：",
    transparent_bg: "透明背景",
    export_confirm: "导出",
    export_cancel: "取消",
    pattern_smooth: "光滑",
    pattern_block4: "4格",
    pattern_block4_e6: "4格-e6",
    clear: "清除",
  },
  en: {
    title: "Uninstall - Navi Cust Painter",
    information: "Preview",
    program: "Drawing Tool",
    preview: "Preview",
    color_select: "Color",
    custom_color: "Custom",
    compressed_mode: "Compressed Mode",
    clear_mode: "Clear Mode",
    clear_all: "Clear All",
    pattern_select: "Pattern",
    export: "Export",
    export_setting: "Export Setting",
    export_size: "Size (px):",
    transparent_bg: "Transparent",
    export_confirm: "Export",
    export_cancel: "Cancel",
    pattern_smooth: "Smooth",
    pattern_block4: "4Block",
    pattern_block4_e6: "4Block-BN6",
    clear: "Clear",
  }
};
let currentLang = "zh";

function setup() {
  canvas = createCanvas(gridSize * cellSize + layout_padding * 2, gridSize * cellSize + layout_padding * 2);
  canvas.parent("canvas-container");
  noStroke();

  // Initialize lang switch
  setupLanguageSwitch();

  // 初始化方块状态
  for (let y = 0; y < gridSize; y++) {
    tiles[y] = [];
    for (let x = 0; x < gridSize; x++) {
      tiles[y][x] = { color: color_block_bk, pattern: "smooth", variant: "normal" };
    }
  }

  // 生成颜色按钮
  let colorDiv = document.getElementById("color-options");
  colors.forEach((c) => {
    let btn = document.createElement("div");
    btn.classList.add("color-btn");
    btn.style.backgroundColor = c;
    btn.addEventListener("click", () => {
      currentColor = c;
      updatePreview();
    });
    colorDiv.appendChild(btn);
  });

  // 取色器
  let colorPicker = document.getElementById("custom-color");
  colorPicker.addEventListener("input", (e) => {
    currentColor = e.target.value;
    updatePreview();
  });


  let patterns = ["smooth", "block4", "block4-e6"];
  let patternDiv = document.getElementById("pattern-options");
  window.patternButtons = {};

  //生成花纹按钮
  patterns.forEach((p) => {
    let btn = document.createElement("div");
    btn.classList.add("pattern-btn");
    let span = document.createElement("span");

    switch (p) {
      case "smooth":
        span.setAttribute("data-i18n", "pattern_smooth");
        span.textContent = i18n[currentLang].pattern_smooth;
        break;

      case "block4":
        span.setAttribute("data-i18n", "pattern_block4");
        span.textContent = i18n[currentLang].pattern_block4;
        break;

      case "block4-e6":
        span.setAttribute("data-i18n", "pattern_block4_e6");
        span.textContent = i18n[currentLang].pattern_block4_e6;
        break;

      default:
        span.setAttribute("data-i18n", "pattern_smooth");
        span.textContent = i18n[currentLang].pattern_smooth;
        break;
    }
    btn.appendChild(span);

    btn.addEventListener("click", () => {
      currentPattern = p;
      if (currentColor === null) {
        currentColor = colors[0];
      }
      highlightPatternButton(window.patternButtons, p);
      highlightClearButton(clearBtn, false);
      updatePreview();
    });

    patternDiv.appendChild(btn);
    window.patternButtons[p] = btn;
  });

  //清除模式按钮
  let clearBtn = document.getElementById("clear-btn");
  clearBtn.addEventListener("click", () => {
    currentColor = null;
    highlightPatternButton(window.patternButtons, null);
    highlightClearButton(clearBtn, true);
    updatePreview(true);
  });

  //全部清除按钮
  let clearAllBtn = document.getElementById("clear-all-btn");
  clearAllBtn.addEventListener("click", () => {
    currentColor = null;
    highlightPatternButton(window.patternButtons, null);
    highlightClearButton(clearBtn, true);
    updatePreview(true);

    //清除所有方块
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        tiles[y][x] = { color: color_block_bk, pattern: "smooth" };
      }
    }

  });

  // 导出模式按钮
  let exportBtn = document.getElementById("export-btn");
  let exportModal = document.getElementById("export-modal");
  let confirmExportBtn = document.getElementById("confirm-export");
  let cancelExportBtn = document.getElementById("cancel-export");

  exportBtn.addEventListener("click", () => {
    exportModal.classList.remove("hidden");
  });

  cancelExportBtn.addEventListener("click", () => {
    exportModal.classList.add("hidden");
  });

  confirmExportBtn.addEventListener("click", () => {
    let exportSize = parseInt(document.getElementById("export-size").value) || 500;
    let transparent = document.getElementById("export-transparent").checked;
    exportModal.classList.add("hidden");
    exportGrid(exportSize, transparent);
  });

  // 压缩模式按钮
  let compressBtn = document.getElementById("compress-mode-btn");
  if (compressBtn) {
    compressBtn.addEventListener("click", () => {
      compressedMode = !compressedMode;
      compressBtn.classList.toggle("active", compressedMode);
      updatePreview();
    });
  }


  // 初始化默认状态
  highlightPatternButton(window.patternButtons, currentPattern);
  highlightClearButton(clearBtn, false);
  updatePreview();
}

function setupLanguageSwitch() {
  const langSelect = document.getElementById("lang-switch-select");
  if (langSelect) {
    langSelect.addEventListener("change", (e) => setLanguage(e.target.value));
  }

  // Set initial language upon load
  setLanguage(currentLang);
}

function setLanguage(lang) {
  currentLang = lang;

  const langSelect = document.getElementById("lang-switch-select");
  if (langSelect && langSelect.value !== lang) {
    langSelect.value = lang;
  }

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (i18n[lang][key]) {
      el.textContent = i18n[lang][key];
    }
  });

  updatePreview(currentColor === null);
}


function highlightPatternButton(patternButtons, selected) {
  for (let key in patternButtons) {
    patternButtons[key].classList.toggle("active", key === selected);
  }
}

function highlightClearButton(clearBtn, active) {
  clearBtn.classList.toggle("active", active);
}


function draw() {
  background(40);

  push();
  translate(layout_padding, layout_padding);

  // 1. Draw Grid Background + Middle Row + Grid Lines
  drawBoardBackgroundLayer(window);

  // 2. Draw placed blocks (on top of grid lines)
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      drawTile(x, y, tiles[y][x], window);
    }
  }

  // 3. Draw Board Frame (thick border enclosing the grid)
  drawFrameLayer(window);

  pop();
}

function drawBoardBackgroundLayer(ctx) {
  let fullSize = gridSize * cellSize;

  // Fill the grid itself
  ctx.noStroke();
  ctx.fill(color_block_bk);
  ctx.rect(0, 0, fullSize, fullSize);

  // Tab backing
  ctx.rect(-24, cellSize * 2, 24, cellSize);

  // Arrow backing
  ctx.beginShape();
  ctx.vertex(fullSize, cellSize * 2);
  ctx.vertex(fullSize + 22, cellSize * 2.5);
  ctx.vertex(fullSize, cellSize * 3);
  ctx.endShape(ctx.CLOSE);

  // Middle row horizontal bars
  ctx.push();
  let barY1 = cellSize * 2.25;
  let barY2 = cellSize * 2.75;
  ctx.stroke(board_fill_color);
  ctx.strokeWeight(4);
  ctx.line(-20, barY1, fullSize + 14, barY1);
  ctx.line(-20, barY2, fullSize + 14, barY2);
  ctx.pop();

  // Draw all grid lines inside the bounds
  ctx.stroke(color_devideline);
  ctx.strokeWeight(4);
  for (let i = 0; i <= gridSize; i++) {
    ctx.line(i * cellSize, 0, i * cellSize, fullSize);
    ctx.line(0, i * cellSize, fullSize, i * cellSize);
  }
}

function drawFrameLayer(ctx) {
  ctx.push();
  ctx.noFill();
  ctx.strokeJoin(ctx.ROUND);

  // outline shadow / dark boundary
  ctx.stroke(board_stroke_color);
  ctx.strokeWeight(16);
  drawFramePath(ctx);



  ctx.pop();
}

function drawFramePath(ctx) {
  let fullSize = gridSize * cellSize;
  let d = 8; // offset outwards from grid boundary

  let L = -d;
  let R = fullSize + d;
  let T = -d;
  let B = fullSize + d;

  let tabT = cellSize * 2 - d;
  let tabB = cellSize * 3 + d;
  let tabL = L - 16;

  let arrowT = cellSize * 2 - d;
  let arrowB = cellSize * 3 + d;
  let arrowTipX = R + 22;
  let arrowTipY = cellSize * 2.5;

  let cut = 10; // bevel size for corners

  ctx.beginShape();
  // top edge
  ctx.vertex(L + cut, T);
  ctx.vertex(R - cut, T);
  ctx.vertex(R, T + cut);

  // right edge down to arrow
  ctx.vertex(R, arrowT);
  ctx.vertex(arrowTipX + d / 2, arrowTipY);
  ctx.vertex(R, arrowB);

  // right edge down to bottom
  ctx.vertex(R, B - cut);
  ctx.vertex(R - cut, B);
  ctx.vertex(L + cut, B);

  // left edge up to tab
  ctx.vertex(L, B - cut);
  ctx.vertex(L, tabB);

  // tab
  ctx.vertex(tabL, tabB);
  ctx.vertex(tabL, tabT);
  ctx.vertex(L, tabT);

  // left edge up to top
  ctx.vertex(L, T + cut);
  ctx.endShape(ctx.CLOSE);
}

function drawTile(x, y, tile, ctx = window) {
  if (tile.color === color_block_bk) return; // Skip rendering empty tiles entirely

  ctx.push();
  ctx.translate(x * cellSize, y * cellSize);

  let baseColor = color(tile.color);

  // Apply export compress darkering logic if needed, although draw passes already setup opacity
  if (tile.variant === "compressed") {
    // We adjust brightness only during export traditionally, but keeping it simple
    if (ctx !== window) {
      baseColor = darker(baseColor, 0.8);
    }
    baseColor.setAlpha(compressed_alpha);
  }

  ctx.fill(baseColor);
  ctx.noStroke();
  ctx.rect(0, 0, cellSize, cellSize);

  switch (tile.pattern) {
    case "smooth":
      break;
    case "block4":
      block4(baseColor, cellSize, ctx);
      break;

    case "block4-e6":
      block4_e6(baseColor, cellSize, ctx);
      break;

    default:
      break;
  }

  ctx.stroke(color_devideline);
  ctx.strokeWeight(4);
  ctx.noFill();
  ctx.rect(0, 0, cellSize, cellSize);
  ctx.pop();
}

function block4(color, size, pg = null) {
  const ctx = pg || this;
  ctx.noStroke();
  ctx.fill(darker(color, 0.6));

  let gap = size * 0.1;
  let s = (size - 3 * gap) / 2;

  ctx.rect(gap, gap, s, s);
  ctx.rect(gap * 2 + s, gap, s, s);
  ctx.rect(gap, gap * 2 + s, s, s);
  ctx.rect(gap * 2 + s, gap * 2 + s, s, s);
}

function block4_e6(color, size, pg = null) {
  const ctx = pg || this;
  ctx.noStroke();
  ctx.fill(darker(color, 0.6));

  let gap = size * 0.1;
  let s = size * 0.5;

  ctx.rect(size / 2 - gap / 2, 0, gap, size);
  ctx.rect(0, size / 2 - gap / 2, size, gap);
}



function isModalOpen() {
  const modal = document.querySelector('.modal');
  return modal && !modal.classList.contains('hidden');
}

// 鼠标点击上色
function mousePressed() {
  if (!mouseInCanvas()) return;
  if (isModalOpen()) return;
  let x = floor((mouseX - layout_padding) / cellSize);
  let y = floor((mouseY - layout_padding) / cellSize);

  if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;

  if (currentColor === null) {
    // 清除格子
    tiles[y][x] = { color: color_block_bk, pattern: "smooth", variant: "normal" };
  } else {
    tiles[y][x] = {
      color: currentColor,
      pattern: currentPattern,
      variant: compressedMode ? "compressed" : "normal"
    };
  }
}

// 判断鼠标是否在画布内
function mouseInCanvas() {
  let gx = mouseX - layout_padding;
  let gy = mouseY - layout_padding;
  return gx >= 0 && gy >= 0 && gx < gridSize * cellSize && gy < gridSize * cellSize;
}

// 颜色变暗函数
function darker(c, factor) {
  let col = color(c);
  return color(
    red(col) * factor,
    green(col) * factor,
    blue(col) * factor
  );
}

// 更新预览
function updatePreview(isClearMode = false) {
  let box = document.getElementById("preview-box");
  if (isClearMode || currentColor === null) {
    box.style.backgroundImage = "none";
    box.style.backgroundColor = color_block_bk;
    box.textContent = i18n[currentLang].clear;
    box.style.color = "#ccc";
    box.style.display = "flex";
    box.style.alignItems = "center";
    box.style.justifyContent = "center";
  } else {
    box.textContent = "";
    box.style.backgroundColor = "transparent";
    box.style.backgroundImage = `url(${getTileDataURL(currentColor, currentPattern, compressedMode ? "compressed" : "normal")})`;
  }

  // 更新花纹按钮的背景预览
  if (currentColor !== null) {
    for (let p in window.patternButtons) {
      window.patternButtons[p].style.backgroundImage = `url(${getTileDataURL(currentColor, p, compressedMode ? "compressed" : "normal")})`;
    }
  } else {
    let defaultColor = colors[0];
    for (let p in window.patternButtons) {
      window.patternButtons[p].style.backgroundImage = `url(${getTileDataURL(defaultColor, p, compressedMode ? "compressed" : "normal")})`;
    }
  }
}

function getTileDataURL(colorHex, pattern, variant) {
  let pgSize = 64; // resolution for icons
  let ratio = pgSize / cellSize;
  let pg = createGraphics(pgSize, pgSize);

  let baseColor = color(colorHex);
  if (variant === "compressed") {
    let darkened = darker(baseColor, 0.8);
    darkened.setAlpha(compressed_alpha);
    baseColor = darkened;
  }

  pg.background(40);

  pg.noStroke();
  pg.fill(baseColor);
  pg.rect(0, 0, pgSize, pgSize);

  pg.push();
  pg.scale(ratio);
  switch (pattern) {
    case "block4":
      block4(baseColor, cellSize, pg);
      break;
    case "block4-e6":
      block4_e6(baseColor, cellSize, pg);
      break;
    default:
      break;
  }
  pg.pop();

  // 优化描边 (optimized stroke)
  // use darker version of color for stroke in preview to make it look nicer or stick to default devideline
  let strokeColor = (baseColor.toString() === color(color_block_bk).toString()) ? color_devideline : darker(baseColor, 0.6);
  pg.stroke(strokeColor);
  pg.strokeWeight(8 * ratio);
  pg.noFill();
  pg.rect(0, 0, pgSize, pgSize);

  let dataURL = pg.canvas.toDataURL();
  pg.remove();
  return dataURL;
}

//导出模式
function exportGrid(size, transparent = false) {
  let fullGridSize = gridSize * cellSize;
  let exportCanvasSize = transparent ? fullGridSize : fullGridSize + layout_padding * 2;
  let pg = createGraphics(exportCanvasSize, exportCanvasSize);

  if (!transparent) {
    pg.background(40);
    pg.push();
    pg.translate(layout_padding, layout_padding);

    // Draw background layout elements
    drawBoardBackgroundLayer(pg);
    pg.pop();
  } else {
    pg.clear();
  }

  pg.push();
  if (!transparent) pg.translate(layout_padding, layout_padding);

  // Draw placed tiles
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      let tile = tiles[y][x];
      // Note: empty background blocks are natively skipped in our new drawTile logic!
      drawTile(x, y, tile, pg);
    }
  }

  // Draw frame on top for export (if not transparent)
  if (!transparent) {
    drawFrameLayer(pg);
  }

  pg.pop();

  let img = pg.get();
  img.resize(size, size);
  save(img, transparent ? "MyNaviCust_export_transparent.png" : "MyNaviCust_export.png");
}


