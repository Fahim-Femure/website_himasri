import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'web', 'public', 'assets', 'images');
const productOutDir = path.join(outDir, 'products');
const ornamentsOutDir = path.join(outDir, 'ornaments');
const ornamentsSourceDir = path.join(rootDir, 'assets-source', 'ornaments');
const fontsOutDir = path.join(rootDir, 'web', 'public', 'assets', 'fonts');

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(productOutDir, { recursive: true });
fs.mkdirSync(ornamentsOutDir, { recursive: true });
fs.mkdirSync(ornamentsSourceDir, { recursive: true });
fs.mkdirSync(fontsOutDir, { recursive: true });

function findFirstExisting(paths) {
  for (const p of paths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

const logoSource = findFirstExisting([
  path.join(rootDir, 'assets-source', 'logo', 'logo-himasri.png'),
  'C:\\Users\\Fahim\\Downloads\\png\\1_Kecil (kurang dari 1 MB)\\LOGO_HIMASRI_IMPROVE-removebg-preview.png',
  'C:\\Users\\Fahim\\Downloads\\png\\2_Sedang (1-10 MB)\\LOGO HIMASRI IMPROVE.png',
]);

const kebersamaanSource = findFirstExisting([
  path.join(rootDir, 'assets-source', 'photos', 'hero-kebersamaan.jpg'),
  path.join(rootDir, 'assets-source', 'photos', 'hero-kebersamaan.jpeg'),
  'C:\\Users\\Fahim\\Downloads\\foto_himasri_2.jpeg',
]);

const pengurusSource = findFirstExisting([
  path.join(rootDir, 'assets-source', 'photos', 'hero-pengurus.jpg'),
  path.join(rootDir, 'assets-source', 'photos', 'hero-pengurus.jpeg'),
  'C:\\Users\\Fahim\\Downloads\\foto_himasri_1.jpeg',
]);

async function createPlaceholderImage(targetPath, width, height, label, format) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#7A1F2B"/>
          <stop offset="100%" stop-color="#3A0910"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      <rect x="40" y="40" width="${width - 80}" height="${height - 80}" rx="24" fill="none" stroke="#D9B54A" stroke-width="4" stroke-opacity="0.6"/>
      <text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" fill="#FFFBF3" font-family="sans-serif" font-size="${Math.max(24, Math.round(width / 24))}" font-weight="700">HIMASRI IT PLN</text>
      <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" fill="#E6C76A" font-family="sans-serif" font-size="${Math.max(16, Math.round(width / 42))}">${label}</text>
    </svg>
  `;
  const pipeline = sharp(Buffer.from(svg));
  if (format === 'png') {
    await pipeline.png().toFile(targetPath);
  } else if (format === 'webp') {
    await pipeline.webp({ quality: 82 }).toFile(targetPath);
  } else {
    await pipeline.jpeg({ quality: 82 }).toFile(targetPath);
  }
}

async function optimizePhoto(sourcePath, baseName, targetWidth) {
  const jpgOut = path.join(outDir, `${baseName}.jpg`);
  const webpOut = path.join(outDir, `${baseName}.webp`);

  if (!sourcePath) {
    console.warn(`[assets] Sumber ${baseName} tidak ditemukan, membuat placeholder maroon.`);
    await createPlaceholderImage(jpgOut, targetWidth, Math.round((targetWidth * 3) / 4), `${baseName}.jpg`, 'jpg');
    await createPlaceholderImage(webpOut, targetWidth, Math.round((targetWidth * 3) / 4), `${baseName}.webp`, 'webp');
    return;
  }

  const meta = await sharp(sourcePath).metadata();
  const resizeWidth = meta.width && meta.width > targetWidth ? targetWidth : undefined;

  await sharp(sourcePath)
    .rotate()
    .resize(resizeWidth ? { width: resizeWidth, withoutEnlargement: true } : undefined)
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(jpgOut);

  let quality = 82;
  let webpBuffer = await sharp(sourcePath)
    .rotate()
    .resize(resizeWidth ? { width: resizeWidth, withoutEnlargement: true } : undefined)
    .webp({ quality })
    .toBuffer();

  while (webpBuffer.length > 300 * 1024 && quality > 45) {
    quality -= 8;
    webpBuffer = await sharp(sourcePath)
      .rotate()
      .resize(resizeWidth ? { width: resizeWidth, withoutEnlargement: true } : undefined)
      .webp({ quality })
      .toBuffer();
  }

  fs.writeFileSync(webpOut, webpBuffer);
  console.log(
    `[assets] ${baseName}: jpg=${Math.round(fs.statSync(jpgOut).size / 1024)}KB, webp=${Math.round(webpBuffer.length / 1024)}KB (from ${path.basename(sourcePath)})`,
  );
}

async function prepareLogo() {
  const logoOut = path.join(outDir, 'logo-himasri.png');
  if (!logoSource) {
    console.warn('[assets] Sumber logo tidak ditemukan, membuat placeholder logo.');
    await createPlaceholderImage(logoOut, 512, 512, 'logo-himasri.png', 'png');
    return;
  }
  await sharp(logoSource)
    .resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(logoOut);
  console.log(`[assets] logo-himasri.png: ${Math.round(fs.statSync(logoOut).size / 1024)}KB (from ${path.basename(logoSource)})`);
}

async function createSampleProductVisuals() {
  const items = [
    { slug: 'kaos-songket', title: 'Kaos Songket HIMASRI', accent: '#7A1F2B', tag: 'APPAREL · HUT 2026' },
    { slug: 'totebag-songket', title: 'Totebag Motif Songket', accent: '#4A0D16', tag: 'AKSESORIS · HUT 2026' },
    { slug: 'ganci-ampera', title: 'Gantungan Kunci Ampera', accent: '#A3202C', tag: 'SOUVENIR · HUT 2026' },
    { slug: 'stiker-wong-kito', title: 'Stiker Pack Wong Kito', accent: '#3A0910', tag: 'STIKER · HUT 2026' },
    { slug: 'topi-himasri', title: 'Topi Bordir HIMASRI', accent: '#6E121B', tag: 'APPAREL · HUT 2026' },
    { slug: 'pin-sriwijaya', title: 'Pin Enamel Sriwijaya', accent: '#9E2F3C', tag: 'KOLEKSI · HUT 2026' },
  ];

  for (const item of items) {
    const outPath = path.join(productOutDir, `${item.slug}.webp`);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${item.accent}"/>
            <stop offset="100%" stop-color="#2A060A"/>
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#g)"/>
        <polygon points="400,115 470,185 400,255 330,185" fill="none" stroke="#E6C76A" stroke-width="5"/>
        <polygon points="400,145 440,185 400,225 360,185" fill="#D9B54A" fill-opacity="0.28" stroke="#E6C76A" stroke-width="3"/>
        <text x="400" y="340" text-anchor="middle" fill="#E6C76A" font-family="sans-serif" font-size="18" font-weight="700" letter-spacing="3">${item.tag}</text>
        <text x="400" y="395" text-anchor="middle" fill="#FFFBF3" font-family="sans-serif" font-size="34" font-weight="700">${item.title}</text>
        <text x="400" y="445" text-anchor="middle" fill="#F6EBC8" font-family="sans-serif" font-size="18">Contoh Merchandise Resmi HIMASRI</text>
      </svg>
    `;
    await sharp(Buffer.from(svg)).webp({ quality: 85 }).toFile(outPath);
  }
  console.log(`[assets] Created ${items.length} sample product WebP images.`);
}

const DEPARTMENT_CROPS = {
  presi: { left: 0.0, top: 0.36, width: 1.0, height: 0.422, outW: 960, outH: 540 },
  psdm: { left: 0.04, top: 0.18, width: 0.92, height: 0.64, outW: 960, outH: 640 },
  kwu: { left: 0.05, top: 0.35, width: 0.9, height: 0.46, outW: 960, outH: 640 },
  sosmas: { left: 0.04, top: 0.36, width: 0.92, height: 0.36, outW: 960, outH: 640 },
  pendidikan: { left: 0.06, top: 0.34, width: 0.88, height: 0.44, outW: 960, outH: 640 },
  medfo: { left: 0.02, top: 0.24, width: 0.96, height: 0.48, outW: 960, outH: 640 },
};

async function prepareDepartmentPhotos() {
  const srcDir = path.join(rootDir, 'assets-source', 'departments');
  const deptOutDir = path.join(outDir, 'departments');
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(deptOutDir, { recursive: true });

  const files = fs.readdirSync(srcDir).filter((f) => /\.(jpg|jpeg|png)$/i.test(f));
  for (const file of files) {
    const base = path.basename(file, path.extname(file));
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(deptOutDir, `${base}.webp`);
    const crop = DEPARTMENT_CROPS[base];

    const rotatedBuf = await sharp(srcPath).rotate().toBuffer();
    const meta = await sharp(rotatedBuf).metadata();
    const imgW = meta.width ?? 960;
    const imgH = meta.height ?? 640;

    let extractRegion = null;
    if (crop) {
      const left = Math.max(0, Math.min(imgW - 10, Math.round(imgW * crop.left)));
      const top = Math.max(0, Math.min(imgH - 10, Math.round(imgH * crop.top)));
      const width = Math.max(10, Math.min(imgW - left, Math.round(imgW * crop.width)));
      const height = Math.max(10, Math.min(imgH - top, Math.round(imgH * crop.height)));
      extractRegion = { left, top, width, height };
    }

    const outW = crop?.outW ?? 960;
    const outH = crop?.outH ?? 640;

    let quality = 80;
    let targetW = outW;
    let targetH = outH;
    const renderCrop = async () => {
      let pipeline = sharp(rotatedBuf);
      if (extractRegion) pipeline = pipeline.extract(extractRegion);
      return pipeline
        .resize({ width: targetW, height: targetH, fit: 'cover', position: 'centre' })
        .webp({ quality })
        .toBuffer();
    };

    let buf = await renderCrop();
    while (buf.length > 165 * 1024 && quality > 52) {
      quality -= 8;
      targetW = Math.round(targetW * 0.9);
      targetH = Math.round(targetH * 0.9);
      buf = await renderCrop();
    }
    fs.writeFileSync(destPath, buf);
    console.log(
      `[assets] dept/${base}.webp: ${Math.round(buf.length / 1024)}KB (${targetW}x${targetH}, q=${quality})`,
    );
  }
}

async function copyPreloadFont() {
  const srcFont = path.join(
    rootDir,
    'node_modules',
    '@fontsource-variable',
    'plus-jakarta-sans',
    'files',
    'plus-jakarta-sans-latin-wght-normal.woff2',
  );
  if (fs.existsSync(srcFont)) {
    const destFont = path.join(fontsOutDir, 'plus-jakarta-sans-latin-wght-normal.woff2');
    fs.copyFileSync(srcFont, destFont);
    console.log('[assets] Copied plus-jakarta-sans-latin-wght-normal.woff2 for font preload.');
  }
}

async function downloadFirstValidImage(urls, cachedFileName) {
  const cachedPath = path.join(ornamentsSourceDir, cachedFileName);
  if (fs.existsSync(cachedPath)) {
    try {
      const buf = fs.readFileSync(cachedPath);
      const meta = await sharp(buf).metadata();
      if (meta.width && meta.height && buf.length > 10 * 1024) {
        return { buffer: buf, source: `cache:${cachedFileName}` };
      }
    } catch {
      // Cache corrupt, re-download below
    }
  }

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; HimasriAssetBot/1.0; +https://himasri.local)',
          Accept: 'image/webp,image/jpeg,image/png,image/*;q=0.8',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`[assets] HTTP ${response.status} untuk ${url}`);
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) {
        console.warn(`[assets] Konten bukan gambar (${contentType}) untuk ${url}`);
        continue;
      }

      const arrayBuf = await response.arrayBuffer();
      const buf = Buffer.from(arrayBuf);
      const meta = await sharp(buf).metadata();
      if (!meta.width || !meta.height || buf.length < 10 * 1024) {
        console.warn(`[assets] Metadata gambar tidak valid untuk ${url}`);
        continue;
      }

      fs.writeFileSync(cachedPath, buf);
      return { buffer: buf, source: url };
    } catch (err) {
      console.warn(`[assets] Gagal mengunduh ${url}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return null;
}

function buildAmperaSvgFallback() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3A0910"/>
          <stop offset="55%" stop-color="#7A1F2B"/>
          <stop offset="100%" stop-color="#2B1A1C"/>
        </linearGradient>
        <radialGradient id="sun" cx="50%" cy="62%" r="42%">
          <stop offset="0%" stop-color="#F6EBC8" stop-opacity="0.85"/>
          <stop offset="45%" stop-color="#D9B54A" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#7A1F2B" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#sky)"/>
      <rect width="1600" height="900" fill="url(#sun)"/>
      <!-- Sungai Musi -->
      <path d="M0 640 Q400 625 800 640 T1600 635 L1600 900 L0 900 Z" fill="#1E0508" fill-opacity="0.72"/>
      <g stroke="#E6C76A" stroke-opacity="0.28" stroke-width="2" fill="none">
        <path d="M180 715 Q420 705 680 718"/>
        <path d="M620 755 Q860 744 1140 758"/>
        <path d="M290 800 Q650 788 1020 802"/>
      </g>
      <!-- Jembatan Ampera Silhouette -->
      <g fill="#1F0609" stroke="#F6EBC8" stroke-opacity="0.45" stroke-width="2">
        <!-- Main deck -->
        <rect x="0" y="542" width="1600" height="22"/>
        <rect x="0" y="534" width="1600" height="6"/>
        <!-- Piers -->
        <rect x="520" y="564" width="38" height="105"/>
        <rect x="1042" y="564" width="38" height="105"/>
        <!-- Left & Right Twin Towers (Menara Ampera) -->
        <polygon points="512,534 525,210 562,210 575,534"/>
        <polygon points="1025,534 1038,210 1075,210 1088,534"/>
        <!-- Top caps -->
        <rect x="518" y="190" width="52" height="24" rx="4"/>
        <rect x="1030" y="190" width="52" height="24" rx="4"/>
        <!-- Cross beams between towers -->
        <rect x="558" y="248" width="484" height="16"/>
        <rect x="556" y="340" width="488" height="12"/>
        <!-- Tower truss details -->
        <line x1="524" y1="300" x2="564" y2="360"/>
        <line x1="564" y1="300" x2="524" y2="360"/>
        <line x1="520" y1="400" x2="568" y2="470"/>
        <line x1="568" y1="400" x2="520" y2="470"/>
        <line x1="1036" y1="300" x2="1076" y2="360"/>
        <line x1="1076" y1="300" x2="1036" y2="360"/>
        <line x1="1032" y1="400" x2="1080" y2="470"/>
        <line x1="1080" y1="400" x2="1032" y2="470"/>
        <!-- Suspension cables -->
        <line x1="526" y1="220" x2="140" y2="534" stroke-width="2.5"/>
        <line x1="526" y1="265" x2="260" y2="534" stroke-width="2"/>
        <line x1="526" y1="315" x2="380" y2="534" stroke-width="2"/>
        <line x1="1074" y1="220" x2="1460" y2="534" stroke-width="2.5"/>
        <line x1="1074" y1="265" x2="1340" y2="534" stroke-width="2"/>
        <line x1="1074" y1="315" x2="1220" y2="534" stroke-width="2"/>
      </g>
    </svg>
  `;
  return Buffer.from(svg);
}

function buildSongketTextureSvgFallback() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs>
        <pattern id="songketTile" width="120" height="120" patternUnits="userSpaceOnUse">
          <rect width="120" height="120" fill="#4A0D16"/>
          <path d="M60 8 L112 60 L60 112 L8 60 Z" fill="none" stroke="#D9B54A" stroke-width="2.5"/>
          <path d="M60 24 L96 60 L60 96 L24 60 Z" fill="none" stroke="#E6C76A" stroke-width="1.8"/>
          <path d="M60 40 L80 60 L60 80 L40 60 Z" fill="#D9B54A" fill-opacity="0.35"/>
          <circle cx="60" cy="60" r="6" fill="#F6EBC8"/>
          <path d="M0 0 L24 24 M120 0 L96 24 M0 120 L24 96 M120 120 L96 96" stroke="#C9A227" stroke-width="1.8"/>
        </pattern>
      </defs>
      <rect width="1200" height="800" fill="url(#songketTile)"/>
    </svg>
  `;
  return Buffer.from(svg);
}

function writeSongketSvgOrnaments() {
  // Motif Songket Lepus / Bunga Cina Palembang (seamless 96x96)
  const songketPatternSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <g fill="none" stroke="#8C6A1A" stroke-linecap="round" stroke-linejoin="round">
    <!-- Outer diamond trellis -->
    <polygon points="48,4 92,48 48,92 4,48" stroke-width="1.5"/>
    <!-- Inner stepped Songket diamond -->
    <polygon points="48,18 78,48 48,78 18,48" stroke-width="1.2"/>
    <!-- Bunga Cina 8-petal floral core -->
    <polygon points="48,30 56,40 66,48 56,56 48,66 40,56 30,48 40,40" stroke-width="1.2"/>
    <circle cx="48" cy="48" r="3.5" fill="#8C6A1A" stroke="none"/>
    <!-- Corner quadrant motifs -->
    <polygon points="0,0 14,0 0,14" stroke-width="1.1"/>
    <polygon points="96,0 82,0 96,14" stroke-width="1.1"/>
    <polygon points="0,96 14,96 0,82" stroke-width="1.1"/>
    <polygon points="96,96 82,96 96,82" stroke-width="1.1"/>
    <circle cx="0" cy="0" r="2.2" fill="#8C6A1A" stroke="none"/>
    <circle cx="96" cy="0" r="2.2" fill="#8C6A1A" stroke="none"/>
    <circle cx="0" cy="96" r="2.2" fill="#8C6A1A" stroke="none"/>
    <circle cx="96" cy="96" r="2.2" fill="#8C6A1A" stroke="none"/>
    <!-- Subtle weave micro-ticks -->
    <line x1="26" y1="26" x2="32" y2="32" stroke-width="1"/>
    <line x1="70" y1="26" x2="64" y2="32" stroke-width="1"/>
    <line x1="26" y1="70" x2="32" y2="64" stroke-width="1"/>
    <line x1="70" y1="70" x2="64" y2="64" stroke-width="1"/>
  </g>
</svg>
`;

  // Motif Pucuk Rebung Sriwijaya (seamless horizontal 64x24 border)
  const pucukRebungSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="24" viewBox="0 0 64 24">
  <g fill="none" stroke="#C9A227" stroke-width="1.3" stroke-linejoin="round">
    <polygon points="0,24 16,4 32,24"/>
    <polygon points="7,24 16,12 25,24"/>
    <polygon points="32,24 48,4 64,24"/>
    <polygon points="39,24 48,12 57,24"/>
    <circle cx="16" cy="4" r="1.5" fill="#C9A227" stroke="none"/>
    <circle cx="48" cy="4" r="1.5" fill="#C9A227" stroke="none"/>
    <circle cx="32" cy="18" r="1.3" fill="#C9A227" stroke="none"/>
  </g>
</svg>
`;

  fs.writeFileSync(path.join(ornamentsOutDir, 'songket-pattern.svg'), songketPatternSvg, 'utf8');
  fs.writeFileSync(path.join(ornamentsOutDir, 'pucuk-rebung.svg'), pucukRebungSvg, 'utf8');
  console.log('[assets] Created seamless SVG ornaments: songket-pattern.svg, pucuk-rebung.svg');
}

async function optimizeOrnamentWebp(inputBuffer, targetName, maxWidth, maxBytes, warmTint = false) {
  const outPath = path.join(ornamentsOutDir, targetName);
  const meta = await sharp(inputBuffer).metadata();
  const resizeWidth = meta.width && meta.width > maxWidth ? maxWidth : undefined;

  let quality = 80;
  const render = (q) => {
    let pipeline = sharp(inputBuffer)
      .rotate()
      .resize(resizeWidth ? { width: resizeWidth, withoutEnlargement: true } : undefined);
    if (warmTint) {
      pipeline = pipeline.modulate({ brightness: 1.02, saturation: 0.35 }).tint({ r: 230, g: 199, b: 106 });
    }
    return pipeline.webp({ quality: q }).toBuffer();
  };

  let webpBuffer = await render(quality);
  while (webpBuffer.length > maxBytes && quality > 42) {
    quality -= 8;
    webpBuffer = await render(quality);
  }

  fs.writeFileSync(outPath, webpBuffer);
  console.log(`[assets] ${targetName}: ${Math.round(webpBuffer.length / 1024)}KB (q=${quality})`);
}

async function buildSeamlessSongketTile(sourceBuffer, extractBox, targetName) {
  const outPath = path.join(ornamentsOutDir, targetName);
  const qSize = 240;
  const q = await sharp(sourceBuffer)
    .extract(extractBox)
    .normalise()
    .modulate({ saturation: 1.15, brightness: 1.05 })
    .resize(qSize, qSize, { fit: 'cover' })
    .toBuffer();

  const qH = await sharp(q).flop().toBuffer();
  const qV = await sharp(q).flip().toBuffer();
  const qHV = await sharp(q).flip().flop().toBuffer();

  const { data: mirrorBuf, info } = await sharp({
    create: {
      width: qSize * 2,
      height: qSize * 2,
      channels: 4,
      background: { r: 74, g: 13, b: 22, alpha: 1 },
    },
  })
    .composite([
      { input: q, left: 0, top: 0 },
      { input: qH, left: qSize, top: 0 },
      { input: qV, left: 0, top: qSize },
      { input: qHV, left: qSize, top: qSize },
    ])
    .blur(0.6)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const stride = info.channels;
  const rgba = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const r = mirrorBuf[i * stride];
    const g = mirrorBuf[i * stride + 1];
    // Separate real gold brocade motif threads cleanly from dark maroon silk ground
    const goldSignal = Math.max(0, Math.min(1, (g - 42) / 108));
    const motifWeight = goldSignal * (0.7 + 0.3 * Math.min(1, r / 210));
    const alpha = Math.round(Math.pow(motifWeight, 0.85) * 255);
    rgba[i * 4] = 172;
    rgba[i * 4 + 1] = 124;
    rgba[i * 4 + 2] = 32;
    rgba[i * 4 + 3] = alpha;
  }

  let quality = 86;
  let webpBuffer = await sharp(rgba, { raw: { width, height, channels: 4 } })
    .webp({ quality, alphaQuality: 90 })
    .toBuffer();

  while (webpBuffer.length > 150 * 1024 && quality > 50) {
    quality -= 8;
    webpBuffer = await sharp(rgba, { raw: { width, height, channels: 4 } })
      .webp({ quality, alphaQuality: 80 })
      .toBuffer();
  }

  fs.writeFileSync(outPath, webpBuffer);
  console.log(`[assets] ${targetName}: ${Math.round(webpBuffer.length / 1024)}KB (seamless RGBA weave, q=${quality})`);
}

async function preparePalembangOrnaments() {
  writeSongketSvgOrnaments();

  const amperaUrls = [
    'https://commons.wikimedia.org/wiki/Special:FilePath/Jembatan_Ampera.jpg?width=1600',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Ampera_Bridge_at_Noon,_Palembang.jpg?width=1600',
    'https://commons.wikimedia.org/wiki/Special:FilePath/LRT_Palembang_Ampera.jpg?width=1600',
  ];
  const amperaRes = await downloadFirstValidImage(amperaUrls, 'ampera-source.jpg');
  if (amperaRes) {
    console.log(`[assets] Ampera image resolved from ${amperaRes.source}`);
    await optimizeOrnamentWebp(amperaRes.buffer, 'ampera-bg.webp', 1600, 180 * 1024, true);
  } else {
    console.warn('[assets] Menggunakan ilustrasi SVG fallback untuk ampera-bg.webp.');
    await optimizeOrnamentWebp(buildAmperaSvgFallback(), 'ampera-bg.webp', 1600, 180 * 1024, false);
  }

  // Autentik Songket Palembang (Textile Museum of Canada: Skirt (sarong), Palembang, Sumatra, silk & gold thread)
  const palembangSarongUrl =
    'https://commons.wikimedia.org/wiki/Special:FilePath/' +
    encodeURIComponent(
      'Skirt_(sarong),_Palembang,_Sumatra,_Indonesia,_early_to_mid_20th_century,_silk,_gold_thread_-_Textile_Museum_of_Canada_-_DSC00994.JPG',
    ) +
    '?width=1400';
  const palembangMacroUrl = 'https://commons.wikimedia.org/wiki/Special:FilePath/Kain_songket.jpg?width=1400';
  const palembangSingepUrl =
    'https://commons.wikimedia.org/wiki/Special:FilePath/' +
    encodeURIComponent(
      "Man's_head_cloth_(singep),_Palembang,_Sumatra,_Indonesia,_early_20th_century,_silk,_gold_thread_-_Textile_Museum_of_Canada_-_DSC01018.JPG",
    ) +
    '?width=1400';

  const songketRes = await downloadFirstValidImage(
    [palembangSarongUrl, palembangMacroUrl, palembangSingepUrl],
    'palembang-songket-source.jpg',
  );
  if (songketRes) {
    console.log(`[assets] Palembang Songket resolved from ${songketRes.source}`);
    const sMeta = await sharp(songketRes.buffer).metadata();
    const w = sMeta.width || 1200;
    const h = sMeta.height || 1200;
    const isSarongLayout = h > w * 1.05;

    const fullPanelBox = isSarongLayout
      ? {
          left: Math.round(w * 0.22),
          top: Math.round(h * 0.16),
          width: Math.round(w * 0.56),
          height: Math.round(h * 0.66),
        }
      : {
          left: Math.round(w * 0.12),
          top: Math.round(h * 0.57),
          width: Math.round(w * 0.58),
          height: Math.round(h * 0.38),
        };

    const panelBuf = await sharp(songketRes.buffer).extract(fullPanelBox).toBuffer();
    await optimizeOrnamentWebp(panelBuf, 'songket-texture.webp', 580, 150 * 1024, false);

    const tileSquareSize = isSarongLayout ? Math.round(w * 0.31) : Math.round(h * 0.255);
    const tileBox = isSarongLayout
      ? {
          left: Math.round(w * 0.34),
          top: Math.round(h * 0.24),
          width: tileSquareSize,
          height: tileSquareSize,
        }
      : {
          left: Math.round(w * 0.205),
          top: Math.round(h * 0.655),
          width: tileSquareSize,
          height: tileSquareSize,
        };

    await buildSeamlessSongketTile(songketRes.buffer, tileBox, 'songket-tile.webp');
  } else {
    console.warn('[assets] Menggunakan tekstur SVG fallback untuk Songket Palembang.');
    const fallbackBuf = buildSongketTextureSvgFallback();
    await optimizeOrnamentWebp(fallbackBuf, 'songket-texture.webp', 1200, 150 * 1024, false);
    await buildSeamlessSongketTile(
      fallbackBuf,
      { left: 0, top: 0, width: 480, height: 480 },
      'songket-tile.webp',
    );
  }
}

await prepareLogo();
await optimizePhoto(kebersamaanSource, 'hero-kebersamaan', 1440);
await optimizePhoto(pengurusSource, 'hero-pengurus', 1920);
await createSampleProductVisuals();
await preparePalembangOrnaments();
await copyPreloadFont();
await prepareDepartmentPhotos();
