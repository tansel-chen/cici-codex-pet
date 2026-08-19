const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const poses = path.join(__dirname, "poses");
const output = path.join(root, "pet", "spritesheet.webp");
const preview = path.join(root, "qa", "contact-sheet.png");
const darkPreview = path.join(root, "qa", "contact-sheet-dark.png");
const blackPreview = path.join(root, "qa", "contact-sheet-black.png");
const bluePreview = path.join(root, "qa", "contact-sheet-deep-blue.png");
const whitePreview = path.join(root, "qa", "contact-sheet-white.png");
const edgeDetailPreview = path.join(root, "qa", "edge-detail-4x.png");
const publicPreview = path.join(root, "preview.png");

const cellWidth = 192;
const cellHeight = 208;
const columns = 8;
const rows = 11;
const supersample = 3;
const outlineInset = 1;
const colorInset = 3;
const featherSigma = 2;

const files = {
  idle: path.join(poses, "cici-idle.png"),
  run: path.join(poses, "cici-run.png"),
  wave: path.join(poses, "cici-wave.png"),
  jump: path.join(poses, "cici-jump.png"),
  failed: path.join(poses, "cici-idle.png"),
  review: path.join(poses, "cici-review.png"),
};

for (const file of Object.values(files)) {
  if (!fs.existsSync(file)) throw new Error(`Missing pose: ${file}`);
}

async function rebuildSoftEdge(input, width, height) {
  const { data: rgba, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.channels !== 4) throw new Error(`Expected RGBA input, received ${info.channels} channels`);
  const pixelCount = width * height;
  const alpha = Buffer.alloc(pixelCount);
  const whiteCandidate = Buffer.alloc(pixelCount);

  for (let index = 0; index < pixelCount; index++) {
    const offset = index * 4;
    alpha[index] = rgba[offset + 3] > 8 ? 255 : 0;
    const red = rgba[offset];
    const green = rgba[offset + 1];
    const blue = rgba[offset + 2];
    const lightest = Math.max(red, green, blue);
    const darkest = Math.min(red, green, blue);
    const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
    whiteCandidate[index] = alpha[index] && luminance >= 220 && lightest - darkest <= 42 ? 1 : 0;
  }

  // The source art contains a baked white sticker stroke. Remove only white
  // pixels connected to transparency, so white fur enclosed by the character's
  // blue-grey contour remains untouched.
  const externalWhite = Buffer.alloc(pixelCount);
  const whiteQueue = new Int32Array(pixelCount);
  let whiteHead = 0;
  let whiteTail = 0;

  for (let index = 0; index < pixelCount; index++) {
    if (!whiteCandidate[index]) continue;
    const x = index % width;
    const y = Math.floor(index / width);
    let touchesTransparency = x === 0 || y === 0 || x + 1 === width || y + 1 === height;
    for (let dy = -1; !touchesTransparency && dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const neighbor = (y + dy) * width + x + dx;
        if (!alpha[neighbor]) {
          touchesTransparency = true;
          break;
        }
      }
    }
    if (!touchesTransparency) continue;
    externalWhite[index] = 1;
    whiteQueue[whiteTail++] = index;
  }

  while (whiteHead < whiteTail) {
    const index = whiteQueue[whiteHead++];
    const x = index % width;
    const y = Math.floor(index / width);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nextX = x + dx;
        const nextY = y + dy;
        if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) continue;
        const neighbor = nextY * width + nextX;
        if (!whiteCandidate[neighbor] || externalWhite[neighbor]) continue;
        externalWhite[neighbor] = 1;
        whiteQueue[whiteTail++] = neighbor;
      }
    }
  }

  const cleanedAlpha = Buffer.alloc(pixelCount);
  for (let index = 0; index < pixelCount; index++) {
    cleanedAlpha[index] = alpha[index] && !externalWhite[index] ? 255 : 0;
  }

  const { data: edgeCore, info: edgeInfo } = await sharp(cleanedAlpha, { raw: { width, height, channels: 1 } })
    .erode(outlineInset)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data: colorCore, info: colorInfo } = await sharp(cleanedAlpha, { raw: { width, height, channels: 1 } })
    .erode(colorInset)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data: featheredAlpha, info: featherInfo } = await sharp(edgeCore, { raw: { width, height, channels: 1 } })
    .blur(featherSigma)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (edgeInfo.channels !== 1 || colorInfo.channels !== 1 || featherInfo.channels !== 1) {
    throw new Error(`Expected single-channel masks, received ${edgeInfo.channels}/${colorInfo.channels}/${featherInfo.channels}`);
  }

  const opaqueCount = alpha.reduce((total, value) => total + (value > 0 ? 1 : 0), 0);
  const edgeCoreCount = edgeCore.reduce((total, value) => total + (value > 0 ? 1 : 0), 0);
  const featherCount = featheredAlpha.reduce((total, value) => total + (value > 0 ? 1 : 0), 0);
  if (!opaqueCount || !edgeCoreCount || !featherCount) {
    throw new Error(`Invalid edge matte: source=${opaqueCount}, core=${edgeCoreCount}, feather=${featherCount}`);
  }

  // Propagate colors from well inside the silhouette into the new feathered
  // edge. This removes the baked white RGB fringe instead of merely blurring it.
  const nearest = new Int32Array(width * height);
  nearest.fill(-1);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  for (let index = 0; index < width * height; index++) {
    if (colorCore[index] > 127) {
      nearest[index] = index;
      queue[tail++] = index;
    }
  }

  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = Math.floor(index / width);
    const neighbors = [];
    if (x > 0) neighbors.push(index - 1);
    if (x + 1 < width) neighbors.push(index + 1);
    if (y > 0) neighbors.push(index - width);
    if (y + 1 < height) neighbors.push(index + width);

    for (const neighbor of neighbors) {
      if (nearest[neighbor] !== -1) continue;
      nearest[neighbor] = nearest[index];
      queue[tail++] = neighbor;
    }
  }

  const output = Buffer.alloc(width * height * 4);
  for (let index = 0; index < width * height; index++) {
    const source = nearest[index] === -1 ? index : nearest[index];
    output[index * 4] = rgba[source * 4];
    output[index * 4 + 1] = rgba[source * 4 + 1];
    output[index * 4 + 2] = rgba[source * 4 + 2];
    output[index * 4 + 3] = featheredAlpha[index];
  }

  return sharp(output, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

async function frame(file, options = {}) {
  const {
    scale = 1,
    x = 0,
    y = 0,
    rotate = 0,
    flip = false,
    dim = false,
    maxWidth = 174,
    maxHeight = 194,
  } = options;

  let image = sharp(file).trim({ background: { r: 255, g: 255, b: 255, alpha: 0 } });
  if (flip) image = image.flop();
  if (dim) image = image.modulate({ brightness: 0.9, saturation: 0.45 });
  const rotated = await image
    .resize({
      width: Math.max(1, Math.round(Math.min(maxWidth, 164) * scale * supersample)),
      height: Math.max(1, Math.round(Math.min(maxHeight, 162) * scale * supersample)),
      fit: "inside",
      withoutEnlargement: false,
    })
    .rotate(rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const base = await sharp(rotated)
    .resize({
      // Keep every rotated pose inside a shared safe box. The remaining space
      // absorbs the largest animation offsets without clipping ears or feet.
      width: 164 * supersample,
      height: 162 * supersample,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  const meta = await sharp(base).metadata();
  const renderWidth = cellWidth * supersample;
  const renderHeight = cellHeight * supersample;
  const left = Math.round((renderWidth - meta.width) / 2 + x * supersample);
  const top = Math.round((renderHeight - meta.height) / 2 + y * supersample);

  const highResolutionFrame = await sharp({
    create: {
      width: renderWidth,
      height: renderHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: base, left, top }])
    .png()
    .toBuffer();

  const softenedFrame = await rebuildSoftEdge(highResolutionFrame, renderWidth, renderHeight);

  return sharp(softenedFrame)
    .resize({
      width: cellWidth,
      height: cellHeight,
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();
}

const wave = [0, -3, -6, -2, 3, 6, 2, 0];
const breathe = [0, 0.012, 0.022, 0.012, 0, -0.008, -0.012, 0];
const bounce = [0, -5, -11, -16, -11, -5, -2, 0];
const runBounce = [0, -3, -7, -3, 0, -3, -7, -3];

async function buildFrames() {
  const all = [];

  for (let i = 0; i < 8; i++) all.push(await frame(files.idle, { scale: 0.95 + breathe[i], y: -Math.abs(breathe[i] * 80) }));
  for (let i = 0; i < 8; i++) all.push(await frame(files.run, { x: -8 + i * 2.3, y: runBounce[i], rotate: i % 2 ? 1.4 : -1.4, maxHeight: 190 }));
  for (let i = 0; i < 8; i++) all.push(await frame(files.run, { flip: true, x: 8 - i * 2.3, y: runBounce[i], rotate: i % 2 ? -1.4 : 1.4, maxHeight: 190 }));
  for (let i = 0; i < 8; i++) all.push(await frame(files.wave, { rotate: wave[i], y: -2, maxWidth: 184, maxHeight: 198 }));
  for (let i = 0; i < 8; i++) all.push(await frame(files.jump, { scale: 0.96 + (i === 3 || i === 4 ? 0.04 : 0), y: bounce[i], rotate: wave[i] * 0.22 }));
  for (let i = 0; i < 8; i++) all.push(await frame(files.failed, { scale: 0.91, y: 9 + (i % 2), rotate: i % 2 ? -1.1 : 1.1, dim: true }));
  for (let i = 0; i < 8; i++) all.push(await frame(files.idle, { scale: 0.94, x: wave[i] * 0.35, y: -1, rotate: wave[i] * 0.16 }));
  for (let i = 0; i < 8; i++) all.push(await frame(files.run, { x: wave[i] * 0.45, y: runBounce[i], rotate: wave[i] * 0.3, maxHeight: 190 }));
  for (let i = 0; i < 8; i++) all.push(await frame(files.review, { scale: 0.97 + breathe[i] * 0.5, x: wave[i] * 0.18, y: -2, maxWidth: 184, maxHeight: 188 }));

  const lookOffsets = [
    [0, -6], [3, -5], [5, -4], [7, -2], [8, 0], [7, 2], [5, 4], [3, 5],
    [0, 6], [-3, 5], [-5, 4], [-7, 2], [-8, 0], [-7, -2], [-5, -4], [-3, -5],
  ];
  for (const [x, y] of lookOffsets) all.push(await frame(files.idle, { scale: 0.95, x, y }));

  return all;
}

async function validateFrameMargins(frames, minimumMargin = 3) {
  for (let index = 0; index < frames.length; index++) {
    const { data, info } = await sharp(frames[index]).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let minX = info.width;
    let minY = info.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        if (data[(y * info.width + x) * 4 + 3] === 0) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (maxX < 0) throw new Error(`Frame ${index} is empty`);
    const margins = [minX, minY, info.width - 1 - maxX, info.height - 1 - maxY];
    if (Math.min(...margins) < minimumMargin) {
      throw new Error(`Frame ${index} violates the ${minimumMargin}px safe margin: ${margins.join(",")}`);
    }
  }
}

async function main() {
  const frames = await buildFrames();
  await validateFrameMargins(frames);
  const atlasWidth = cellWidth * columns;
  const atlasHeight = cellHeight * rows;
  const atlas = sharp({
    create: {
      width: atlasWidth,
      height: atlasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  const layers = frames.map((input, index) => ({
    input,
    left: (index % columns) * cellWidth,
    top: Math.floor(index / columns) * cellHeight,
  }));

  const png = await atlas.composite(layers).png().toBuffer();
  await sharp(png).webp({ quality: 92, alphaQuality: 100, effort: 6 }).toFile(output);

  const previewLayers = frames.slice(0, 72).map((input, index) => ({
    input,
    left: (index % columns) * cellWidth,
    top: Math.floor(index / columns) * cellHeight,
  }));
  const previewBuffer = await sharp({
    create: {
      width: atlasWidth,
      height: cellHeight * 9,
      channels: 4,
      background: { r: 248, g: 249, b: 252, alpha: 1 },
    },
  }).composite(previewLayers).png().toBuffer();
  await sharp(previewBuffer).toFile(preview);
  await sharp(previewBuffer).toFile(publicPreview);

  async function writePreview(target, background) {
    await sharp({
      create: {
        width: atlasWidth,
        height: cellHeight * 9,
        channels: 4,
        background,
      },
    }).composite(previewLayers).png().toFile(target);
  }

  await writePreview(darkPreview, { r: 24, g: 24, b: 24, alpha: 1 });
  await writePreview(blackPreview, { r: 0, g: 0, b: 0, alpha: 1 });
  await writePreview(bluePreview, { r: 9, g: 31, b: 55, alpha: 1 });
  await writePreview(whitePreview, { r: 255, g: 255, b: 255, alpha: 1 });

  const detailFrames = [frames[0], frames[8], frames[24], frames[64]];
  const detailStrip = await sharp({
    create: {
      width: cellWidth * detailFrames.length,
      height: cellHeight,
      channels: 4,
      background: { r: 9, g: 31, b: 55, alpha: 1 },
    },
  }).composite(detailFrames.map((input, index) => ({ input, left: index * cellWidth, top: 0 }))).png().toBuffer();
  await sharp(detailStrip)
    .resize({ width: cellWidth * detailFrames.length * 4, kernel: sharp.kernel.nearest })
    .png()
    .toFile(edgeDetailPreview);

  console.log(`Wrote ${output}`);
  console.log(`Wrote ${preview}`);
  console.log(`Wrote ${darkPreview}`);
  console.log(`Wrote ${blackPreview}`);
  console.log(`Wrote ${bluePreview}`);
  console.log(`Wrote ${whitePreview}`);
  console.log(`Wrote ${edgeDetailPreview}`);
  console.log(`Wrote ${publicPreview}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
