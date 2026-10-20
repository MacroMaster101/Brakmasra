import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

// Resolution exports only: preserve artwork, framing, colour and transparency.
// These are upscaled 4K masters, not newly captured native 4K photographs.
const root = process.cwd();
const sources = new Map();
// Local generation manifests are optional and intentionally excluded from Git.
const read = (file) => fs.existsSync(path.join(root, file))
  ? JSON.parse(fs.readFileSync(path.join(root, file), "utf8")) : null;
const normalize = (value) => value.replaceAll("\\", "/").replace(/\/{2,}/g, "/");
const originalAssets = read("design/image-generation.json")?.assets ?? [];
for (const asset of originalAssets) {
  const target = normalize(asset.output);
  const index = target.indexOf("/public/images/");
  if (index >= 0) sources.set(target.slice(index + 1), normalize(asset.source));
}
const feature = read("design/journal-feature-image-generation.json");
const generatedDirectory = feature?.source ? path.dirname(feature.source) : null;
for (const image of read("design/about-image-generation.json")?.images ?? []) {
  if (generatedDirectory) sources.set(`public/images/about/${image.asset}`, path.join(generatedDirectory, image.source));
}
for (const file of ["design/journal-image-generation.json", "design/journal-feature-image-generation.json"]) {
  const asset = read(file);
  if (asset) sources.set(asset.asset, asset.source);
}
const directories = ["models", "products", "about", "journal"];
const inputs = directories.flatMap((directory) => fs.readdirSync(path.join(root, "public/images", directory))
  .filter((file) => /\.webp$/.test(file))
  .map((file) => `public/images/${directory}/${file}`));
inputs.push("public/images/auth/members-medusa-cutout.webp", "public/images/auth/members-paradise-cutout.webp",
  "public/images/brakmasra-hero.png");
// Preserve legacy campaign URLs saved by the page editor, using alpha cutouts.
const mapping = Object.fromEntries(["wide", "black", "white"].map((key) => [
  `/images/campaign-${key}-4k.webp`, `/images/campaign/${key}-cutout.webp`,
]));
const report = [];
sharp.concurrency(2);
for (const relative of inputs) {
  const original = path.join(root, relative);
  const originalMeta = await sharp(original).metadata();
  let source = sources.get(relative);
  if (!source || !fs.existsSync(source)) source = original;
  let native = await sharp(source).metadata();
  // A later crop or alpha edit must not be replaced by an earlier generation.
  if (Math.abs(native.width / native.height - originalMeta.width / originalMeta.height) > .01) {
    source = original;
    native = originalMeta;
  }
  const url = `/${relative.slice("public/".length)}`;
  const outputRelative = relative.replace("public/images/", "public/images/quality/").replace(/\.[^.]+$/, "-4k.webp");
  const output = path.join(root, outputRelative);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const result = await sharp(source).rotate().resize({ width: 3840, height: 3840, fit: "inside", kernel: "lanczos3" })
    .webp({ quality: 95, effort: 5 }).toFile(output);
  mapping[url] = `/${outputRelative.slice("public/".length)}`;
  report.push({ original: relative, sourceWidth: native.width, sourceHeight: native.height,
    output: outputRelative, width: result.width, height: result.height, bytes: result.size,
    upscaled: Math.max(native.width, native.height) < 3840 });
}
fs.writeFileSync(path.join(root, "data/image-masters.json"), JSON.stringify(mapping, null, 2) + "\n");
fs.mkdirSync(path.join(root, "design"), { recursive: true });
fs.writeFileSync(path.join(root, "design/image-quality-exports.json"), JSON.stringify({
  method: "4K long edge (3840px), aspect ratio preserved, Lanczos3 resampling, WebP quality 95; original assets retained.",
  note: "Upscaled delivery exports do not add native source detail. Campaign hero URLs resolve to native-resolution transparent edits; those assets are not upscaled here.",
  images: report,
}, null, 2) + "\n");
console.log(JSON.stringify({ count: report.length, bytes: report.reduce((sum, image) => sum + image.bytes, 0), dimensionsVerified: report.every((image) => Math.max(image.width, image.height) === 3840) }));
