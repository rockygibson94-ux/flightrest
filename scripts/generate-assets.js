/**
 * Generates all required Expo image assets from SVG source.
 * Run with: node scripts/generate-assets.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

// ─── Icon SVG ─────────────────────────────────────────────────────────────────

const iconSVG = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="42%" r="58%">
      <stop offset="0%" stop-color="#1e3a6e" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#0a0a0f" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#4f8ef7" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" rx="220" fill="#0a0a0f"/>
  <rect width="1024" height="1024" rx="220" fill="url(#glow)"/>

  <!-- Clock ring -->
  <circle cx="512" cy="500" r="248" fill="none" stroke="#1c1c26" stroke-width="4"/>
  <circle cx="512" cy="500" r="238" fill="#13131a" filter="url(#shadow)"/>
  <circle cx="512" cy="500" r="238" fill="none" stroke="#4f8ef7" stroke-width="10" opacity="0.9"/>

  <!-- Hour markers -->
  <line x1="512" y1="272" x2="512" y2="296" stroke="#4f8ef7" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
  <line x1="738" y1="500" x2="714" y2="500" stroke="#4f8ef7" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
  <line x1="512" y1="728" x2="512" y2="704" stroke="#4f8ef7" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
  <line x1="286" y1="500" x2="310" y2="500" stroke="#4f8ef7" stroke-width="8" stroke-linecap="round" opacity="0.6"/>

  <!-- Clock hands — showing roughly 4:30 (early morning alarm feel) -->
  <!-- Hour hand -->
  <line x1="512" y1="500" x2="432" y2="580" stroke="#f0f0f8" stroke-width="18" stroke-linecap="round"/>
  <!-- Minute hand -->
  <line x1="512" y1="500" x2="512" y2="318" stroke="#4f8ef7" stroke-width="12" stroke-linecap="round"/>
  <!-- Center dot -->
  <circle cx="512" cy="500" r="14" fill="#4f8ef7"/>
  <circle cx="512" cy="500" r="6" fill="#f0f0f8"/>

  <!-- Alarm bells -->
  <circle cx="356" cy="296" r="32" fill="#4f8ef7" opacity="0.85"/>
  <rect x="344" y="288" width="24" height="18" rx="3" fill="#0a0a0f"/>
  <circle cx="668" cy="296" r="32" fill="#4f8ef7" opacity="0.85"/>
  <rect x="656" y="288" width="24" height="18" rx="3" fill="#0a0a0f"/>

  <!-- Airplane flying across lower-right -->
  <g transform="translate(658, 640) rotate(-35) scale(1.1)">
    <!-- Fuselage -->
    <ellipse cx="0" cy="0" rx="52" ry="13" fill="#f0f0f8"/>
    <!-- Wings -->
    <path d="M-8,-13 L-32,-48 L10,-48 L18,-13 Z" fill="#f0f0f8"/>
    <path d="M-8,13 L-32,46 L10,46 L18,13 Z" fill="#f0f0f8" opacity="0.7"/>
    <!-- Tail -->
    <path d="M-40,-13 L-56,-30 L-44,-30 L-32,-13 Z" fill="#f0f0f8"/>
    <!-- Window strip -->
    <rect x="-12" y="-5" width="36" height="10" rx="5" fill="#4f8ef7" opacity="0.6"/>
  </g>

  <!-- Flight path dotted trail -->
  <line x1="290" y1="730" x2="618" y2="590" stroke="#4f8ef7" stroke-width="3" stroke-dasharray="10 8" opacity="0.35"/>

  <!-- Z Z Z (sleep indicator) -->
  <text x="698" y="410" font-family="Arial Black, Arial" font-size="52" font-weight="900" fill="#4f8ef7" opacity="0.9">z</text>
  <text x="748" y="362" font-family="Arial Black, Arial" font-size="38" font-weight="900" fill="#4f8ef7" opacity="0.65">z</text>
  <text x="787" y="326" font-family="Arial Black, Arial" font-size="28" font-weight="900" fill="#4f8ef7" opacity="0.4">z</text>
</svg>
`;

// ─── Splash SVG ──────────────────────────────────────────────────────────────

const splashSVG = `
<svg width="1284" height="2778" viewBox="0 0 1284 2778" xmlns="http://www.w3.org/2000/svg">
  <rect width="1284" height="2778" fill="#0a0a0f"/>
  <!-- Centered icon -->
  <g transform="translate(442, 1139)">
    <circle cx="200" cy="200" r="200" fill="#13131a"/>
    <circle cx="200" cy="200" r="200" fill="none" stroke="#4f8ef7" stroke-width="8"/>
    <line x1="200" y1="200" x2="160" y2="240" stroke="#f0f0f8" stroke-width="14" stroke-linecap="round"/>
    <line x1="200" y1="200" x2="200" y2="90" stroke="#4f8ef7" stroke-width="10" stroke-linecap="round"/>
    <circle cx="200" cy="200" r="10" fill="#4f8ef7"/>
    <text x="248" y="158" font-family="Arial Black, Arial" font-size="40" font-weight="900" fill="#4f8ef7" opacity="0.9">z</text>
    <text x="288" y="124" font-family="Arial Black, Arial" font-size="30" font-weight="900" fill="#4f8ef7" opacity="0.6">z</text>
  </g>
  <!-- App name -->
  <text x="642" y="1430" font-family="Arial, sans-serif" font-size="52" font-weight="700"
        fill="#f0f0f8" text-anchor="middle" letter-spacing="12">FLIGHTREST</text>
</svg>
`;

// ─── Generate assets ──────────────────────────────────────────────────────────

async function generate() {
  console.log('Generating app assets...\n');

  const tasks = [
    {
      name: 'icon.png (1024×1024)',
      svg: iconSVG,
      output: path.join(ASSETS_DIR, 'icon.png'),
      width: 1024, height: 1024,
    },
    {
      name: 'adaptive-icon.png (1024×1024, no rounding)',
      svg: iconSVG,
      output: path.join(ASSETS_DIR, 'adaptive-icon.png'),
      width: 1024, height: 1024,
    },
    {
      name: 'favicon.png (48×48)',
      svg: iconSVG,
      output: path.join(ASSETS_DIR, 'favicon.png'),
      width: 48, height: 48,
    },
    {
      name: 'splash.png (1284×2778)',
      svg: splashSVG,
      output: path.join(ASSETS_DIR, 'splash.png'),
      width: 1284, height: 2778,
    },
  ];

  for (const task of tasks) {
    try {
      await sharp(Buffer.from(task.svg))
        .resize(task.width, task.height)
        .png()
        .toFile(task.output);
      console.log(`  ✓  ${task.name}`);
    } catch (err) {
      console.error(`  ✗  ${task.name}: ${err.message}`);
    }
  }

  console.log('\nDone. Assets saved to ./assets/');
}

generate();
