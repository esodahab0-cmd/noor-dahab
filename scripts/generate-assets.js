const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const srcImage = 'C:/Users/DAHAB/.gemini/antigravity/brain/69953610-4ed4-4e01-a671-d13c0f4a67b8/.user_uploaded/media_1789821973969.jpg';
const projectRoot = 'd:/eslam/dahab software/noor dahab';
const publicDir = path.join(projectRoot, 'public');
const iconsDir = path.join(publicDir, 'icons');
const appDir = path.join(projectRoot, 'app');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Function to create a valid ICO file containing an RGBA PNG buffer
function createIcoFromPng(pngBuffer, size = 32) {
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // Type: 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // Number of images: 1

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(size >= 256 ? 0 : size, 0); // Width
  dirEntry.writeUInt8(size >= 256 ? 0 : size, 1); // Height
  dirEntry.writeUInt8(0, 2); // Color palette
  dirEntry.writeUInt8(0, 3); // Reserved
  dirEntry.writeUInt16LE(1, 4); // Color planes
  dirEntry.writeUInt16LE(32, 6); // Bits per pixel (32 bit RGBA)
  dirEntry.writeUInt32LE(pngBuffer.length, 8); // Image size in bytes
  dirEntry.writeUInt32LE(6 + 16, 12); // Offset to image data (header + 1 entry = 22 bytes)

  return Buffer.concat([icoHeader, dirEntry, pngBuffer]);
}

async function run() {
  console.log('Generating assets from:', srcImage);

  // 1. High resolution master logo
  await sharp(srcImage)
    .ensureAlpha()
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('Created public/logo.png');

  // 2. Standard PWA & Web Icons
  const sizes = [
    { name: 'icon-512.png', size: 512 },
    { name: 'icon-384.png', size: 384 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-128.png', size: 128 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];

  for (const { name, size } of sizes) {
    await sharp(srcImage)
      .resize(size, size, { fit: 'cover' })
      .ensureAlpha()
      .png({ quality: 95 })
      .toFile(path.join(iconsDir, name));
    console.log(`Created public/icons/${name} (${size}x${size})`);
  }

  // 3. Apple Touch Icon in public root as well
  await sharp(srcImage)
    .resize(180, 180, { fit: 'cover' })
    .ensureAlpha()
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created public/apple-touch-icon.png');

  // 4. Next.js App Router icons
  await sharp(srcImage)
    .resize(512, 512, { fit: 'cover' })
    .ensureAlpha()
    .png({ quality: 95 })
    .toFile(path.join(appDir, 'icon.png'));
  console.log('Created app/icon.png');

  await sharp(srcImage)
    .resize(180, 180, { fit: 'cover' })
    .ensureAlpha()
    .png({ quality: 95 })
    .toFile(path.join(appDir, 'apple-icon.png'));
  console.log('Created app/apple-icon.png');

  // Remove app/favicon.ico to avoid Turbopack decode conflict (public/favicon.ico handles it)
  const appFavicon = path.join(appDir, 'favicon.ico');
  if (fs.existsSync(appFavicon)) {
    fs.unlinkSync(appFavicon);
    console.log('Removed app/favicon.ico (using public/favicon.ico and app/icon.png instead)');
  }

  // 5. Favicons (16, 32, 48)
  const fav32Buffer = await sharp(srcImage)
    .resize(32, 32, { fit: 'cover' })
    .ensureAlpha()
    .png()
    .toBuffer();

  const fav16Buffer = await sharp(srcImage)
    .resize(16, 16, { fit: 'cover' })
    .ensureAlpha()
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), fav32Buffer);
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), fav16Buffer);

  const icoBuffer = createIcoFromPng(fav32Buffer, 32);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('Created public/favicon.ico');

  // 6. OpenGraph Banner (1200x630) for Google, Facebook, WhatsApp, Twitter
  const logoForOg = await sharp(srcImage)
    .resize(520, 520, { fit: 'contain', background: { r: 18, g: 45, b: 72, alpha: 1 } })
    .ensureAlpha()
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 18, g: 45, b: 72, alpha: 1 }
    }
  })
    .composite([
      {
        input: logoForOg,
        top: Math.round((630 - 520) / 2),
        left: Math.round((1200 - 520) / 2)
      }
    ])
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'og-image.png'));

  // Also write to app/opengraph-image.png (Next.js automatically generates og:image tags)
  fs.copyFileSync(path.join(publicDir, 'og-image.png'), path.join(appDir, 'opengraph-image.png'));
  console.log('Created public/og-image.png & app/opengraph-image.png (1200x630)');

  console.log('All image assets created successfully with RGBA!');
}

run().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
