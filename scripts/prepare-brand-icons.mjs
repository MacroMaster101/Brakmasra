import sharp from "sharp";
import { readFile } from "node:fs/promises";

// Keep the favicon, installed-app icons and Apple touch icon on one monogram.
const icon = await readFile(new URL("../app/icon.svg", import.meta.url));
for (const size of [192, 512]) {
  await sharp(icon)
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`);
}
await sharp(icon)
  .resize(180, 180)
  .flatten({ background: "#ffffff" })
  .png()
  .toFile("app/apple-icon.png");
