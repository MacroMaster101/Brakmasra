import type { Metadata } from "next";
import { Layers3 } from "lucide-react";
export const metadata: Metadata = { title: "Playlists", description: "Curated BRAKMASRA investigations and stories." };
export default function PlaylistsPage() { return <div className="page-shell page-top"><header className="page-hero"><span className="eyebrow">Curated investigations</span><h1>Playlists</h1><p>Curated collections of connected encounters from the channel.</p></header><div className="empty-state"><Layers3 /><h2>No playlists published</h2><p>Playlists will appear here once they are published on the channel.</p></div></div>; }
