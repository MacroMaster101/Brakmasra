"use client";
import Image, { getImageProps as nextImageProps, type ImageProps } from "next/image";
import { useContentImage } from "@/components/content-provider";
import { highResolutionImage } from "@/lib/image-quality";

function photographicProps(props: ImageProps): ImageProps {
  const src = typeof props.src === "string" ? highResolutionImage(props.src) : props.src;
  return { ...props, src, unoptimized: props.unoptimized || (typeof src === "string" && src.startsWith("https://")), quality: src !== props.src ? 95 : props.quality };
}

/** Keep responsive delivery, including quality masters and transparent campaign edits. */
export default function StoreImage(props: ImageProps) {
  const replacement = useContentImage(typeof props.src === "string" ? props.src : "");
  return <Image {...photographicProps({ ...props, src: replacement || props.src })} alt={props.alt} />;
}

export function getImageProps(props: ImageProps) {
  return nextImageProps(photographicProps(props));
}
