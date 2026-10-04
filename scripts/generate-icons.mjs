import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

const jobs = [
  ['public/pwa-192.png', 192],
  ['public/pwa-512.png', 512],
  ['public/apple-touch-icon.png', 180],
];
for (const [out, size] of jobs) {
  await sharp('public/icon.svg').resize(size, size).png().toFile(out);
  console.log('scritto', out);
}

// Generate maskable icon with special sizing - artwork within 80% safe zone on opaque background
const inner = await sharp('public/icon.svg').resize(410, 410).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#0b1120' } })
  .composite([{ input: inner, gravity: 'centre' }])
  .png()
  .toFile('public/pwa-maskable-512.png');
console.log('scritto public/pwa-maskable-512.png');

// favicon.ico multi-risoluzione dalla versione semplificata: ICO con PNG incorporati
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map(s => sharp('public/favicon.svg').resize(s, s).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);            // riservato
header.writeUInt16LE(1, 2);            // tipo: icona
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(s, e);             // larghezza
  header.writeUInt8(s, e + 1);         // altezza
  header.writeUInt16LE(1, e + 4);      // piani colore
  header.writeUInt16LE(32, e + 6);     // bit per pixel
  header.writeUInt32LE(pngs[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += pngs[i].length;
});
writeFileSync('public/favicon.ico', Buffer.concat([header, ...pngs]));
console.log('scritto public/favicon.ico');
