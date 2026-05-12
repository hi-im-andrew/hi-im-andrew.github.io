import sharp from 'sharp';
import { resolve, dirname, basename, extname } from 'path';

const files = process.argv.slice(2);

if (!files.length) {
  console.error('Usage: node scripts/thumb.js <image> [image2 ...]');
  process.exit(1);
}

for (const f of files) {
  const input = resolve(f);
  const base  = basename(f, extname(f));
  const out   = resolve(dirname(input), `${base}-thumb.webp`);
  await sharp(input)
    .resize({ width: 600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(out);
  console.log(`→ ${out}`);
}
