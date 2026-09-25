"use client";

import { useState } from "react";

/**
 * A member's initials with their photo laid over the top. If the photo fails
 * to load (a removed file, a blocked host) the initials simply show through.
 */
export function AvatarPhoto({ src, initials, className }: { src: string | null; initials: string; className: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const showPhoto = Boolean(src) && failed !== src;

  return (
    <span className={`${className} avatar-photo-frame`} aria-hidden="true">
      {initials}
      {showPhoto && (
        // eslint-disable-next-line @next/next/no-img-element -- remote and blob photos; next/image allows no remote hosts here.
        <img
          className="avatar-photo"
          src={src!}
          alt=""
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(src)}
        />
      )}
    </span>
  );
}
