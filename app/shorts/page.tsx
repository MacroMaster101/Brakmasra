import type { Metadata } from "next";
import { VideoCard } from "@/components/video-card";
import { shorts } from "@/data/channel";

export const metadata: Metadata = { title: "Shorts", description: "Brief encounters from BRAKMASRA." };
export default function ShortsPage() { return <div className="page-shell page-top"><header className="page-hero"><span className="eyebrow">Brief encounters</span><h1>Shorts</h1><p>Vertical fragments and short-form investigations from the official channel.</p></header>{shorts.length ? <div className="shorts-grid">{shorts.map((video) => <VideoCard key={video.id} video={video} vertical />)}</div> : <div className="empty-state"><h2>No verified shorts yet</h2><p>Shorts will appear here when returned by the YouTube integration.</p></div>}</div>; }
