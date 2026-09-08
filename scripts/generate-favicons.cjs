// Run with NODE_PATH pointing to a local installation of sharp.
// The SVG is the editable source; raster/ICO files are generated derivatives.
const sharp = require("sharp");
const fs = require("node:fs/promises");
const path = require("node:path");
const dir = path.join(__dirname, "../public");
(async () => {
  const source = path.join(dir, "favicon-moon-v3.svg");
  const frames = [];
  for (const size of [16, 32, 48]) {
    const png = await sharp(source).resize(size, size).png().toBuffer();
    frames.push({ size, png });
    if (size !== 48)
      await fs.writeFile(path.join(dir, `favicon-moon-v3-${size}.png`), png);
  }
  await sharp(source)
    .resize(180, 180)
    .png()
    .toFile(path.join(dir, "apple-touch-moon-v3.png"));
  const header = Buffer.alloc(6 + frames.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  let offset = header.length;
  frames.forEach(({ size, png }, index) => {
    const start = 6 + index * 16;
    header[start] = header[start + 1] = size;
    header.writeUInt16LE(1, start + 4);
    header.writeUInt16LE(32, start + 6);
    header.writeUInt32LE(png.length, start + 8);
    header.writeUInt32LE(offset, start + 12);
    offset += png.length;
  });
  await fs.writeFile(
    path.join(dir, "favicon.ico"),
    Buffer.concat([header, ...frames.map((frame) => frame.png)]),
  );
})();
