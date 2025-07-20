// --- Static image preloading for performance ---
const staticImagePaths = [
    "../res/img/default_cards/art_mask.png",
    "../res/img/default_cards/default.png",
    "../res/img/default_cards/hulk.png",
    "../res/img/frames/cost.png",
    "../res/img/frames/power.png",
    "../res/img/finishes/goldFinish.png",
    "../res/img/finishes/foilFinish.png",
];
const numbersDir = "../res/img/numbers/";
const numbers = ['-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const numberImagePaths = [];
numbers.forEach(n => numberImagePaths.push(numbersDir + "cost/" + n + ".png"));
numbers.forEach(n => numberImagePaths.push(numbersDir + "power/" + n + ".png"));

const framesDir = "../res/img/frames/";
const frameTypes = {
    basic: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'ultra', 'infinite'],
    cosmic: ['black', 'blue', 'green', 'orange', 'pink', 'red', 'yellow'],
    metallic: ['copper', 'gold', 'silver'],
    neon: ['blue', 'green', 'purple', 'red', 'white', 'yellow']
};
const frameImagePaths = [];
Object.entries(frameTypes).forEach(([category, frames]) => {
    frames.forEach(frame => {
        frameImagePaths.push(`${framesDir}${category}/${frame}.png`);
    });
});

const allPaths = staticImagePaths.concat(numberImagePaths).concat(frameImagePaths);

const preloadImageCache = {};
function preloadImg(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}

async function preloadStaticImages() {
    await Promise.all(allPaths.map(async (src) => {
        preloadImageCache[src] = await preloadImg(src);
    }));
}

let staticImagesLoaded = false;
async function ensureStaticImagesLoaded() {
    if (!staticImagesLoaded) {
        await preloadStaticImages();
        staticImagesLoaded = true;
    }
}

// --- Card Generation Function ---
async function generatecard(name, colorName = "#ffffff", nameOutlineColor = "#000000", fontSelect = "BadaBoom", cost, power, description, size=1024, imagesBase64, zoom=1, nameZoom=1, backgroundColor = "#10072b", offset=[0, 0], finish='none') {
    imagesBase64 = await applyFinish(finish, imagesBase64);
    await ensureStaticImagesLoaded();
    // Create Canvas
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    // Art_Mask
    const artMask = preloadImageCache["../res/img/default_cards/art_mask.png"];
    ctx.drawImage(artMask, 0, 0, size, size);
    // Background
    let backgroundImg;
    if (imagesBase64.mainImage) {
        backgroundImg = await getImg(imagesBase64.mainImage);
    } else {
        backgroundImg = preloadImageCache["../res/img/default_cards/hulk.png"];
    }
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
    let x = (1024 - w) / 2 * scale + offset[0];
    let y = (1024 - h) / 2 * scale + 3 * scale + offset[1];
    ctx.drawImage(backgroundImg, x, y, w, h);
    // Frame
    let frameImg;
    if (imagesBase64.frameImage) {
        frameImg = await getImg(imagesBase64.frameImage);
    } else {
        frameImg = preloadImageCache["../res/img/frames/basic/common.png"];
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(frameImg, 0, 0, size, size);
    // Frame Break
    if (imagesBase64.frameBreakImage) {
        let frameBreakImg = await getImg(imagesBase64.frameBreakImage);
        ctx.drawImage(frameBreakImg, x, y, w, h);
    }
    // Cost and Power
    const costImg = preloadImageCache["../res/img/frames/cost.png"];
    ctx.drawImage(costImg, 0, 0, size, size);
    const powerImg = preloadImageCache["../res/img/frames/power.png"];
    ctx.drawImage(powerImg, 0, 0, size, size);
    const numbersDir = "../res/img/numbers/";
    const numbersWidth = {'-':36, 0:65, 1:43, 2:67, 3:65, 4:61, 5:64, 6:65, 7:61, 8:65, 9:65};
    const multiply = 1.2;
    // Cost number
    if (cost == null || cost == "") {
        cost = 0;
    }
    let costNumber = cost.toString().split("");
    let costWidth = 0;
    for (let i = 0; i < costNumber.length; i++) {
        costWidth += numbersWidth[costNumber[i]] * scale;
    }
    costWidth *= multiply;
    let costX = 246 * scale - costWidth / 2; 
    let costY = 65 * scale;
    for (let i = 0; i < costNumber.length; i++) {
        let numberImg = preloadImageCache[numbersDir + "cost/" + costNumber[i] + ".png"];
        ctx.drawImage(numberImg, costX, costY, numbersWidth[costNumber[i]] * scale, 79 * multiply * scale);
        costX += numbersWidth[costNumber[i]] * scale;
    }
    // Power number
    if (power != null && power != "") {
        let powerNumber = power.toString().split("");
        let powerWidth = 0;
        powerWidth *= multiply;
        for (let i = 0; i < powerNumber.length; i++) {
            powerWidth += numbersWidth[powerNumber[i]] * scale;
        }
        let powerX = 792 * scale - powerWidth / 2;
        let powerY = 65 * scale;
        for (let i = 0; i < powerNumber.length; i++) {
            let numberImg = preloadImageCache[numbersDir + "power/" + powerNumber[i] + ".png"];
            ctx.drawImage(numberImg, powerX, powerY, numbersWidth[powerNumber[i]] * scale, 79 * multiply * scale);
            powerX += numbersWidth[powerNumber[i]] * scale;
        }
    }
    // Title
    if (imagesBase64.titleImage) {
        let titleImg = await getImg(imagesBase64.titleImage);
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
        let titleX = (1024 - titleWidth) / 2 * scale;
        let titleY = 850 * scale - titleHeight / 2;
        ctx.drawImage(titleImg, titleX, titleY, titleWidth, titleHeight);
    } else {
        const fontSize = Math.round(300 * scale * nameZoom);
        name = name.toUpperCase().split('\n');
        ctx.font = `${fontSize}px '${fontSelect}'`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.strokeStyle = nameOutlineColor;
        ctx.fillStyle = colorName;
        ctx.lineWidth = 15 * scale * nameZoom;
        for (let i = 0; i < name.length; i++) {
            let titleHeight = 300 * scale * nameZoom * name.length;
            let titleY = 850 * scale;
            titleY -= titleHeight / 2;
            titleY += (i * fontSize * 0.9);
            ctx.strokeText(name[i], 512 * scale, titleY);
            ctx.fillText(name[i], 512 * scale, titleY);
        }
    }
    // Effect
    ctx.globalCompositeOperation = "destination-over";
    if (imagesBase64.effectImage) {
        let effectImg =  await getImg(imagesBase64.effectImage);
        ctx.drawImage(effectImg, 0, 0, size, size);
    }

    // Description and Background Color
    const completeCanvas = document.createElement("canvas");
    completeCanvas.width = size;
    completeCanvas.height = 1318 * scale;
    const completeCtx = completeCanvas.getContext("2d");
    if (backgroundColor != 'transparent') {
        completeCtx.fillStyle = backgroundColor;
        completeCtx.fillRect(0, 0, size, 1318 * scale);
    }
    completeCtx.drawImage(canvas, 0, 0, size, size);
    completeCtx.globalCompositeOperation = "source-over";
    completeCtx.font = `${Math.round(50 * scale)}px 'HelveticaNeueBold'`;
    completeCtx.fillStyle = "#ffffff";
    completeCtx.strokeStyle = "#000000";
    completeCtx.textAlign = "center";
    completeCtx.textBaseline = "top";
    completeCtx.lineWidth = 1;
    const descriptionLines = description.split('\n');
    for (let i = 0; i < descriptionLines.length; i++) {
        completeCtx.strokeText(descriptionLines[i], 512 * scale, 1024 * scale + (i * 55 * scale));
        completeCtx.fillText(descriptionLines[i], 512 * scale, 1024 * scale + (i * 55 * scale));
    }

    return completeCanvas;
}

var imgCache = {};

async function applyFinish(finish, imagesBase64) {
    if (!finish || finish === 'none') {
        return imagesBase64;
    }
    switch (finish) {
        case 'gold':
            const goldImage = preloadImageCache[`../res/img/finishes/goldFinish.png`];
            if (!goldImage) {
                console.warn(`Finish image for 'gold' not found.`);
                return imagesBase64;
            }
            imagesBase64.backgroundImage = goldImage.toDataURL();
            break;
        case 'foil':
            const foilImage = preloadImageCache[`../res/img/finishes/foilFinish.png`];
            if (!foilImage) {
                console.warn(`Finish image for 'foil' not found.`);
                return imagesBase64;
            }
            imagesBase64.backgroundImage = foilImage.toDataURL();
            break;
        }
    }

async function getImg (src) {
    if (imgCache[src]) {
        return imgCache[src];
    } else {
        const img = await loadImg(src);
        imgCache[src] = img;
        return img;
    }
}

function loadImg (src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}

export {generatecard};