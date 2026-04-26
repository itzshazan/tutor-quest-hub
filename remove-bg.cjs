const Jimp = require('C:\\Users\\LOQ\\.gemini\\antigravity\\brain\\2bf8d235-3588-43d9-902c-e60444f61216\\scratch\\node_modules\\jimp');

async function removeBackground(inputPath, outputPath) {
  const image = await Jimp.read(inputPath);
  console.log(`Processing ${inputPath}: ${image.bitmap.width}x${image.bitmap.height}`);

  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];

    // The backgrounds are cream/off-white (#fdf6f0 range)
    // Remove any pixel that is light/near-white (all channels high)
    const avg = (r + g + b) / 3;
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));

    // Very light pixels = background
    if (avg > 220 || (avg > 190 && maxDiff < 20)) {
      this.bitmap.data[idx + 3] = 0;
    }
  });

  image.autocrop();
  await image.writeAsync(outputPath);
  console.log(`Saved to ${outputPath}`);
}

async function main() {
  await removeBackground('public/login-books.png', 'public/login-books.png');
  await removeBackground('public/login-student.png', 'public/login-student.png');
  console.log('All done!');
}

main().catch(console.error);
