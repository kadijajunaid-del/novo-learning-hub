"use client";

import { useState } from "react";

type Datum = { label: string; value: number };

function useTooltip() {
  const [tip, setTip] = useState<{ x: number; y: number; title: string; value: string } | null>(null);
  const show = (e: React.MouseEvent, title: string, value: string) => {
    const rect = (e.currentTarget as SVGElement).closest("[data-chart]")!.getBoundingClientRect();
    setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, title, value });
  };
  const hide = () => setTip(null);
  const node = tip ? (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-lg"
      style={{ left: tip.x, top: tip.y - 8 }}
    >
      <div className="font-semibold text-ink">{tip.title}</div>
      <div className="text-ink2">{tip.value}</div>
    </div>
  ) : null;
  return { show, hide, node };
}

/** Vertical bar chart — single series, direct value labels, hover tooltip. */
export function BarChart({ data, color = "var(--s1)", height = 180, valueSuffix = "" }: { data: Datum[]; color?: string; height?: number; valueSuffix?: string }) {
  const { show, hide, node } = useTooltip();
  const W = 560;
  const pad = { l: 8, r: 8, t: 22, b: 22 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const iw = W - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const bw = Math.min(34, (iw / data.length) * 0.55);

  return (
    <div className="relative" data-chart>
      <svg viewBox={`0 0 ${W} ${height}`} className="h-auto w-full" role="img" aria-label="Bar chart">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={pad.l} x2={W - pad.r} y1={pad.t + ih - ih * f} y2={pad.t + ih - ih * f} stroke="var(--grid)" strokeWidth={1} />
        ))}
        <line x1={pad.l} x2={W - pad.r} y1={pad.t + ih} y2={pad.t + ih} stroke="var(--line)" strokeWidth={1} />
        {data.map((d, i) => {
          const cx = pad.l + (iw / data.length) * (i + 0.5);
          const h = (d.value / max) * ih;
          return (
            <g key={d.label}>
              <rect
                x={cx - bw / 2}
                y={pad.t + ih - h}
                width={bw}
                height={Math.max(h, 1)}
                rx={4}
                fill={color}
                className="cursor-pointer"
                onMouseMove={(e) => show(e, d.label, `${d.value}${valueSuffix}`)}
                onMouseLeave={hide}
              />
              {/* keep rounded top only: square off the baseline end */}
              {h > 4 && <rect x={cx - bw / 2} y={pad.t + ih - 4} width={bw} height={4} fill={color} />}
              <text x={cx} y={pad.t + ih - h - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--ink-2)">
                {d.value}
              </text>
              <text x={cx} y={height - 6} textAnchor="middle" fontSize={10.5} fill="var(--ink-3)">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      {node}
    </div>
  );
}

/** Horizontal bar chart — for rankings (e.g. most active trainers). */
export function HBarChart({ data, color = "var(--s1)", valueSuffix = "" }: { data: Datum[]; color?: string; valueSuffix?: string }) {
  const { show, hide, node } = useTooltip();
  const W = 560;
  const rowH = 34;
  const H = data.length * rowH + 6;
  const labelW = 150;
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="relative" data-chart>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Ranking chart">
        {data.map((d, i) => {
          const y = i * rowH + 8;
          const w = Math.max(3, (d.value / max) * (W - labelW - 60));
          return (
            <g key={d.label}>
              <text x={labelW - 10} y={y + 13} textAnchor="end" fontSize={11.5} fill="var(--ink-2)" fontWeight={500}>
                {d.label.length > 20 ? d.label.slice(0, 19) + "…" : d.label}
              </text>
              <rect
                x={labelW} y={y} width={w} height={18} rx={4} fill={color}
                className="cursor-pointer"
                onMouseMove={(e) => show(e, d.label, `${d.value}${valueSuffix}`)}
                onMouseLeave={hide}
              />
              <text x={labelW + w + 8} y={y + 13} fontSize={11} fontWeight={600} fill="var(--ink-2)">
                {d.value}
              </text>
            </g>
          );
        })}
      </svg>
      {node}
    </div>
  );
}

/** Line chart with area wash, point markers, crosshair hover tooltip. */
export function LineChart({ data, color = "var(--s1)", height = 180, valueSuffix = "%" }: { data: Datum[]; color?: string; height?: number; valueSuffix?: string }) {
  const { show, hide, node } = useTooltip();
  const [hover, setHover] = useState<number | null>(null);
  const W = 560;
  const pad = { l: 8, r: 8, t: 18, b: 22 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const iw = W - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const px = (i: number) => pad.l + (iw / Math.max(1, data.length - 1)) * i;
  const py = (v: number) => pad.t + ih - (v / max) * ih;
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${px(i)},${py(d.value)}`).join(" ");
  const area = `${path} L${px(data.length - 1)},${pad.t + ih} L${px(0)},${pad.t + ih} Z`;

  return (
    <div className="relative" data-chart>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Line chart"
        onMouseLeave={() => { setHover(null); hide(); }}
        onMouseMove={(e) => {
          const svg = e.currentTarget;
          const r = svg.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((x - pad.l) / iw) * (data.length - 1));
          if (i >= 0 && i < data.length) {
            setHover(i);
            show(e as any, data[i].label, `${data[i].value}${valueSuffix}`);
          }
        }}
      >
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={pad.l} x2={W - pad.r} y1={pad.t + ih - ih * f} y2={pad.t + ih - ih * f} stroke="var(--grid)" strokeWidth={1} />
        ))}
        <line x1={pad.l} x2={W - pad.r} y1={pad.t + ih} y2={pad.t + ih} stroke="var(--line)" strokeWidth={1} />
        <path d={area} fill={color} opacity={0.08} />
        <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {hover !== null && (
          <line x1={px(hover)} x2={px(hover)} y1={pad.t} y2={pad.t + ih} stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="3 3" />
        )}
        {data.map((d, i) => (
          <circle
            key={d.label}
            cx={px(i)}
            cy={py(d.value)}
            r={hover === i ? 5 : 3.5}
            fill={color}
            stroke="var(--surface)"
            strokeWidth={2}
          />
        ))}
        {data.map((d, i) => (
          <text key={d.label} x={px(i)} y={height - 6} textAnchor="middle" fontSize={10.5} fill="var(--ink-3)">
            {d.label}
          </text>
        ))}
      </svg>
      {node}
    </div>
  );
}

const SERIES = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)", "var(--s5)"];

/** Donut chart with legend + direct counts (identity never color-alone). */
export function DonutChart({ data, centerLabel }: { data: Datum[]; centerLabel?: string }) {
  const { show, hide, node } = useTooltip();
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = 70;
  const r = 46;
  const C = 90;
  let angle = -Math.PI / 2;

  const arcs = data.slice(0, 5).map((d, i) => {
    const frac = d.value / total;
    const a0 = angle;
    const a1 = angle + frac * Math.PI * 2;
    angle = a1;
    // 2px surface gap between segments via stroke
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (a: number, rad: number) => [C + rad * Math.cos(a), C + rad * Math.sin(a)];
    const [x0, y0] = p(a0, R);
    const [x1, y1] = p(a1, R);
    const [x2, y2] = p(a1, r);
    const [x3, y3] = p(a0, r);
    return {
      d: `M${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${r},${r} 0 ${large} 0 ${x3},${y3} Z`,
      color: SERIES[i % SERIES.length],
      datum: d,
      pct: Math.round(frac * 100),
    };
  });

  return (
    <div className="relative flex flex-wrap items-center gap-5" data-chart>
      <svg viewBox="0 0 180 180" className="h-40 w-40 shrink-0" role="img" aria-label="Donut chart">
        {arcs.map((a) => (
          <path
            key={a.datum.label}
            d={a.d}
            fill={a.color}
            stroke="var(--surface)"
            strokeWidth={2}
            className="cursor-pointer"
            onMouseMove={(e) => show(e, a.datum.label, `${a.datum.value} · ${a.pct}%`)}
            onMouseLeave={hide}
          />
        ))}
        <text x={C} y={C - 4} textAnchor="middle" fontSize={22} fontWeight={700} fill="var(--ink)">
          {total}
        </text>
        {centerLabel && (
          <text x={C} y={C + 14} textAnchor="middle" fontSize={9.5} fill="var(--ink-3)">
            {centerLabel}
          </text>
        )}
      </svg>
      <ul className="min-w-[150px] flex-1 space-y-2">
        {arcs.map((a) => (
          <li key={a.datum.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: a.color }} />
            <span className="flex-1 truncate text-ink2">{a.datum.label}</span>
            <span className="font-semibold text-ink">{a.datum.value}</span>
          </li>
        ))}
      </ul>
      {node}
    </div>
  );
}
