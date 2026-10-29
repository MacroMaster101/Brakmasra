"use client";

import { useId, useState, type KeyboardEvent } from "react";

import { useLanguage } from "@/components/language-provider";
import { niceMax, seriesTotal, type DayPoint } from "@/lib/dashboard-series";
import { formatDate, formatShortDate } from "@/lib/i18n";

/** Chart colours come from theme tokens, so every chart follows light and dark mode. */
export type ChartTone = "accent" | "success" | "info" | "warning" | "muted";

const PLOT_HEIGHT = 100;
const COLUMN = 10;

/** Daily bars with a hover/keyboard readout and a screen-reader table. */
export function BarChart({ points, title, empty, format, formatAxis = format, tone = "accent", secondary }: {
  points: DayPoint[];
  title: string;
  empty: string;
  format: (value: number) => string;
  /** Shorter labels for the axis, such as "20K". */
  formatAxis?: (value: number) => string;
  tone?: ChartTone;
  secondary?: { points: DayPoint[]; title: string };
}) {
  const { t, lang } = useLanguage();
  const [active, setActive] = useState<number | null>(null);
  const total = seriesTotal(points);
  const max = niceMax(Math.max(0, ...points.map((point) => point.value)));
  // Never zero-wide, so an empty series still draws a valid, empty plot.
  const width = Math.max(1, points.length) * COLUMN;
  const secondaryTotal = seriesTotal(secondary?.points ?? []);
  const secondaryMax = niceMax(Math.max(0, ...(secondary?.points.map(point => point.value) ?? [])));
  const secondaryValues = new Map(secondary?.points.map(point => [point.day, point.value]));
  const secondaryPath = smoothPath(points.map((point, index) => [index * COLUMN + COLUMN / 2, PLOT_HEIGHT - (secondaryValues.get(point.day) ?? 0) / secondaryMax * 92] as const));
  const current = active === null ? null : points[active];
  const ticks = points.length ? [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])] : [];

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
              {secondary && <span>{secondary.title}: {secondaryValues.get(current.day) ?? 0}</span>}
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
            {secondaryTotal > 0 && <path d={secondaryPath} className="cr-secondary-line" />}
          </svg>
          {total === 0 && secondaryTotal === 0 && <p className="cr-chart-empty">{empty}</p>}
        </div>
        <div className="cr-chart-days" aria-hidden="true">
          {ticks.map((index) => <span key={index}>{formatShortDate(points[index].day, lang)}</span>)}
        </div>
        </div>
        {secondary && <div className="cr-secondary-axis" aria-hidden="true"><span>{secondary.title}</span>{secondaryTotal > 0 && <><span>{secondaryMax}</span><span>{secondaryMax / 2}</span><span>0</span></>}</div>}
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {points.map((point) => (
            <tr key={point.day}><th scope="row">{formatDate(point.day, lang)}</th><td>{format(point.value)}</td>{secondary && <td>{secondary.title}: {secondaryValues.get(point.day) ?? 0}</td>}</tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** A small trend line for a stat card. Decorative: the card states the number. */
export function Sparkline({ points, tone = "accent" }: { points: DayPoint[]; tone?: ChartTone }) {
  const gradient = `spark-${useId().replace(/:/g, "")}`;
  if (points.length < 2) return null;
  const max = Math.max(1, ...points.map((point) => point.value));
  const coords = points.map((point, index) => [(index / (points.length - 1)) * 100, 30 - (point.value / max) * 26] as const);
  const line = smoothPath(coords);
  return (
    <svg className="cr-sparkline" data-tone={tone} viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart)" stopOpacity=".38" /><stop offset="100%" stopColor="var(--chart)" stopOpacity=".05" /></linearGradient></defs>
      <path className="cr-sparkline-area" style={{ fill: `url(#${gradient})`, opacity: 1 }} d={`${line} L100 32 L0 32 Z`} />
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

/** Smooth, bounded curves between real daily observations. No extrapolated values. */
function smoothPath(coords: readonly (readonly [number, number])[]) {
  return coords.map(([x, y], index) => { if (!index) return `M${x} ${y}`; const [px, py] = coords[index - 1]; const middle = (px + x) / 2; return `C${middle} ${py} ${middle} ${y} ${x} ${y}`; }).join(" ");
}

/** Area chart with the same accessible daily values and keyboard navigation as the bar chart. */
export function AreaChart({ points, title, empty, format, formatAxis = format, tone = "accent" }: { points: DayPoint[]; title: string; empty: string; format: (value: number) => string; formatAxis?: (value: number) => string; tone?: ChartTone }) {
  const { t, lang } = useLanguage();
  const gradient = useId().replace(/:/g, "");
  const [active, setActive] = useState<number | null>(null);
  const total = seriesTotal(points);
  const max = niceMax(Math.max(0, ...points.map(point => point.value)));
  const coords = points.map((point, index) => [points.length < 2 ? 50 : index / (points.length - 1) * 100, 100 - point.value / max * 92] as const);
  const path = smoothPath(coords);
  const current = active === null ? null : points[active];
  const ticks = points.length ? [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])] : [];
  return <figure className="cr-chart cr-area-chart" data-tone={tone}>
    <figcaption className="sr-only">{`${title}: ${format(total)}`}</figcaption>
    <div className="cr-chart-frame"><div className="cr-chart-axis" aria-hidden="true">{total > 0 && <><span>{formatAxis(max)}</span><span>{formatAxis(max / 2)}</span><span>{formatAxis(0)}</span></>}</div><div className="cr-chart-body"><div className="cr-chart-plot">
      {current && active !== null && <div className="cr-chart-tip" style={{ left: `${Math.min(88, Math.max(12, active / Math.max(1, points.length - 1) * 100))}%` }} aria-hidden="true"><strong>{format(current.value)}</strong><span>{formatDate(current.day, lang)}</span></div>}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" tabIndex={0} aria-label={`${title}. ${t.crChartKeyboardHint}`} onPointerMove={event => { const b = event.currentTarget.getBoundingClientRect(); if (points.length) setActive(Math.min(points.length - 1, Math.max(0, Math.round((event.clientX - b.left) / b.width * (points.length - 1))))); }} onPointerLeave={() => setActive(null)} onBlur={() => setActive(null)} onKeyDown={event => { if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || !points.length) return; event.preventDefault(); setActive(index => event.key === "Home" ? 0 : event.key === "End" ? points.length - 1 : Math.min(points.length - 1, Math.max(0, (index ?? -1) + (event.key === "ArrowRight" ? 1 : -1)))); }}>
        <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart)" stopOpacity=".28" /><stop offset="100%" stopColor="var(--chart)" stopOpacity=".02" /></linearGradient></defs>
        {total > 0 && <><path d={`${path} L100 100 L0 100 Z`} fill={`url(#${gradient})`} /><path d={path} className="cr-area-line" />{active !== null && coords[active] && <line x1={coords[active][0]} y1="0" x2={coords[active][0]} y2="100" className="cr-area-cursor" />}</>}
      </svg>
      {total === 0 && <p className="cr-chart-empty">{empty}</p>}
    </div><div className="cr-chart-days" aria-hidden="true">{ticks.map(index => <span key={index}>{formatShortDate(points[index].day, lang)}</span>)}</div></div></div>
    <table className="sr-only"><caption>{title}</caption><tbody>{points.map(point => <tr key={point.day}><th scope="row">{formatDate(point.day, lang)}</th><td>{format(point.value)}</td></tr>)}</tbody></table>
  </figure>;
}

/** Status totals stay all-time; a zero total is an empty ring, not fabricated segments. */
export function DonutChart({ items, title, empty }: { items: BreakdownItem[]; title: string; empty: string }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const colours: Record<ChartTone, string> = { accent: "var(--chart-accent, var(--accent-bright))", success: "var(--chart-success, var(--success-text))", info: "var(--chart-info, var(--role-blue))", warning: "var(--chart-warning, var(--warning-text))", muted: "var(--text-muted)" };
  let angle = 0;
  const segments = items.filter(item => item.value > 0).map(item => { const start = angle; angle += item.value / total * 360; return `${colours[item.tone]} ${start}deg ${angle}deg`; });
  return <figure className="cr-donut"><figcaption className="sr-only">{title}</figcaption><div className="cr-donut-ring" style={{ background: total ? `conic-gradient(${segments.join(",")})` : "var(--border)" }} aria-hidden="true"><div><strong>{total.toLocaleString("en-US")}</strong><span>{title}</span></div></div>{total === 0 && <p className="cr-donut-empty">{empty}</p>}<ul className="cr-donut-legend">{items.map(item => <li key={item.key}><span style={{ background: colours[item.tone] }} aria-hidden="true" /><span>{item.label}</span><strong>{item.value}</strong><small>{total ? Math.round(item.value / total * 100) : 0}%</small></li>)}</ul></figure>;
}
