async function generatecard(name, colorName, cost, power, description, size=1024, imagesBase64, zoom=1, nameZoom=1, backgroundColor){
    // Create Canvas
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    // Art_Mask
    const artMask = await getImg("../res/img/default_cards/art_mask.png");
    ctx.drawImage(artMask, 0, 0, size, size);
    // Background
    let backgroundImg = await getImg("../res/img/default_cards/ghost_rider.png");
    if (imagesBase64.mainImage) {
        const mainImg = new Image();
        mainImg.src = imagesBase64.mainImage;
        backgroundImg = await new Promise((resolve, reject) => {
            mainImg.onload = () => resolve(mainImg);
            mainImg.onerror = reject;
        });
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
    let x = (1024 - w) / 2 * scale;
    let y = (1024 - h) / 2 * scale + 3 * scale;
    ctx.drawImage(backgroundImg, x, y, w, h);
    // Frame
    let frameImg = await getImg("../res/img/frames/basic/common.png");
    if (imagesBase64.frameImage) {
        frameImg = new Image();
        frameImg.src = imagesBase64.frameImage;
        frameImg = await new Promise((resolve, reject) => {
            frameImg.onload = () => resolve(frameImg);
            frameImg.onerror = reject;
        });
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(frameImg, 0, 0, size, size);
    // Frame Break
    if (imagesBase64.frameBreakImage) {
        let frameBreakImg = new Image();
        frameBreakImg.src = imagesBase64.frameBreakImage;
        frameBreakImg = await new Promise((resolve, reject) => {
            frameBreakImg.onload = () => resolve(frameBreakImg);
            frameBreakImg.onerror = reject;
        });
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(frameBreakImg, x, y, w, h);
    }
    // Cost and Power
    ctx.globalCompositeOperation = "source-over";
    const costImg = await getImg("../res/img/frames/cost.png");
    ctx.drawImage(costImg, 0, 0, size, size);
    const powerImg = await getImg("../res/img/frames/power.png");
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
    let costX = 240 * scale - costWidth / 2; 
    let costY = 65 * scale;
    for (let i = 0; i < costNumber.length; i++) {
        let numberImg = await getImg(numbersDir + "cost/" + costNumber[i] + ".png");
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
        let powerX = 787 * scale - powerWidth / 2;
        let powerY = 65 * scale;
        for (let i = 0; i < powerNumber.length; i++) {
            let numberImg = await getImg(numbersDir + "power/" + powerNumber[i] + ".png");
            ctx.drawImage(numberImg, powerX, powerY, numbersWidth[powerNumber[i]] * scale, 79 * multiply * scale);
            powerX += numbersWidth[powerNumber[i]] * scale;
        }
    }
    // Title
    if (imagesBase64.titleImage) {
        let titleImg = new Image();
        titleImg.src = imagesBase64.titleImage;
        titleImg = await new Promise((resolve, reject) => {
            titleImg.onload = () => resolve(titleImg);
            titleImg.onerror = reject;
        });
        ctx.globalCompositeOperation = "source-over";
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
        ctx.globalCompositeOperation = "source-over";
        ctx.font = `${fontSize}px 'BadaBoom'`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        for (let i = 0; i < name.length; i++) {
            let titleHeight = 300 * scale * nameZoom * name.length;
            let titleY = 850 * scale;
            titleY -= titleHeight / 2;
            titleY += (i * fontSize * 0.9);
            ctx.fillStyle = colorName;
            ctx.fillText(name[i], 512 * scale, titleY);
            ctx.lineWidth = 10 * scale * nameZoom;
            ctx.strokeStyle = "#000000";
            ctx.strokeText(name[i], 512 * scale, titleY);
        }
    }
    // Effect
    ctx.globalCompositeOperation = "destination-over";
    if (imagesBase64.effectImage) {
        let effectImg = new Image();
        effectImg.src = imagesBase64.effectImage;
        effectImg = await new Promise((resolve, reject) => {
            effectImg.onload = () => resolve(effectImg);
            effectImg.onerror = reject;
        });
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

function getImg (src) {
    var img = new Image();
    img.src = src;
    return new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}

export {generatecard};