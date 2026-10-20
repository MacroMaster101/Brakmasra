"use client";

import { useState, type KeyboardEvent } from "react";

import { useLanguage } from "@/components/language-provider";
import { niceMax, seriesTotal, type DayPoint } from "@/lib/dashboard-series";
import { formatDate, formatShortDate } from "@/lib/i18n";

/** Chart colours come from theme tokens, so every chart follows light and dark mode. */
export type ChartTone = "accent" | "success" | "info" | "warning" | "muted";

const PLOT_HEIGHT = 100;
const COLUMN = 10;

/** Daily bars with a hover/keyboard readout and a screen-reader table. */
export function BarChart({ points, title, empty, format, formatAxis = format, tone = "accent" }: {
  points: DayPoint[];
  title: string;
  empty: string;
  format: (value: number) => string;
  /** Shorter labels for the axis, such as "20K". */
  formatAxis?: (value: number) => string;
  tone?: ChartTone;
}) {
  const { t, lang } = useLanguage();
  const [active, setActive] = useState<number | null>(null);
  const total = seriesTotal(points);
  const max = niceMax(Math.max(0, ...points.map((point) => point.value)));
  const width = points.length * COLUMN;
  const current = active === null ? null : points[active];
  const ticks = [0, Math.floor((points.length - 1) / 2), points.length - 1];

  const move = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowLeft" ? -1 : 1;
    setActive((index) => Math.min(points.length - 1, Math.max(0, (index ?? (step > 0 ? -1 : points.length)) + step)));
  };

  return (
    <figure className="cr-chart" data-tone={tone}>
      <figcaption className="sr-only">{`${title}: ${format(total)}`}</figcaption>
      <div className="cr-chart-frame">
        {/* An empty chart has no scale worth reading, only its message. */}
        <div className="cr-chart-axis" aria-hidden="true">
          {total > 0 && <><span>{formatAxis(max)}</span><span>{formatAxis(max / 2)}</span><span>{formatAxis(0)}</span></>}
        </div>
        <div className="cr-chart-body">
        <div className="cr-chart-plot">
          {current && active !== null && (
            <div className="cr-chart-tip" style={{ left: `${((active + 0.5) / points.length) * 100}%` }} aria-hidden="true">
              <strong>{format(current.value)}</strong>
              <span>{formatDate(current.day, lang)}</span>
            </div>
          )}
          <svg
            viewBox={`0 0 ${width} ${PLOT_HEIGHT}`}
            preserveAspectRatio="none"
            tabIndex={0}
            aria-label={`${title}. ${t.crChartKeyboardHint}`}
            onKeyDown={move}
            onBlur={() => setActive(null)}
            onPointerLeave={() => setActive(null)}
          >
            {points.map((point, index) => {
              const height = point.value > 0 ? Math.max(2, (point.value / max) * PLOT_HEIGHT) : 0;
              return (
                <g key={point.day} onPointerEnter={() => setActive(index)}>
                  <rect className="cr-chart-hit" x={index * COLUMN} y={0} width={COLUMN} height={PLOT_HEIGHT} />
                  <rect
                    className={`cr-chart-bar${active === index ? " is-active" : ""}`}
                    x={index * COLUMN + 1.5}
                    y={PLOT_HEIGHT - height}
                    width={COLUMN - 3}
                    height={height}
                    rx={1.5}
                  />
                </g>
              );
            })}
          </svg>
          {total === 0 && <p className="cr-chart-empty">{empty}</p>}
        </div>
        <div className="cr-chart-days" aria-hidden="true">
          {ticks.map((index) => <span key={index}>{formatShortDate(points[index].day, lang)}</span>)}
        </div>
        </div>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {points.map((point) => (
            <tr key={point.day}><th scope="row">{formatDate(point.day, lang)}</th><td>{format(point.value)}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** A small trend line for a stat card. Decorative: the card states the number. */
export function Sparkline({ points, tone = "accent" }: { points: DayPoint[]; tone?: ChartTone }) {
  if (points.length < 2) return null;
  const max = Math.max(1, ...points.map((point) => point.value));
  const coords = points.map((point, index) => [(index / (points.length - 1)) * 100, 30 - (point.value / max) * 26] as const);
  const line = coords.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  return (
    <svg className="cr-sparkline" data-tone={tone} viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path className="cr-sparkline-area" d={`${line} L100 32 L0 32 Z`} />
      <path className="cr-sparkline-line" d={line} />
    </svg>
  );
}

export type BreakdownItem = { key: string; label: string; value: number; tone: ChartTone };

/** One stacked bar with a legend; shares of a whole, such as orders by status. */
export function Breakdown({ items, empty }: { items: BreakdownItem[]; empty: string }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const share = (value: number) => (total === 0 ? 0 : Math.round((value / total) * 100));

  return (
    <div className="cr-breakdown">
      <div className={`cr-breakdown-bar${total === 0 ? " is-empty" : ""}`} aria-hidden="true">
        {items.filter((item) => item.value > 0).map((item) => (
          <span key={item.key} data-tone={item.tone} style={{ flexGrow: item.value }} />
        ))}
      </div>
      {total === 0 && <p className="cr-chart-empty is-static">{empty}</p>}
      <ul className="cr-breakdown-legend">
        {items.map((item) => (
          <li key={item.key} data-tone={item.tone}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{share(item.value)}%</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
