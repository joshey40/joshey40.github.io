async function generatecard(name, colorName, cost, power, description) {
    // Create Canvas
    var canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext("2d");
    // Art_Mask
    var artMask = await getImg("res/images/default_cards/art_mask.png");
    ctx.drawImage(artMask, 0, 0, size, size);
    // Background
    var backgroundImg = await getImg("res/images/default_cards/ghost_rider.png");
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
    x = 214 * scale;
    y = 88 * scale;
    ctx.drawImage(backgroundImg, x, y, w, h);
    // 

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