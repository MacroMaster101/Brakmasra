import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const scanned = ["app", "components", "lib", "data", "next.config.ts", ".env.example"];
// googleapis is broader than YouTube (it was the Data API host); revisit if a Google Maps/Fonts host is ever added.
const banned = /youtube|youtu\.be|ytimg|yt3\.|ggpht|googleapis|["'`]\/(videos|shorts|playlists)\b/i;

function walk(path: string): string[] {
  const full = join(root, path);
  if (!existsSync(full)) return [];
  if (statSync(full).isFile()) return [path.split(sep).join("/")];
  return readdirSync(full).flatMap((name) => walk(join(path, name)));
}

describe("store-only site", () => {
  it("has no YouTube integration or video links left in source", () => {
    // data/legal.ts names YouTube as a third-party site in the terms; it is copy, not an integration.
    const allowed = new Set(["app/about/page.tsx", "components/footer.tsx", "data/legal.ts"]);
    const offenders = scanned
      .flatMap(walk)
      .filter((file) => !allowed.has(file) && banned.test(readFileSync(join(root, file), "utf8")));
    expect(offenders).toEqual([]);
  });

  it.each([
    "app/videos",
    "app/shorts",
    "app/playlists",
    "app/api/youtube",
    "lib/youtube.ts",
    "data/channel.ts",
    "components/video-card.tsx",
    "components/video-search.tsx",
  ])("has removed %s", (path) => {
    expect(existsSync(join(root, path))).toBe(false);
  });
});
