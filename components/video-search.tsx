"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { VideoCard } from "@/components/video-card";
import type { ChannelVideo } from "@/data/channel";

export function VideoSearch({ videos }: { videos: ChannelVideo[] }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => videos.filter((video) => video.title.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim())), [query, videos]);
  return (
    <div id="search">
      <label className="search-field"><Search /><span className="sr-only">Search videos</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the archive…" /></label>
      <p className="result-count" aria-live="polite">{results.length} {results.length === 1 ? "story" : "stories"}</p>
      {results.length ? <div className="card-grid">{results.map((video) => <VideoCard video={video} key={video.id} />)}</div> : <div className="empty-state"><h2>Nothing emerged</h2><p>Try another word or clear your search.</p></div>}
    </div>
  );
}
