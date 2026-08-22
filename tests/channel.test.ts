import { describe, expect, it } from "vitest";
import { channel, videos } from "@/data/channel";

describe("verified channel snapshot", () => {
  it("uses the canonical public channel", () => {
    expect(channel.handle).toBe("@Brakmasra");
    expect(channel.id).toBe("UCJS5mX07b98qeG4Lhqa12XQ");
  });

  it("contains unique real video IDs", () => {
    expect(new Set(videos.map((video) => video.id)).size).toBe(videos.length);
    expect(videos).toHaveLength(12);
  });
});
