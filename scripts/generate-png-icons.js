const fs = require('fs');
const path = require('path');

// 1x1 gold pixel PNG base64
const goldPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const buffer = Buffer.from(goldPngBase64, 'base64');

fs.writeFileSync(path.join('public', 'icons', 'icon-192.png'), buffer);
fs.writeFileSync(path.join('public', 'icons', 'icon-512.png'), buffer);
console.log('PNG placeholder icons generated successfully.');
