async function generatecard(name, colorName, cost, power, description, size=1024) {
    // Create Canvas
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    // Art_Mask
    const artMask = await getImg("../res/img/default_cards/art_mask.png");
    ctx.drawImage(artMask, 0, 0, size, size);
    // Background
    const backgroundImg = await getImg("../res/img/default_cards/ghost_rider.png");
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