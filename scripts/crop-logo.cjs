const sharp = require('sharp');

async function run() {
  // Full image is 1456x819
  // Top-left: dark variant with P + PicklePass text (~0,0 to ~435,275)
  await sharp('public/logo.png')
    .extract({ left: 0, top: 90, width: 440, height: 280 })
    .png()
    .toFile('public/logo-dark.png');
  console.log('logo-dark.png created');

  // Small icon variants are bottom-left row, first orange P icon ~150,440 size ~60x70
  // Let me grab one of the small P icons (the first one in the bottom-left row)
  await sharp('public/logo.png')
    .extract({ left: 140, top: 430, width: 80, height: 85 })
    .png()
    .toFile('public/logo-icon.png');
  console.log('logo-icon.png created');
}

run().catch(console.error);
