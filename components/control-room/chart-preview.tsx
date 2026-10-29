"use client";
import { useRef, useState } from "react";
import { ChartNoAxesCombined, X } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { Sparkline, BarChart, DonutChart } from "@/components/control-room/charts";
import { recentDays } from "@/lib/dashboard-series";

/** Opt-in visual samples, separated from live analytics and never written to the store. */
export function ChartPreview() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const values = [12, 20, 8, 34, 17, 27, 40];
  const days = recentDays(7, new Date("2026-10-23T06:00:00Z"));
  const sample = days.map((day, index) => ({ day, value: values[index] }));
  const samples = [values.map(value => value * 500), values, [7,12,5,20,10,16,22], [2,3,1,4,3,5,6]].map(values => days.map((day, index) => ({day, value: values[index]})));
  return <><button ref={trigger} type="button" className="cr-chart-preview-trigger" onClick={() => { setOpen(true); dialog.current?.showModal(); }}><ChartNoAxesCombined size={16} />{t.crPreviewCharts}</button><dialog ref={dialog} className="cr-chart-preview" aria-labelledby="chart-preview-title" onClose={() => { setOpen(false); trigger.current?.focus(); }} onClick={event => { if (event.target !== event.currentTarget) return; const b = event.currentTarget.getBoundingClientRect(); if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) dialog.current?.close(); }}><header><div><h2 id="chart-preview-title">{t.crPreviewCharts}</h2><p>{t.crChartPreviewNotice}</p></div><button className="dashboard-icon" type="button" aria-label={t.crClosePanel} onClick={() => dialog.current?.close()}><X size={20} /></button></header>{open && <div className="cr-chart-preview-body"><div className="cr-preview-sparks">{(["revenue", "orders", "subscribers", "messages"] as const).map((key, index) => <div className={`cr-kpi cr-kpi-${key}`} key={key}><span>{[t.crKpiRevenue, t.crChartOrdersTitle, t.crStatActiveSubscribers, t.crStatNewMessages][index]}</span><strong>{index === 0 ? `LKR ${samples[0].reduce((sum, point) => sum + point.value, 0).toLocaleString("en-US")}` : samples[index].reduce((sum, point) => sum + point.value, 0)}</strong><Sparkline points={samples[index]} /></div>)}</div><section className="panel cr-panel"><h3>{t.crChartRevenueTitle}</h3><BarChart points={sample.map(point => ({ ...point, value: point.value * 500 }))} secondary={{ points: sample, title: t.crChartOrdersTitle }} title={t.crChartRevenueTitle} empty="" format={value => `LKR ${value.toLocaleString("en-US")}`} /></section><section className="panel cr-panel"><h3>{t.crChartStatusTitle}</h3><DonutChart title={t.crChartStatusTitle} empty="" items={[{key:"paid",label:t.accountOrderStatusPaid,value:42,tone:"success"},{key:"fulfilled",label:t.accountOrderStatusFulfilled,value:78,tone:"info"},{key:"pending",label:t.accountOrderStatusPending,value:38,tone:"warning"}]} /></section></div>}</dialog></>;
}
