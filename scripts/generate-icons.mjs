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
