// --- Static image preloading for performance ---
const staticImagePaths = [
  "../res/img/default_cards/art_mask.png",
  "../res/img/default_cards/art_mask_spell.png",
  "../res/img/default_cards/default.png",
  "../res/img/default_cards/hulk.png",
  "../res/img/frames/cost.png",
  "../res/img/frames/power.png",
  "../res/img/finishes/gold.png",
  "../res/img/finishes/foil.png",
  "../res/img/finishes/prism.png",
  "../res/img/finishes/fire.png"
];
const numbersDir = "../res/img/numbers/";
const numbers = ["-", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const numberImagePaths = [];
numbers.forEach((n) =>
  numberImagePaths.push(numbersDir + "cost/" + n + ".png")
);
numbers.forEach((n) =>
  numberImagePaths.push(numbersDir + "power/" + n + ".png")
);

const framesDir = "../res/img/frames/";
const frameTypes = {
  basic: [
    "common",
    "uncommon",
    "rare",
    "epic",
    "legendary",
    "ultra",
    "infinite",
    "common_spell",
    "uncommon_spell",
    "rare_spell",
    "epic_spell",
    "legendary_spell",
    "ultra_spell",
    "infinite_spell",
  ],
  cosmic: [
    "black",
    "blue",
    "green",
    "orange",
    "pink",
    "red",
    "yellow",
    "purple",
    "rainbow",
  ],
  distressed: [
    "red",
    "blue",
    "green",
    "purple",
    "yellow",
    "black",
  ],
  metallic: [
    "copper",
    "gold",
    "silver",
    "gold_plated",
    "silver_plated",
  ],
  neon: ["blue", "green", "purple", "red", "white", "yellow"],
  matte: ["black", "red", "black_spell", "red_spell"],
  special: ["tokyo2099", "chains", "golden_chains", "champion", "champion_spell", "green_runes", "red_runes"],
  fire: [
    "black",
    "blue",
    "green",
    "orange",
    "purple",
    "red",
    "yellow",
    "white",
    "rainbow",
  ]
};
const frameImagePaths = [];
Object.entries(frameTypes).forEach(([category, frames]) => {
  frames.forEach((frame) => {
    frameImagePaths.push(`${framesDir}${category}/${frame}.png`);
  });
});

const effectDir = "../res/img/effects/";
const effectTypes = {
  krackle: [
    "black",
    "blue",
    "gold",
    "green",
    "purple",
    "rainbow",
    "red",
    "white",
    "poison"
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
const effectImagePaths = [];
Object.entries(effectTypes).forEach(([category, effects]) => {
  effects.forEach((effect) => {
    effectImagePaths.push(`${effectDir}${category}/${effect}.png`);
  });
});

const allPaths = staticImagePaths
  .concat(numberImagePaths)
  .concat(frameImagePaths)
  .concat(effectImagePaths);

const preloadImageCache = {};

function preloadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

function startPreloadingImages() {
  allPaths.forEach((src) => {
    if (!preloadImageCache[src]) {
      // Status: loading
      const promise = preloadImg(src)
        .then((img) => {
          preloadImageCache[src] = { status: "loaded", img };
          return img;
        })
        .catch(() => {
          preloadImageCache[src] = { status: "error", img: null };
        });
      preloadImageCache[src] = { status: "loading", promise };
    }
  });
}

function getPreloadedImage(src) {
  const entry = preloadImageCache[src];
  if (!entry) {
    const promise = preloadImg(src)
      .then((img) => {
        preloadImageCache[src] = { status: "loaded", img };
        return img;
      })
      .catch(() => {
        preloadImageCache[src] = { status: "error", img: null };
      });
    preloadImageCache[src] = { status: "loading", promise };
    return promise;
  }
  if (entry.status === "loaded") {
    return Promise.resolve(entry.img);
  }
  if (entry.status === "loading") {
    return entry.promise;
  }
  const promise = preloadImg(src)
    .then((img) => {
      preloadImageCache[src] = { status: "loaded", img };
      return img;
    })
    .catch(() => {
      preloadImageCache[src] = { status: "error", img: null };
    });
  preloadImageCache[src] = { status: "loading", promise };
  return promise;
}

// Start preloading images
startPreloadingImages();

// --- Card Generation Function ---
async function generatecard(
  name,
  colorName = "#ffffff",
  nameOutlineColor = "#000000",
  fontSelect = "BadaBoom",
  cost,
  power,
  showCostPower = true,
  description,
  size = 1024,
  imagesBase64,
  zoom = 1,
  nameZoom = 1,
  backgroundColor = "#10072b",
  offset = [0, 0, 0],
  finish = "none"
) {
  imagesBase64 = checkIfSpell(imagesBase64, power);
  // Art_Mask
  let artMask;
  if (imagesBase64.frameImage && imagesBase64.frameImage.includes("spell")) {
    artMask = await getPreloadedImage(
      "../res/img/default_cards/art_mask_spell.png"
    );
  } else {
    artMask = await getPreloadedImage("../res/img/default_cards/art_mask.png");
  }
  // Create Canvas
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(artMask, 0, 0, size, size);
  // Background
  let backgroundImg;
  if (!imagesBase64.mainImage) {
    imagesBase64.mainImage = "../res/img/default_cards/hulk.png";
  }
  backgroundImg = await getImg(imagesBase64.mainImage, finish, "background");
  ctx.globalCompositeOperation = "source-in";
  let w = backgroundImg.width;
  let h = backgroundImg.height;
  let aspectRatio = w / h;
  w = 596;
  h = w / aspectRatio;
  if (h < 842) {
    h = 842;
    w = h * aspectRatio;
  }
  let scale = size / 1024;
  w *= scale * zoom;
  h *= scale * zoom;
  let x = ((1024 - w) / 2) * scale + offset[0] * scale;
  let y = ((1024 - h) / 2) * scale + 3 * scale + offset[1] * scale;
  ctx.drawImage(backgroundImg, x, y, w, h);
  // Apply Finish
  if (finish === "foil") {
    turnContextBlackAndWhite(ctx);
    ctx.globalCompositeOperation = "hard-light";
    const foilImageMask = await getPreloadedImage("../res/img/finishes/foil.png");
    ctx.drawImage(foilImageMask, 0, 0, size, size);
  } else if (finish === "gold") {
    turnContextBlackAndWhite(ctx);
    ctx.globalCompositeOperation = "multiply";
    const goldImageMask = await getPreloadedImage("../res/img/finishes/gold.png");
    ctx.drawImage(goldImageMask, 0, 0, size, size);
  } else if (finish === "prism") {
    ctx.globalCompositeOperation = "source-over";
    const prismImageMask = await getPreloadedImage("../res/img/finishes/prism.png");
    ctx.drawImage(prismImageMask, 0, 0, size, size);
  } else if (finish === "fire") {
    ctx.globalCompositeOperation = "source-over";
    const fireImageMask = await getPreloadedImage("../res/img/finishes/fire.png");
    ctx.drawImage(fireImageMask, 0, 0, size, size);
  }
  // Foreground
  if (imagesBase64.foregroundImage) {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(artMask, 0, 0, size, size);
    tempCtx.globalCompositeOperation = "source-in";
    let foregroundImg = await getImg(imagesBase64.foregroundImage, finish, "foreground");
    tempCtx.drawImage(foregroundImg, x, y, w, h);
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(tempCanvas, 0, 0, size, size);
  }
  // Frame
  ctx.globalCompositeOperation = "source-over";
  let frameImg;
  if (imagesBase64.frameImage) {
    frameImg = await getPreloadedImage(imagesBase64.frameImage);
  } else {
    frameImg = await getPreloadedImage("../res/img/frames/basic/common.png");
  }
  ctx.drawImage(frameImg, 0, 0, size, size);
  // Cost and Power
  if (showCostPower) {
    const costImg = await getPreloadedImage("../res/img/frames/cost.png");
    ctx.drawImage(costImg, 0, 0, size, size);
    if (power != null && power !== "") {
      const powerImg = await getPreloadedImage("../res/img/frames/power.png");
      ctx.drawImage(powerImg, 0, 0, size, size);
    }
    const numbersDir = "../res/img/numbers/";
    const numbersWidth = {
      "-": 36,
      0: 65,
      1: 43,
      2: 67,
      3: 65,
      4: 61,
      5: 64,
      6: 65,
      7: 61,
      8: 65,
      9: 65,
    };
    const multiply = 1.2;
    // Cost number
    if (cost == null || cost === "") {
      cost = 0;
    }
    let costNumber = cost.toString().split("");
    let costWidth = numbersWidth[costNumber[0]] * multiply * scale;
    for (let i = 1; i < costNumber.length; i++) {
      costWidth += (numbersWidth[costNumber[i]] - 14) * multiply * scale;
    }
    costWidth *= multiply;
    let costX = 249 * scale - costWidth / 2;
    let costY = 65 * scale;
    for (let i = 0; i < costNumber.length; i++) {
      let numberImg = await getPreloadedImage(
        numbersDir + "cost/" + costNumber[i] + ".png"
      );
      ctx.drawImage(
        numberImg,
        costX,
        costY,
        numbersWidth[costNumber[i]] * multiply * scale,
        79 * multiply * scale
      );
      costX += (numbersWidth[costNumber[i]] - 14) * multiply * scale;
    }
    // Power number
    if (power != null && power !== "") {
      let powerNumber = power.toString().split("");
      let powerWidth = numbersWidth[powerNumber[0]] * multiply * scale;
      powerWidth *= multiply;
      for (let i = 1; i < powerNumber.length; i++) {
        powerWidth += (numbersWidth[powerNumber[i]] - 14) * multiply * scale;
      }
      let powerX = 796 * scale - powerWidth / 2;
      let powerY = 65 * scale;
      for (let i = 0; i < powerNumber.length; i++) {
        let numberImg = await getPreloadedImage(
          numbersDir + "power/" + powerNumber[i] + ".png"
        );
        ctx.drawImage(
          numberImg,
          powerX,
          powerY,
          numbersWidth[powerNumber[i]] * multiply * scale,
          79 * multiply * scale
        );
        powerX += (numbersWidth[powerNumber[i]] - 14) * multiply * scale;
      }
    }
  }
  // Frame Break
  if (imagesBase64.frameBreakImage) {
    let frameBreakImg = await getImg(imagesBase64.frameBreakImage, finish, "frameBreak");
    ctx.drawImage(frameBreakImg, x, y, w, h);
  }
  // Title
  if (imagesBase64.titleImage) {
    let titleImg = await getImg(imagesBase64.titleImage, "none", "title");
    let titleWidth = titleImg.width;
    let titleHeight = titleImg.height;
    let titleAspectRatio = titleWidth / titleHeight;
    titleWidth = 500 * scale;
    titleHeight = titleWidth / titleAspectRatio;
    if (titleHeight < 300 * scale) {
      titleHeight = 300 * scale;
      titleWidth = titleHeight * titleAspectRatio;
    }
    titleWidth *= nameZoom;
    titleHeight *= nameZoom;
    let titleX = ((1024 - titleWidth) / 2) * scale;
    let titleY = 850 * scale - titleHeight / 2;
    titleY += offset[2] * scale;
    ctx.drawImage(titleImg, titleX, titleY, titleWidth, titleHeight);
  } else {
    const fontSize = Math.round(300 * scale * nameZoom);
    name = name.toUpperCase().split("\n");
    ctx.font = `${fontSize}px '${fontSelect}'`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.strokeStyle = nameOutlineColor;
    ctx.fillStyle = colorName;
    ctx.lineWidth = 15 * scale;
    for (let i = 0; i < name.length; i++) {
      let titleHeight = 300 * scale * nameZoom * name.length;
      let titleY = 850 * scale + offset[2] * scale;
      titleY -= titleHeight / 2;
      titleY += i * fontSize * 0.9;
      ctx.strokeText(name[i], 512 * scale, titleY);
      ctx.fillText(name[i], 512 * scale, titleY);
    }
  }
  // Effect
  ctx.globalCompositeOperation = "destination-over";
  if (imagesBase64.effectImage) {
    let effectImg = await getPreloadedImage(imagesBase64.effectImage);
    ctx.drawImage(effectImg, 0, 0, size, size);
  }

  // Description and Background Color
  function parseDescriptionSegments(desc) {
    const segments = [];
    // Kombinierte Regex für <b>...</b> und **...**
    let regex = /<b>([\s\S]*?)<\/b>|\*\*([\s\S]*?)\*\*/gi;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(desc)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          text: desc.substring(lastIndex, match.index),
          bold: false,
        });
      }
      // match[1] ist für <b>...</b>, match[2] für **...**
      const boldText = match[1] !== undefined ? match[1] : match[2];
      segments.push({ text: boldText, bold: true });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < desc.length) {
      segments.push({ text: desc.substring(lastIndex), bold: false });
    }
    return segments;
  }
  const completeCanvas = document.createElement("canvas");
  completeCanvas.width = size;
  completeCanvas.height = 1318 * scale;
  const completeCtx = completeCanvas.getContext("2d");
  if (backgroundColor != "transparent") {
    completeCtx.fillStyle = backgroundColor;
    completeCtx.fillRect(0, 0, size, 1318 * scale);
  }
  completeCtx.drawImage(canvas, 0, 0, size, size);
  completeCtx.globalCompositeOperation = "source-over";
  completeCtx.fillStyle = "#ffffff";
  completeCtx.strokeStyle = "#000000";
  completeCtx.textAlign = "center";
  completeCtx.textBaseline = "top";
  completeCtx.lineWidth = 1;
  const normalFont = `${Math.round(
    52 * scale
  )}px 'HelveticaNeueMediumCondensed'`;
  const boldFont = `${Math.round(52 * scale)}px 'HelveticaNeueHeavyCondensed'`;
  const allSegments = parseDescriptionSegments(description);
  let lines = [[]];
  allSegments.forEach((seg) => {
    const parts = seg.text.split("\n");
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) lines.push([]);
      if (parts[i].length > 0)
        lines[lines.length - 1].push({ text: parts[i], bold: seg.bold });
    }
  });
  for (let i = 0; i < lines.length; i++) {
    const y = (1024 + 10) * scale + i * 55 * scale;
    const segments = lines[i];
    let totalWidth = 0;
    segments.forEach((seg) => {
      completeCtx.font = seg.bold ? boldFont : normalFont;
      totalWidth += completeCtx.measureText(seg.text).width;
    });
    let x = 512 * scale - totalWidth / 2;
    segments.forEach((seg) => {
      completeCtx.font = seg.bold ? boldFont : normalFont;
      completeCtx.strokeText(
        seg.text,
        x + completeCtx.measureText(seg.text).width / 2,
        y
      );
      completeCtx.fillText(
        seg.text,
        x + completeCtx.measureText(seg.text).width / 2,
        y
      );
      x += completeCtx.measureText(seg.text).width;
    });
  }

  return completeCanvas;
}

var imgCache = {};

async function getImg(src, finish, layer) {
  let img;
  if (imgCache[src] && imgCache[src][finish]) {
    img = imgCache[src][finish];
  } else {
    img = await loadImg(src);
    img = applyFinish(img, finish, layer);
    imgCache[src] = imgCache[src] || {};
    imgCache[src][finish] = img;
  }
  return img;
}

function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

function checkIfSpell(imagesBase64, power) {
  if (!imagesBase64.frameImage)
    imagesBase64.frameImage = "../res/img/frames/basic/common.png";
  // Treat only null/undefined or empty-string as "no power". Use strict check so 0 is preserved.
  if (power == null || power === "") {
    const frameName = imagesBase64.frameImage;
    if (!frameName.includes("_spell")) {
      const frameSpellName = frameName.replace(/\.png$/, "_spell.png");
      if (preloadImageCache[frameSpellName]) {
        imagesBase64.frameImage = frameSpellName;
      }
    }
  } else {
    const frameName = imagesBase64.frameImage;
    const frameNormalName = frameName.replace(/_spell\.png$/, ".png");
    imagesBase64.frameImage = frameNormalName;
  }
  return imagesBase64;
}

function applyFinish(img, finish, layer) {
  if (finish === "none") {
    return img;
  }
  if (layer === "title") {
    return img; // No finish for title layer
  }

  if (finish === "inked") {
    // Black and white effect whith high contrast
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Calculate luminance and turn into value between 0-1
      let avg = (data[i] * 0.2 + data[i + 1] * 0.7 + data[i + 2] * 0.1) / 255;
      let sbIn = avg;
      // Increase contrast
      const n1 = 1.2;
      const n2 = 1.2;
      avg = Math.pow(avg, n1) / (Math.pow(avg, n1) + Math.pow(1 - avg, n2));
      /**  Shiny Blacks
      const m1 = 1.2;
      const m2 = 0.02;
      if (sbIn < m2 * 2) {
        sbIn = sbIn / m2 - 1;
        sbIn = Math.pow(sbIn, 4) - 2 * Math.pow(sbIn, 2) + 1;
        sbIn /= m1;
        avg += sbIn;
      }
      */
      // Back to value between 0-255
      avg = Math.round(avg * 255);
      // Quantization
      const quantizationLevels = 16;
      avg = Math.floor(avg / quantizationLevels) * quantizationLevels;
      data[i] = avg; // Red
      data[i + 1] = avg; // Green
      data[i + 2] = avg; // Blue
    }
    ctx.putImageData(imageData, 0, 0);
    img = canvas;
    return img;
  }
  return img;
}

function turnContextBlackAndWhite(ctx) {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg;     // Red
    data[i + 1] = avg; // Green
    data[i + 2] = avg; // Blue
  }

  ctx.putImageData(imageData, 0, 0);
  return ctx;
}

export { generatecard };
