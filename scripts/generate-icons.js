const fs = require('fs');
const path = require('path');

// Minimal 1x1 transparent PNG or simple SVG converted icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="128" fill="#0a0a0c"/>
  <circle cx="256" cy="256" r="180" fill="none" stroke="#F59E0B" stroke-width="24"/>
  <circle cx="256" cy="256" r="80" fill="#F59E0B"/>
  <path d="M256 60 L256 110 M256 402 L256 452 M60 256 L110 256 M402 256 L452 256" stroke="#F59E0B" stroke-width="24" stroke-linecap="round"/>
</svg>`;

fs.writeFileSync(path.join('public', 'icons', 'icon.svg'), svgContent, 'utf8');
console.log('SVG icon generated.');
