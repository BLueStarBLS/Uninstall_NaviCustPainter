let gridSize = 5;
let cellSize = 80;
let tiles = [];
let colors = ["#ff4444", "#03D93A", "#1B8CE3", "#ffff44", "#ffffff", "#ff88cc","#FA9300","#630563"];
let currentColor = colors[0];
let currentPattern = "smooth";
let canvas;
let previewCanvas;
let color_block_bk = "#207CA5";
let color_devideline = "#2E4068";
let compressedMode = false;
let outline_stroke = 8;
let compressed_alpha = 140;

function setup() {
  canvas = createCanvas(gridSize * cellSize + outline_stroke , gridSize * cellSize + outline_stroke);
  canvas.parent("canvas-container");
  noStroke();

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


let patterns = ["smooth", "block4" ,"block4-e6"];
let patternDiv = document.getElementById("pattern-options");
let patternButtons = {};

//生成花纹按钮
patterns.forEach((p) => {
  let btn = document.createElement("div");
  btn.classList.add("pattern-btn");
  switch (p) {
  case "smooth":
    btn.textContent = "光滑";
    break;

  case "block4":
    btn.textContent = "4格";
    break;

  case "block4-e6":
    btn.textContent = "4格-e6";
    break;

  default:
    btn.textContent = "光滑";
    break;
}


  btn.addEventListener("click", () => {
    currentPattern = p;
      if (currentColor === null) {
    currentColor = colors[0];
  }
    highlightPatternButton(patternButtons, p);
    highlightClearButton(clearBtn, false);
    updatePreview();
  });

  patternDiv.appendChild(btn);
  patternButtons[p] = btn;
});

//清除模式按钮
let clearBtn = document.getElementById("clear-btn");
clearBtn.addEventListener("click", () => {
  currentColor = null;
  highlightPatternButton(patternButtons, null);
  highlightClearButton(clearBtn, true);
  updatePreview(true);
});

//全部清除按钮
let clearAllBtn = document.getElementById("clear-all-btn");
clearAllBtn.addEventListener("click", () => {
  currentColor = null;
  highlightPatternButton(patternButtons, null);
  highlightClearButton(clearBtn,true);
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

//压缩模式
const compressedCheckbox = document.getElementById("compressed-checkbox");
compressedCheckbox.addEventListener("change", (e) => {
  compressedMode = e.target.checked;
});


// 初始化默认状态
highlightPatternButton(patternButtons, currentPattern);
highlightClearButton(clearBtn, false);
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

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      drawTile(x , y, tiles[y][x]);
    }
  }

}

function drawTile(x, y, tile) {
  push();
  translate(x * cellSize + outline_stroke/2 , y * cellSize + outline_stroke/2);

  let baseColor = color(tile.color);


 if (tile.variant === "compressed") {
    baseColor.setAlpha(compressed_alpha);
  }

  fill(baseColor);
  rect(0, 0, cellSize, cellSize);

  switch (tile.pattern) {
  case "smooth":
    break;
  case "block4":
    block4(baseColor, cellSize);
    break;

  case "block4-e6":
    block4_e6(baseColor, cellSize);
    break;

  default:
    break;
}

  stroke(color_devideline);
  strokeWeight(8);
  noFill();
  rect(0, 0, cellSize, cellSize);
  pop();
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

  ctx.rect(size/2 - gap/2 , 0, gap , size);
  ctx.rect( 0 , size/2 - gap/2 , size , gap);
}



function isModalOpen() {
  const modal = document.querySelector('.modal');
  return modal && !modal.classList.contains('hidden');
}

// 鼠标点击上色
function mousePressed() {
  if (!mouseInCanvas()) return;
  if(isModalOpen()) return;
  let x = floor(mouseX / cellSize);
  let y = floor(mouseY / cellSize);

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
  return mouseX >= 0 && mouseY >= 0 && mouseX < width && mouseY < height;
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
         box.style.backgroundColor = color_block_bk; 
         box.textContent = "清除"; 
         box.style.color = "#ccc"; 
         box.style.display = "flex"; 
         box.style.alignItems = "center"; 
         box.style.justifyContent = "center"; 
        } else { 
            box.textContent = ""; 
            box.style.backgroundColor = currentColor; 
        } 
    }

//导出模式
function exportGrid(size, transparent = false) {
  let pg = createGraphics(gridSize * cellSize + outline_stroke , gridSize * cellSize + outline_stroke);

  if (transparent) {
    pg.clear();
  } 

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      let tile = tiles[y][x];
      pg.push();
      pg.translate(x * cellSize + outline_stroke/2, y * cellSize + outline_stroke/2);

      let baseColor = color(tile.color);
      if (tile.variant === "compressed") {
        baseColor = darker(baseColor,0.8);
        baseColor.setAlpha(compressed_alpha);
      }

      if(!transparent||(transparent && baseColor.toString() !== color(color_block_bk).toString())){
        pg.noStroke();
        pg.fill(baseColor);
        pg.rect(0, 0, cellSize, cellSize);
      }

      switch (tile.pattern) {
      case "smooth":
        break;
      case "block4":
        block4(baseColor, cellSize,pg);
        break;

      case "block4-e6":
        block4_e6(baseColor, cellSize ,pg);
        break;

      default:
        break;
    }

      if (!transparent) {
        pg.stroke(color_devideline);
        pg.strokeWeight(8);
        pg.noFill();
        pg.rect(0, 0, cellSize, cellSize);
      }else if(baseColor.toString() !== color(color_block_bk).toString()){
        pg.stroke(darker(baseColor, 0.6));
        pg.strokeWeight(8);
        pg.noFill();
        pg.rect(0, 0, cellSize, cellSize);
      }

      pg.pop();
    }
  }

  let img = pg.get();
  img.resize(size, size);
  save(img, transparent ? "MyNaviCust_export_transparent.png" : "MyNaviCust_export.png");
}


