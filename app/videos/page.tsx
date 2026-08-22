import type { Metadata } from "next";
import { VideoSearch } from "@/components/video-search";
import { getYouTubeData } from "@/lib/youtube";

export const metadata: Metadata = { title: "Videos", description: "Browse BRAKMASRA paranormal investigations, mysterious road trips, and haunted explorations." };
export default async function VideosPage() { const { videos } = await getYouTubeData(); return <div className="page-shell page-top"><header className="page-hero"><span className="eyebrow">The archive</span><h1>Videos</h1><p>Investigations, journeys, and encounters from the official BRAKMASRA channel.</p></header><VideoSearch videos={videos} /></div>; }
