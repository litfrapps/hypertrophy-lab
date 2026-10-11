/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

function createSvg(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#121216"/>
        <stop offset="100%" stop-color="#08080A"/>
      </linearGradient>
      <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF333D"/>
        <stop offset="100%" stop-color="#D9141C"/>
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    </defs>

    <!-- Background -->
    <rect width="512" height="512" rx="100" fill="url(#bg)"/>
    <rect width="504" height="504" x="4" y="4" rx="96" fill="none" stroke="#27272A" stroke-width="4"/>

    <!-- Subtle Ambient Glow -->
    <circle cx="256" cy="256" r="140" fill="#FF1E27" opacity="0.12"/>

    <!-- Stylized Dumbbell / Modern Hypertrophy Lab Icon -->
    <g transform="translate(256, 256) rotate(-45) translate(-256, -256)">
      <!-- Central Bar -->
      <rect x="160" y="240" width="192" height="32" rx="8" fill="#F4F4F5"/>
      
      <!-- Knurling pattern on bar -->
      <line x1="236" y1="244" x2="236" y2="268" stroke="#71717A" stroke-width="3" stroke-linecap="round"/>
      <line x1="256" y1="244" x2="256" y2="268" stroke="#71717A" stroke-width="3" stroke-linecap="round"/>
      <line x1="276" y1="244" x2="276" y2="268" stroke="#71717A" stroke-width="3" stroke-linecap="round"/>

      <!-- Inner Weight Collars -->
      <rect x="164" y="224" width="16" height="64" rx="5" fill="#52525B"/>
      <rect x="332" y="224" width="16" height="64" rx="5" fill="#52525B"/>

      <!-- Large Main Plates (Hypertrophy Red Gradient) -->
      <rect x="130" y="176" width="30" height="160" rx="10" fill="url(#redGrad)"/>
      <rect x="352" y="176" width="30" height="160" rx="10" fill="url(#redGrad)"/>

      <!-- Outer Plates -->
      <rect x="98" y="202" width="28" height="108" rx="8" fill="#E4E4E7"/>
      <rect x="386" y="202" width="28" height="108" rx="8" fill="#E4E4E7"/>

      <!-- Outermost End Caps -->
      <rect x="76" y="224" width="18" height="64" rx="6" fill="#71717A"/>
      <rect x="418" y="224" width="18" height="64" rx="6" fill="#71717A"/>
    </g>

    <!-- Lab Accent Indicator -->
    <circle cx="390" cy="122" r="14" fill="#FF1E27" filter="url(#glow)"/>
  </svg>`;
}

async function run() {
  const svg192 = Buffer.from(createSvg(192));
  await sharp(svg192).resize(192, 192).png().toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('Generated icon-192.png');

  const svg512 = Buffer.from(createSvg(512));
  await sharp(svg512).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-512.png'));
  console.log('Generated icon-512.png');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
