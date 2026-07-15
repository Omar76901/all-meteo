import sharp from 'sharp';

const jobs = [
  ['public/pwa-192.png', 192],
  ['public/pwa-512.png', 512],
  ['public/pwa-maskable-512.png', 512],
  ['public/apple-touch-icon.png', 180],
];
for (const [out, size] of jobs) {
  await sharp('public/icon.svg').resize(size, size).png().toFile(out);
  console.log('scritto', out);
}
