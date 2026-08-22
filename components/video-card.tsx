import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import type { ChannelVideo } from "@/data/channel";

export function VideoCard({ video, vertical = false }: { video: ChannelVideo; vertical?: boolean }) {
  return (
    <article className={`video-card ${vertical ? "vertical" : ""}`}>
      <Link href={`/videos/${video.id}`} className="video-thumb" aria-label={`Watch ${video.title}`}>
        <Image src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt="" width={640} height={360} sizes="(max-width: 720px) 86vw, 31vw" />
        <span className="play"><Play fill="currentColor" /></span>
        {video.duration && <span className="duration">{video.duration}</span>}
      </Link>
      <div className="video-copy">
        <h3><Link href={`/videos/${video.id}`}>{video.title}</Link></h3>
        <p>{video.views}<span aria-hidden="true"> · </span>{video.published}</p>
      </div>
    </article>
  );
}
