import sharp from "sharp";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const manifest = JSON.parse(
  await readFile(
    new URL("../design/image-generation.json", import.meta.url),
    "utf8",
  ),
);
const root = path.resolve("public/images");
await mkdir(path.join(root, "models"), { recursive: true });
const selected = new Set(process.argv.slice(2));
for (const asset of manifest.assets) {
  if (selected.size && !selected.has(asset.name)) continue;
  if (!asset.source) continue;
  const campaign = asset.name.startsWith("campaign");
  const highResolution = asset.name.endsWith("-4k");
  const target = path.join(
    root,
    campaign ? `${asset.name}.webp` : `models/${asset.name}.webp`,
  );
  await sharp(asset.source)
    .resize({
      width: highResolution ? 3840 : campaign ? 1920 : 900,
      height: highResolution ? 2160 : undefined,
      fit: "fill",
      withoutEnlargement: !highResolution,
      kernel: "lanczos3",
    })
    .webp({ quality: highResolution ? 96 : 85 })
    .toFile(target);
  console.log(`${asset.name}: ${target}`);
}
await writeFile(
  path.join(root, "models", "README.md"),
  "Generated with the built-in image generation tool. Prompts and source references are recorded in design/image-generation.json. Original product photos remain in ../products/.\n",
);
