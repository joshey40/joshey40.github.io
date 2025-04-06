async function generatecard(name, colorName, cost, power, description, size=1024, imagesBase64) {
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
    var w = backgroundImg.width;
    var h = backgroundImg.height;
    var aspectRatio = w / h;
    w = 596;
    h = w / aspectRatio;
    if (h < 842) {
        h = 842;
        w = h * aspectRatio;
    }
    var scale = size / 1024;
    w *= scale;
    h *= scale;
    var x = 214 * scale;
    var y = 88 * scale;
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
    const numbersDir = "../res/img/numbers/";
    const numbersWidth = {'-':36, 0:65, 1:43, 2:67, 3:65, 4:61, 5:64, 6:65, 7:61, 8:65, 9:65};
    // Cost number
    if (cost == null || cost == "") {
        cost = 0;
    }
    let costNumber = cost.toString().split("");
    let costWidth = 0;
    for (let i = 0; i < costNumber.length; i++) {
        costWidth += numbersWidth[costNumber[i]] * scale;
    }
    let costX = 240 * scale - costWidth / 2; 
    let costY = 80 * scale;
    for (let i = 0; i < costNumber.length; i++) {
        let numberImg = await getImg(numbersDir + "cost/" + costNumber[i] + ".png");
        ctx.drawImage(numberImg, costX, costY, numbersWidth[costNumber[i]] * scale, 79 * scale);
        costX += numbersWidth[costNumber[i]] * scale;
    }
    // Power number
    if (power != null && power != "") {
        let powerNumber = power.toString().split("");
        let powerWidth = 0;
        for (let i = 0; i < powerNumber.length; i++) {
            powerWidth += numbersWidth[powerNumber[i]] * scale;
        }
        let powerX = 787 * scale - powerWidth / 2;
        let powerY = 80 * scale;
        for (let i = 0; i < powerNumber.length; i++) {
            let numberImg = await getImg(numbersDir + "power/" + powerNumber[i] + ".png");
            ctx.drawImage(numberImg, powerX, powerY, numbersWidth[powerNumber[i]] * scale, 79 * scale);
            powerX += numbersWidth[powerNumber[i]] * scale;
        }
    }

    
    // Title

    return canvas;
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