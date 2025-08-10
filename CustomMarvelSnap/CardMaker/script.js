import { generatecard } from "../scripts/cardDesign.js";

let imagesBase64 = {
  mainImage: null,
  frameImage: null,
  frameBreakImage: null,
  titleImage: null,
  effectImage: null,
};

var offsetX = 0;
var offsetY = 0;

// Global state for card settings
let cardSettings = {
  name: "",
  colorName: "#ffffff",
  nameOutlineColor: "#000000",
  fontSelect: "BadaBoom",
  nameZoom: 1,
  cost: "1",
  power: "2",
  description: "",
  zoom: 1,
  transparentBg: false,
  backgroundColor: "#10072b",
  offset: [0, 0],
  imagesBase64: imagesBase64,
  finish: "",
};

// For change detection
let lastRenderedSettings = null;
let isRendering = false;
let pendingRender = false;

function updateResult() {
  // Only update settings
  cardSettings.name = document.getElementById("name").value;
  cardSettings.colorName = document.getElementById("nameColor").value;
  cardSettings.nameOutlineColor =
    document.getElementById("nameOutlineColor").value;
  cardSettings.fontSelect = document.getElementById("fontSelect").value;
  cardSettings.nameZoom =
    1 + (document.getElementById("nameZoom").value - 100) / 100;
  cardSettings.cost = document.getElementById("cost").value;
  cardSettings.power = document.getElementById("power").value;
  cardSettings.description = document.getElementById("description").value;
  cardSettings.zoom = 1 + document.getElementById("imageZoom").value / 100;
  cardSettings.transparentBg = document.getElementById("transparentBg").checked;
  cardSettings.backgroundColor =
    cardSettings.transparentBg === false
      ? "transparent"
      : document.getElementById("backgroundColor").value;
  const nameOffsetY = document.getElementById("nameOffsetY").value * -1;
  cardSettings.offset = [offsetX, offsetY, nameOffsetY];
  cardSettings.imagesBase64 = imagesBase64;

  requestRender();
}

function requestRender() {
  if (isRendering) {
    pendingRender = true;
    return;
  }
  renderCard();
}

async function renderCard(skipCheck = false) {
  isRendering = true;
  const currentSettings = JSON.stringify(cardSettings);
  if (currentSettings !== lastRenderedSettings || skipCheck) {
    lastRenderedSettings = currentSettings;
    try {
      const canvas = await generatecard(
        cardSettings.name,
        cardSettings.colorName,
        cardSettings.nameOutlineColor,
        cardSettings.fontSelect,
        cardSettings.cost,
        cardSettings.power,
        cardSettings.description,
        1024,
        cardSettings.imagesBase64,
        cardSettings.zoom,
        cardSettings.nameZoom,
        cardSettings.backgroundColor,
        cardSettings.offset,
        cardSettings.finish
      );
      const cardCanvas = document.getElementById("cardImage");
      // Replace canvas content
      const ctx = cardCanvas.getContext("2d");
      ctx.clearRect(0, 0, cardCanvas.width, cardCanvas.height);
      ctx.drawImage(canvas, 0, 0);
    } catch (error) {
      console.error("Error rendering card:", error);
    }
  }
  isRendering = false;
  if (pendingRender) {
    pendingRender = false;
    renderCard();
  }
}

function mainImageChange(event) {
  const imageFile = event.target.files[0];
  const reader = new FileReader();
  reader.readAsDataURL(imageFile);
  reader.onload = function (e) {
    const base64 = e.target.result;
    imagesBase64.mainImage = base64;
    updateResult();
  };
}

function frameBreakImageChange(event) {
  const imageFile = event.target.files[0];
  const reader = new FileReader();
  reader.readAsDataURL(imageFile);
  reader.onload = function (e) {
    const base64 = e.target.result;
    imagesBase64.frameBreakImage = base64;
    updateResult();
  };
}

function titleImageChange(event) {
  const imageFile = event.target.files[0];
  const reader = new FileReader();
  reader.readAsDataURL(imageFile);
  reader.onload = function (e) {
    const base64 = e.target.result;
    imagesBase64.titleImage = base64;
    updateResult();
  };
}

async function clearMainImage() {
  imagesBase64.mainImage = null;
  updateResult();
}

function clearFrameBreakImage() {
  imagesBase64.frameBreakImage = null;
  updateResult();
}

function clearTitleImage() {
  imagesBase64.titleImage = null;
  updateResult();
}

function selectFrame() {
  const frameSelectPopup = document.getElementById("frameSelectPopup");
  frameSelectPopup.style.visibility = "visible";
  frameSelectPopup.style.opacity = "1";
}

function closeFrameSelectPopup() {
  const frameSelectPopup = document.getElementById("frameSelectPopup");
  frameSelectPopup.style.opacity = "0";
  frameSelectPopup.style.visibility = "hidden";
}

function selectEffect() {
  const effectSelectPopup = document.getElementById("effectSelectPopup");
  effectSelectPopup.style.visibility = "visible";
  effectSelectPopup.style.opacity = "1";
}

function closeEffectSelectPopup() {
  const effectSelectPopup = document.getElementById("effectSelectPopup");
  effectSelectPopup.style.opacity = "0";
  effectSelectPopup.style.visibility = "hidden";
}

function selectFinish() {
  const finishSelectPopup = document.getElementById("finishSelectPopup");
  finishSelectPopup.style.visibility = "visible";
  finishSelectPopup.style.opacity = "1";
}

function clearFinish() {
  cardSettings.finish = "";
  updateResult();
}

function closeFinishSelectPopup() {
  const finishSelectPopup = document.getElementById("finishSelectPopup");
  finishSelectPopup.style.opacity = "0";
  finishSelectPopup.style.visibility = "hidden";
}

function showTutorialPopup() {
  const tutorialPopup = document.getElementById("tutorialPopup");
  tutorialPopup.style.visibility = "visible";
  tutorialPopup.style.opacity = "1";
}

function closeTutorialPopup() {
  const tutorialPopup = document.getElementById("tutorialPopup");
  tutorialPopup.style.opacity = "0";
  tutorialPopup.style.visibility = "hidden";
}

function clearEffect() {
  imagesBase64.effectImage = null;
  updateResult();
}

function clearBackground() {
  const backgroundColor = document.getElementById("backgroundColor");
  backgroundColor.value = "#10072b";
  const transparentBg = document.getElementById("transparentBg");
  transparentBg.checked = false;
  updateResult();
}

function downloadCard() {
  const cardCanvas = document.getElementById("cardImage");
  const name = document.getElementById("name").value;
  cardCanvas.toBlob((blob) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    if (!name) {
      link.download = "CustomCard.png";
    } else {
      link.download = `CustomCard-${name.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
    }
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }, "image/png");
}

// --- Export / Import helpers ---
async function exportCard() {
  try {
    const IMAGE_DIR = "images/";
    const safeNum = (v, d) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : d;
    };
    const val = (id, fallback = "") => document.getElementById(id)?.value ?? fallback;
    const chk = (id) => !!document.getElementById(id)?.checked;

    const data = {
      version: 1,
      meta: { app: "CMS Card Maker", exportedAt: new Date().toISOString() },
      card: {
        name: {
          text: val("name", ""),
          font: val("fontSelect", "BadaBoom"),
          color: val("nameColor", "#ffffff"),
          outlineColor: val("nameOutlineColor", "#000000"),
          zoom: safeNum(val("nameZoom", 100), 100),
          offsetY: safeNum(val("nameOffsetY", 0), 0),
          imageFile: imagesBase64.titleImage && imagesBase64.titleImage.startsWith("data:") ? IMAGE_DIR + "title.png" : null,
        },
        stats: {
          cost: (() => { const v = val("cost", ""); return v === "" ? null : safeNum(v, null); })(),
          power: (() => { const v = val("power", ""); return v === "" ? null : safeNum(v, null); })(),
        },
        description: { raw: val("description", "") },
        frame: { id: imagesBase64.frameImage || null },
        effect: { id: imagesBase64.effectImage || null },
        finish: { id: cardSettings.finish || null },
        images: {
          main: {
            file: imagesBase64.mainImage && imagesBase64.mainImage.startsWith("data:") ? IMAGE_DIR + "main.png" : null,
            zoom: safeNum(val("imageZoom", 0), 0),
            offsetX: safeNum(offsetX, 0),
            offsetY: safeNum(offsetY, 0),
          },
          frameBreak: {
            file: imagesBase64.frameBreakImage && imagesBase64.frameBreakImage.startsWith("data:") ? IMAGE_DIR + "framebreak.png" : null,
          },
        },
        background: { transparent: chk("transparentBg"), color: val("backgroundColor", "#10072b") },
      },
    };

    const zip = new JSZip();
    zip.file("card.json", JSON.stringify(data, null, 2));
    const addBase64 = (b64, path) => {
      if (!b64 || typeof b64 !== "string" || !b64.startsWith("data:")) return;
      const comma = b64.indexOf(",");
      if (comma === -1) return;
      const base64Part = b64.slice(comma + 1);
      try {
        const binary = atob(base64Part);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        zip.file(path, bytes);
      } catch (_) { /* ignore malformed */ }
    };
    addBase64(imagesBase64.titleImage, IMAGE_DIR + "title.png");
    addBase64(imagesBase64.mainImage, IMAGE_DIR + "main.png");
    addBase64(imagesBase64.frameBreakImage, IMAGE_DIR + "framebreak.png");

    const blob = await zip.generateAsync({ type: "blob" });
    const safeName = (data.card.name.text || "card").replace(/[^a-zA-Z0-9_-]+/g, "_");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = safeName + ".zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 800);
  } catch (e) {
    alert("Export failed: " + e.message);
    console.error(e);
  }
}

function importCard() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".zip";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const zip = await JSZip.loadAsync(file);
      const jsonEntry = zip.file("card.json");
      if (!jsonEntry) throw new Error("card.json missing");
      const jsonText = await jsonEntry.async("string");
      let data;
      try { data = JSON.parse(jsonText); } catch { throw new Error("card.json invalid JSON"); }
      if (typeof data.version !== "number") throw new Error("Invalid version");
      if (data.version > 1) console.warn("Newer file version", data.version);

      const card = data.card || {};
      const nameObj = card.name || {};
      const stats = card.stats || {};
      const desc = card.description || {};
      const images = card.images || {};
      const mainImg = images.main || {};
      const frameBreakImg = images.frameBreak || {};
      const background = card.background || {};

      // finish can be {id} or string
      let finishId = "";
      if (card.finish) {
        if (typeof card.finish === "string") finishId = card.finish; else if (card.finish.id) finishId = card.finish.id;
      }

      const setVal = (id, value) => { const el = document.getElementById(id); if (el) el.value = value; };
      setVal("name", nameObj.text || "");
      setVal("fontSelect", nameObj.font || "BadaBoom");
      setVal("nameColor", nameObj.color || "#ffffff");
      setVal("nameOutlineColor", nameObj.outlineColor || "#000000");
      setVal("nameZoom", nameObj.zoom ?? 100);
      setVal("nameOffsetY", nameObj.offsetY ?? 0);
      setVal("cost", stats.cost ?? "");
      setVal("power", stats.power ?? "");
      setVal("description", desc.raw || "");
      setVal("imageZoom", mainImg.zoom ?? 0);
      const bgChk = document.getElementById("transparentBg"); if (bgChk) bgChk.checked = !!background.transparent;
      setVal("backgroundColor", background.color || "#10072b");

      offsetX = typeof mainImg.offsetX === "number" ? mainImg.offsetX : 0;
      offsetY = typeof mainImg.offsetY === "number" ? mainImg.offsetY : 0;

      imagesBase64.frameImage = (card.frame && card.frame.id) || null;
      imagesBase64.effectImage = (card.effect && card.effect.id) || null;
      cardSettings.finish = finishId || null;

      imagesBase64.titleImage = null;
      imagesBase64.mainImage = null;
      imagesBase64.frameBreakImage = null;

      const loadImageFile = async (path, assign) => {
        if (!path) return;
        let entry = zip.file(path);
        if (!entry) { const simple = path.split('/').pop(); entry = zip.file(simple); }
        if (!entry) return;
        const blob = await entry.async("blob");
        const fr = new FileReader();
        await new Promise((res, rej) => { fr.onerror = () => rej(new Error("Failed reading " + path)); fr.onload = () => res(); fr.readAsDataURL(blob); });
        assign(fr.result);
      };

      await loadImageFile(nameObj.imageFile, (b64) => imagesBase64.titleImage = b64);
      await loadImageFile(mainImg.file, (b64) => imagesBase64.mainImage = b64);
      await loadImageFile(frameBreakImg.file, (b64) => imagesBase64.frameBreakImage = b64);

      updateResult && updateResult();
      renderCard && renderCard(true);
    } catch (err) {
      alert("Import failed: " + err.message);
      console.error(err);
    }
  };
  input.click();
}

let mouseOverCreditsButton = false;
let mouseOverCreditsPopup = false;

function showCreditsPopup(source) {
  if (source === 1) {
    mouseOverCreditsButton = true;
  } else {
    mouseOverCreditsPopup = true;
  }
  const creditsPopup = document.getElementById("creditsPopup");
  creditsPopup.style.visibility = "visible";
}

function hideCreditsPopup(source) {
  if (source === 1) {
    mouseOverCreditsButton = false;
  } else {
    mouseOverCreditsPopup = false;
  }
  if (mouseOverCreditsButton || mouseOverCreditsPopup) {
    return;
  }
  const creditsPopup = document.getElementById("creditsPopup");
  creditsPopup.style.visibility = "hidden";
}

// Add event listeners to the canvas for offsets
const cardCanvas = document.getElementById("cardImage");
cardCanvas.ondragstart = function () {
  return false;
};
var isDragging = false;
var downPosition = { x: 0, y: 0 };

// Mouse events
cardCanvas.addEventListener("mousedown", (e) => {
  isDragging = true;
  downPosition.x = e.clientX - offsetX;
  downPosition.y = e.clientY - offsetY;
});
cardCanvas.addEventListener("mousemove", (e) => {
  if (isDragging) {
    offsetX = e.clientX - downPosition.x;
    offsetY = e.clientY - downPosition.y;
    updateResult();
  }
});
cardCanvas.addEventListener("mouseup", () => {
  isDragging = false;
});
cardCanvas.addEventListener("mouseleave", () => {
  isDragging = false;
});

// Touch events for mobile
cardCanvas.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    const touch = e.touches[0];
    downPosition.x = touch.clientX - offsetX;
    downPosition.y = touch.clientY - offsetY;
  }
});
cardCanvas.addEventListener(
  "touchmove",
  (e) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      offsetX = touch.clientX - downPosition.x;
      offsetY = touch.clientY - downPosition.y;
      updateResult();
      e.preventDefault(); // Prevent scrolling while dragging
    }
  },
  { passive: false }
);
cardCanvas.addEventListener("touchend", () => {
  isDragging = false;
});
cardCanvas.addEventListener("touchcancel", () => {
  isDragging = false;
});

// Attach to the global window object
window.updateResult = updateResult;
window.mainImageChange = mainImageChange;
window.frameBreakImageChange = frameBreakImageChange;
window.titleImageChange = titleImageChange;
window.clearMainImage = clearMainImage;
window.clearFrameBreakImage = clearFrameBreakImage;
window.clearTitleImage = clearTitleImage;
window.selectFrame = selectFrame;
window.closeFrameSelectPopup = closeFrameSelectPopup;
window.selectEffect = selectEffect;
window.closeEffectSelectPopup = closeEffectSelectPopup;
window.selectFinish = selectFinish;
window.clearFinish = clearFinish;
window.closeFinishSelectPopup = closeFinishSelectPopup;
window.showTutorialPopup = showTutorialPopup;
window.closeTutorialPopup = closeTutorialPopup;
window.clearEffect = clearEffect;
window.clearBackground = clearBackground;
window.downloadCard = downloadCard;
window.showCreditsPopup = showCreditsPopup;
window.hideCreditsPopup = hideCreditsPopup;
window.exportCard = exportCard;
window.importCard = importCard;

export {
  updateResult,
  mainImageChange,
  frameBreakImageChange,
  titleImageChange,
  clearMainImage,
  clearFrameBreakImage,
  clearTitleImage,
  selectFrame,
  closeFrameSelectPopup,
  selectEffect,
  closeEffectSelectPopup,
  clearEffect,
  clearBackground,
  downloadCard,
  exportCard,
  importCard,
  selectFinish,
  clearFinish,
  closeFinishSelectPopup,
  showTutorialPopup,
  closeTutorialPopup,
  showCreditsPopup,
  hideCreditsPopup,
};

// Add frames to frameSelectPopup
const frameSelectDiv = document.getElementById("frameSelectDiv");
const frameDir = "../res/img/frames/";
const frameCategories = {
  basic: "Basic",
  cosmic: "Cosmic",
  neon: "Neon",
  metallic: "Metallic",
  matte: "Matte",
  special: "Special",
};
const frames = {
  basic: [
    "common",
    "uncommon",
    "rare",
    "epic",
    "legendary",
    "ultra",
    "infinite",
  ],
  cosmic: [
    "black",
    "blue",
    "green",
    "red",
    "pink",
    "yellow",
    "orange",
    "purple",
    "rainbow",
  ],
  neon: ["blue", "green", "red", "purple", "yellow", "white"],
  metallic: ["copper", "gold", "silver"],
  matte: ["black", "red"],
  special: ["tokyo2099", "chains", "champion"],
};

for (const category in frameCategories) {
  const categoryTitleDividerDiv = document.createElement("div");
  categoryTitleDividerDiv.style.flex = "1 1 auto";
  const categoryTitle = document.createElement("h2");
  categoryTitle.textContent = frameCategories[category];
  categoryTitleDividerDiv.appendChild(categoryTitle);
  const categoryDiv = document.createElement("div");
  categoryDiv.className = "frame-category";
  categoryTitleDividerDiv.appendChild(categoryDiv);
  frameSelectDiv.appendChild(categoryTitleDividerDiv);

  const categoryFrames = frames[category];
  for (const frame of categoryFrames) {
    const frameImg = document.createElement("img");
    frameImg.src = `${frameDir}${category}/${frame}.png`;
    frameImg.alt = `${category} ${frame}`;
    frameImg.className = "frame-image";
    frameImg.addEventListener("click", () => {
      imagesBase64.frameImage = `${frameDir}${category}/${frame}.png`;
      updateResult();
      closeFrameSelectPopup();
    });
    categoryDiv.appendChild(frameImg);
  }
}

// Add effects to effectSelectPopup
const effectSelectDiv = document.getElementById("effectSelectDiv");
const effectDir = "../res/img/effects/";
const effectCategories = {
  krackle: "Krackle",
  tone: "Tone",
  glimmer: "Glimmer",
  sparkle: "Sparkle",
  special: "Special",
};
const effects = {
  krackle: [
    "black",
    "blue",
    "gold",
    "green",
    "purple",
    "rainbow",
    "red",
    "white",
  ],
  tone: ["black", "blue", "gold", "green", "purple", "rainbow", "red", "white"],
  glimmer: [
    "black",
    "blue",
    "gold",
    "green",
    "purple",
    "rainbow",
    "red",
    "white",
  ],
  sparkle: [
    "black",
    "blue",
    "gold",
    "green",
    "purple",
    "rainbow",
    "red",
    "white",
  ],
  special: ["neontrails"],
};

for (const category in effectCategories) {
  const categoryTitleDividerDiv = document.createElement("div");
  categoryTitleDividerDiv.style.flex = "1 1 auto";
  const categoryTitle = document.createElement("h2");
  categoryTitle.textContent = effectCategories[category];
  categoryTitleDividerDiv.appendChild(categoryTitle);
  const categoryDiv = document.createElement("div");
  categoryDiv.className = "effect-category";
  categoryTitleDividerDiv.appendChild(categoryDiv);
  effectSelectDiv.appendChild(categoryTitleDividerDiv);

  const categoryEffects = effects[category];
  for (const effect of categoryEffects) {
    const effectImg = document.createElement("img");
    effectImg.src = `${effectDir}${category}/${effect}.png`;
    effectImg.alt = `${category} ${effect}`;
    effectImg.className = "frame-image";
    effectImg.addEventListener("click", () => {
      imagesBase64.effectImage = `${effectDir}${category}/${effect}.png`;
      updateResult();
      closeEffectSelectPopup();
    });
    categoryDiv.appendChild(effectImg);
  }
}

// Add finishes to finishSelectPopup
const finishSelectDiv = document.getElementById("finishSelectDiv");
const finishes = {
  inked: "Inked",
};
const finshesButtonImage = {
  inked:
    "https://game-assets.snap.fan/ConvertedRenders/SurfaceEffects/Ink.webp",
};

for (const finish in finishes) {
  const finishImg = document.createElement("img");
  finishImg.src = finshesButtonImage[finish];
  finishImg.alt = finishes[finish];
  finishImg.className = "frame-image";
  const finishSelectButton = document.createElement("div");
  finishSelectButton.addEventListener("click", () => {
    cardSettings.finish = finish;
    updateResult();
    closeFinishSelectPopup();
  });
  const finishSelectName = document.createElement("h3");
  finishSelectName.textContent = finishes[finish];
  finishSelectName.style.margin = "0";
  finishSelectButton.appendChild(finishImg);
  finishSelectButton.appendChild(finishSelectName);
  finishSelectButton.style.display = "flex";
  finishSelectButton.style.alignItems = "center";
  finishSelectButton.style.flexDirection = "column";
  finishSelectButton.style.cursor = "pointer";
  finishSelectButton.style.margin = "5px";
  finishSelectButton.style.padding = "5px";
  finishSelectButton.style.border = "1px solid #ccc";
  finishSelectButton.style.borderRadius = "5px";
  finishSelectButton.style.width = "125px";
  finishSelectButton.style.textAlign = "center";
  finishSelectDiv.appendChild(finishSelectButton);
}

// Set Placeholder image for canvas while loading
const ctx = cardCanvas.getContext("2d");
const placeholderImage = new Image();
placeholderImage.src = "../res/img/default_cards/default.png";
placeholderImage.onload = () => {
  ctx.drawImage(placeholderImage, 0, 0, cardCanvas.width, cardCanvas.height);
};

// Request image update every 2000ms
setInterval(() => {
  if (!isRendering) {
    renderCard(true);
  }
}, 2000);
