const Jimp = require('C:\\Users\\LOQ\\.gemini\\antigravity\\brain\\2bf8d235-3588-43d9-902c-e60444f61216\\scratch\\node_modules\\jimp');

async function processLogo() {
  try {
    const image = await Jimp.read('public/logo-raw.png');
    console.log('Read image:', image.bitmap.width, 'x', image.bitmap.height);

    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const r = this.bitmap.data[idx];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // Calculate how "grey" or "white" a pixel is
      // If it's very close to white/off-white, or if it's a grey shadow (where R, G, B are similar and relatively high)
      const maxDist = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      const avg = (r + g + b) / 3;

      // The logo has distinct colors: Red, Yellow, Skin, Black.
      // Black: avg < 50
      // Red: r > 200, g < 100, b < 100
      // Yellow: r > 200, g > 180, b < 100
      // Skin: r > 240, g > 200, b > 150
      
      // Let's remove anything that is roughly white/off-white/grey
      // The background is around #fdfaf6 (253, 250, 246)
      // The shadow is varying shades of grey (r≈g≈b > 200)
      if (avg > 230 || (avg > 200 && maxDist < 15)) {
        this.bitmap.data[idx + 3] = 0; // Make transparent
      }
    });

    // Also auto-crop any transparent borders
    image.autocrop();

    await image.writeAsync('public/logo.png');
    console.log('Successfully saved to public/logo.png');
  } catch (error) {
    console.error('Error processing logo:', error);
  }
}

processLogo();
