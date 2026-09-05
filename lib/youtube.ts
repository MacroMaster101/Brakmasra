import { unstable_cache } from "next/cache";
import { rateLimit } from "@/lib/rate-limit";
import { channel as fallbackChannel, videos as fallbackVideos, type ChannelVideo } from "@/data/channel";

type YouTubeData = { channel: typeof fallbackChannel; videos: ChannelVideo[]; source: "api" | "snapshot" };

/**
 * Upstream quota guard.
 *
 * The YouTube Data API grants 10,000 units/day by default. One refresh costs
 * 3 units (channels.list + playlistItems.list + videos.list) and results are
 * cached for an hour, so normal operation uses ~72 units/day. This guard is the
 * hard ceiling that stops a cache stampede or a redeploy loop from ever burning
 * the daily allowance: once the budget is spent, or after an upstream failure,
 * the verified snapshot is served instead of calling Google.
 *
 * The daily budget is counted in PostgreSQL via lib/rate-limit.ts, so every
 * server instance shares one allowance. The failure cooldown stays process-local
 * on purpose — it is a cheap fast-path that avoids a database round trip while a
 * known-bad key or an exhausted quota is backing off.
 */
const DAILY_CALL_BUDGET = Math.max(3, Number(process.env.YOUTUBE_DAILY_CALL_BUDGET) || 200);
const FAILURE_COOLDOWN_MS = 15 * 60_000;
const REVALIDATE_SECONDS = Math.max(300, Number(process.env.YOUTUBE_REVALIDATE_SECONDS) || 3600);
const UNITS_PER_REFRESH = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

const quota = { pausedUntil: 0 };

function utcDay() {
  return new Date().toISOString().slice(0, 10);
}

/** True when a refresh is allowed right now, against the shared daily budget. */
async function canCallUpstream() {
  if (Date.now() < quota.pausedUntil) return false;
  const maxRefreshes = Math.max(1, Math.floor(DAILY_CALL_BUDGET / UNITS_PER_REFRESH));
  const { allowed } = await rateLimit(`youtube:upstream:${utcDay()}`, maxRefreshes, DAY_MS);
  return allowed;
}

/** Back off after a failure so a bad key or an exhausted quota is not hammered. */
function pauseAfterFailure() {
  quota.pausedUntil = Date.now() + FAILURE_COOLDOWN_MS;
}

/** `PT24M55S` -> `24:55`, `PT1H2M3S` -> `1:02:03`. */
function formatDuration(iso: string | undefined): string {
  if (!iso) return "";
  const match = /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return "";
  const days = Number(match[1] || 0);
  const hours = Number(match[2] || 0) + days * 24;
  const minutes = Number(match[3] || 0);
  const seconds = Number(match[4] || 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** 1300 -> `1.3K views`, matching the verified snapshot's formatting. */
function formatViews(raw: string | undefined): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return "";
  const trim = (v: number) => v.toFixed(1).replace(/\.0$/, "");
  if (n >= 1_000_000) return `${trim(n / 1_000_000)}M views`;
  if (n >= 1_000) return `${trim(n / 1_000)}K views`;
  return `${n} views`;
}

const snapshot = (): YouTubeData => ({ channel: fallbackChannel, videos: fallbackVideos, source: "snapshot" });

const fetchLive = unstable_cache(async (): Promise<YouTubeData> => {
  const key = process.env.YOUTUBE_API_KEY;
  const id = process.env.YOUTUBE_CHANNEL_ID || fallbackChannel.id;
  if (!key) return snapshot();
  if (!(await canCallUpstream())) return snapshot();

  try {
    const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
    channelUrl.search = new URLSearchParams({ part: "snippet,statistics,contentDetails", id, key }).toString();
    const channelResponse = await fetch(channelUrl, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!channelResponse.ok) throw new Error("YouTube channel request failed");
    const payload = await channelResponse.json();
    const item = payload.items?.[0];
    if (!item) throw new Error("YouTube channel not found");

    const playlistId = item.contentDetails.relatedPlaylists.uploads;
    const uploadsUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    uploadsUrl.search = new URLSearchParams({ part: "snippet,contentDetails", playlistId, maxResults: "24", key }).toString();
    const uploadsResponse = await fetch(uploadsUrl, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!uploadsResponse.ok) throw new Error("YouTube uploads request failed");
    const uploads = await uploadsResponse.json();
    const mapped: ChannelVideo[] = (uploads.items || []).map((video: { contentDetails: { videoId: string }; snippet: { title: string; publishedAt: string } }) => ({
      id: video.contentDetails.videoId,
      title: video.snippet.title,
      views: "",
      published: new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(video.snippet.publishedAt)),
      duration: "",
    }));

    // playlistItems returns neither duration nor view count, so enrich from
    // videos.list. One extra unit per refresh (ids are batched into one call).
    if (mapped.length) {
      const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      detailsUrl.search = new URLSearchParams({
        part: "contentDetails,statistics",
        id: mapped.slice(0, 50).map((video) => video.id).join(","),
        key,
      }).toString();
      const detailsResponse = await fetch(detailsUrl, { next: { revalidate: REVALIDATE_SECONDS } });
      if (!detailsResponse.ok) throw new Error("YouTube video details request failed");
      const details = await detailsResponse.json();
      const byId = new Map<string, { duration: string; views: string }>(
        (details.items || []).map((video: { id: string; contentDetails?: { duration?: string }; statistics?: { viewCount?: string } }) => [
          video.id,
          { duration: formatDuration(video.contentDetails?.duration), views: formatViews(video.statistics?.viewCount) },
        ]),
      );
      for (const video of mapped) {
        const extra = byId.get(video.id);
        if (extra) {
          video.duration = extra.duration;
          video.views = extra.views;
        }
      }
    }
    return {
      channel: {
        ...fallbackChannel,
        // description intentionally NOT taken from the API: the live one is the
        // full YouTube blurb (hashtags, handles, Sinhala copy) and is far too
        // long for the hero. Edit the curated copy in data/channel.ts instead.
        name: item.snippet.title.trim(),
        avatar: item.snippet.thumbnails.high?.url || fallbackChannel.avatar,
        subscribers: item.statistics.hiddenSubscriberCount ? "Hidden" : Number(item.statistics.subscriberCount).toLocaleString("en"),
        videoCount: Number(item.statistics.videoCount).toLocaleString("en"),
        totalViews: Number(item.statistics.viewCount).toLocaleString("en"),
      },
      videos: mapped.length ? mapped : fallbackVideos,
      source: "api",
    };
  } catch {
    pauseAfterFailure();
    return snapshot();
  }
}, ["brakmasra-youtube"], { revalidate: REVALIDATE_SECONDS, tags: ["youtube"] });

export const getYouTubeData = fetchLive;

