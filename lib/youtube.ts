import { unstable_cache } from "next/cache";
import { channel as fallbackChannel, videos as fallbackVideos, type ChannelVideo } from "@/data/channel";

type YouTubeData = { channel: typeof fallbackChannel; videos: ChannelVideo[]; source: "api" | "snapshot" };

const fetchLive = unstable_cache(async (): Promise<YouTubeData> => {
  const key = process.env.YOUTUBE_API_KEY;
  const id = process.env.YOUTUBE_CHANNEL_ID || fallbackChannel.id;
  if (!key) return { channel: fallbackChannel, videos: fallbackVideos, source: "snapshot" };

  try {
    const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
    channelUrl.search = new URLSearchParams({ part: "snippet,statistics,contentDetails", id, key }).toString();
    const channelResponse = await fetch(channelUrl, { next: { revalidate: 3600 } });
    if (!channelResponse.ok) throw new Error("YouTube channel request failed");
    const payload = await channelResponse.json();
    const item = payload.items?.[0];
    if (!item) throw new Error("YouTube channel not found");

    const playlistId = item.contentDetails.relatedPlaylists.uploads;
    const uploadsUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    uploadsUrl.search = new URLSearchParams({ part: "snippet,contentDetails", playlistId, maxResults: "24", key }).toString();
    const uploadsResponse = await fetch(uploadsUrl, { next: { revalidate: 3600 } });
    if (!uploadsResponse.ok) throw new Error("YouTube uploads request failed");
    const uploads = await uploadsResponse.json();
    const mapped: ChannelVideo[] = (uploads.items || []).map((video: { contentDetails: { videoId: string }; snippet: { title: string; publishedAt: string } }) => ({
      id: video.contentDetails.videoId,
      title: video.snippet.title,
      views: "View on YouTube",
      published: new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(video.snippet.publishedAt)),
      duration: "",
    }));

    return {
      channel: {
        ...fallbackChannel,
        name: item.snippet.title,
        description: item.snippet.description,
        avatar: item.snippet.thumbnails.high?.url || fallbackChannel.avatar,
        subscribers: item.statistics.hiddenSubscriberCount ? "Hidden" : Number(item.statistics.subscriberCount).toLocaleString("en"),
        videoCount: Number(item.statistics.videoCount).toLocaleString("en"),
        totalViews: Number(item.statistics.viewCount).toLocaleString("en"),
      },
      videos: mapped.length ? mapped : fallbackVideos,
      source: "api",
    };
  } catch {
    return { channel: fallbackChannel, videos: fallbackVideos, source: "snapshot" };
  }
}, ["brakmasra-youtube"], { revalidate: 3600, tags: ["youtube"] });

export const getYouTubeData = fetchLive;
