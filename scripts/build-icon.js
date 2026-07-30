'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const size = 512;

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function insideRoundedSquare(x, y, inset, radius) {
  const left = inset;
  const top = inset;
  const right = size - inset;
  const bottom = size - inset;
  const centerX = Math.min(Math.max(x, left + radius), right - radius);
  const centerY = Math.min(Math.max(y, top + radius), bottom - radius);
  return Math.hypot(x - centerX, y - centerY) <= radius;
}

function insidePolygon(x, y, points) {
  let inside = false;
  for (let current = 0, previous = points.length - 1; current < points.length; previous = current, current += 1) {
    const [currentX, currentY] = points[current];
    const [previousX, previousY] = points[previous];
    const intersects = (currentY > y) !== (previousY > y)
      && x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pixelColor(x, y) {
  if (!insideRoundedSquare(x, y, 24, 118)) {
    return [0, 0, 0, 0];
  }

  const blend = (x + y) / (size * 2);
  let red = Math.round(158 - blend * 95);
  let green = Math.round(132 - blend * 92);
  let blue = Math.round(255 - blend * 76);

  const wing = [
    [82, 305], [146, 286], [219, 209], [256, 151],
    [293, 209], [366, 286], [430, 305], [338, 311],
    [277, 278], [256, 267], [235, 278], [174, 311]
  ];
  if (insidePolygon(x, y, wing)) {
    red = 224;
    green = 216;
    blue = 255;
  }

  const leftStem = [[254, 145], [159, 361], [220, 361], [277, 204]];
  const rightStem = [[258, 145], [353, 361], [292, 361], [235, 204]];
  const crossbar = [[210, 283], [302, 283], [318, 323], [194, 323]];
  if (
    insidePolygon(x, y, leftStem)
    || insidePolygon(x, y, rightStem)
    || insidePolygon(x, y, crossbar)
  ) {
    red = 20;
    green = 18;
    blue = 38;
  }

  return [red, green, blue, 255];
}

const scanlines = Buffer.alloc((size * 4 + 1) * size);
for (let y = 0; y < size; y += 1) {
  const rowStart = y * (size * 4 + 1);
  scanlines[rowStart] = 0;
  for (let x = 0; x < size; x += 1) {
    const offset = rowStart + 1 + x * 4;
    const color = pixelColor(x + 0.5, y + 0.5);
    scanlines.set(color, offset);
  }
}

const header = Buffer.alloc(13);
header.writeUInt32BE(size, 0);
header.writeUInt32BE(size, 4);
header[8] = 8;
header[9] = 6;

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', header),
  chunk('IDAT', zlib.deflateSync(scanlines, { level: 9 })),
  chunk('IEND', Buffer.alloc(0))
]);

const outputPath = path.join(__dirname, '..', 'assets', 'icon.png');
fs.writeFileSync(outputPath, png);
console.log(`Created ${outputPath}`);
