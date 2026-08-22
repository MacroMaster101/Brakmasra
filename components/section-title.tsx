import { Ornament } from "@/components/icons";

export function SectionTitle({ eyebrow, title, copy }: { eyebrow?: string; title: string; copy?: string }) {
  return (
    <div className="section-heading">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      <Ornament className="heading-ornament" />
      {copy && <p>{copy}</p>}
    </div>
  );
}
