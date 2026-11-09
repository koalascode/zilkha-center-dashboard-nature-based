"use client";

import { type ComponentType, useEffect, useState } from "react";
import glacierStyles from "@/styles/GlacierPage.module.css";
import { defaultWeather, monthlyWeather, predictEnergy, type Weather } from "./energyModel";

// Traditional charts matched to the bottle page's prediction bottle: the usage predicted
// from the weather sliders, next to today's actual average, on the same 0–20,000 W scale
// that bottle uses. Only the visual form differs.
const MAX_POWER = 20000;

type ChartProps = { today: number; predicted: number; max: number };

const formatPower = (value: number) => `${Math.round(value).toLocaleString("en-US")} W`;
const fraction = (value: number, max: number) => Math.min(1, Math.max(0, value / max));
const formatKilo = (value: number) => `${(value / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k`;

// Mirrors bottle/page.tsx: the average covers only the hours that have a reading today.
function useTodayAverage() {
  const [today, setToday] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/hourly-totals", { signal: controller.signal });
        if (!response.ok) throw new Error("Unable to load today's energy data.");
        const rows: { Today: number | null }[] = await response.json();
        let sum = 0;
        let hours = 0;
        for (const row of rows) {
          if (row.Today == null) break;
          sum += row.Today;
          hours += 1;
        }
        if (hours === 0) throw new Error("No energy readings are available for today yet.");
        setToday(Math.round(sum / hours));
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error instanceof Error ? error.message : "Unable to load today's energy data.");
        }
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  return { today, error };
}

// 1. Gauge: a half-circle dial. The arc fills left to right and the needle points at the value.
function Gauge({ value, max, label, colorClass }: { value: number; max: number; label: string; colorClass: string }) {
  const cx = 100, cy = 100, r = 80;
  // Fraction 0 sits at the far left (180°), 1 at the far right (0°).
  const point = (f: number, radius: number) => {
    const angle = Math.PI * (1 - f);
    return { x: cx + radius * Math.cos(angle), y: cy - radius * Math.sin(angle) };
  };
  const arc = (f: number) => {
    const end = point(f, r);
    return `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;
  };
  const f = fraction(value, max);
  const tip = point(f, r - 18);
  // Like a speedometer: labeled major ticks at quarters of the scale, a short unlabeled tick between each.
  // They sit outside the arc so the needle never crosses a label.
  const majorTicks = [0, 1 / 4, 1 / 2, 3 / 4, 1];
  const minorTicks = [1 / 8, 3 / 8, 5 / 8, 7 / 8];
  const tick = (t: number, outer: number) => {
    const from = point(t, r + 10);
    const to = point(t, outer);
    return { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
  };

  return (
    <figure className="flex flex-col items-center">
      <svg viewBox="-6 -18 212 142" className="w-full max-w-[260px]" role="img" aria-label={`${label}: ${formatPower(value)} of ${formatPower(max)}`}>
        <path d={arc(1)} fill="none" strokeWidth={16} className="stroke-gray-200" />
        {f > 0 && <path d={arc(f)} fill="none" strokeWidth={16} className={colorClass} />}
        {minorTicks.map((t) => <line key={t} {...tick(t, r + 13)} strokeWidth={1} className="stroke-gray-300" />)}
        {majorTicks.map((t) => {
          // End labels go under the arc's ends; the rest sit just beyond their tick.
          const isEnd = t === 0 || t === 1;
          const at = isEnd ? { x: point(t, r).x, y: cy + 15 } : point(t, r + 28);
          return (
            <g key={t}>
              <line {...tick(t, r + 17)} strokeWidth={2} className="stroke-gray-500" />
              <text x={at.x} y={at.y + 4} textAnchor="middle" fontSize={11} fill="#6b7280">{t === 0 ? "0" : formatKilo(t * max)}</text>
            </g>
          );
        })}
        <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} strokeWidth={3} strokeLinecap="round" className="stroke-gray-800" />
        <circle cx={cx} cy={cy} r={5} className="fill-gray-800" />
      </svg>
      <figcaption className="mt-1 text-center text-sm text-gray-700">
        {label}<br /><span className="text-lg font-semibold text-black tabular-nums">{formatPower(value)}</span>
      </figcaption>
    </figure>
  );
}

function GaugeChart({ today, predicted, max }: ChartProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Gauge value={today} max={max} label="Today" colorClass="stroke-violet-500" />
      <Gauge value={predicted} max={max} label="Predicted" colorClass="stroke-cyan-500" />
    </div>
  );
}

// 2. KPI tiles: the numbers themselves, with the prediction's change from today.
function KpiTiles({ today, predicted }: ChartProps) {
  const change = today === 0 ? null : (predicted - today) / today;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">Today’s average power</p>
        <p className="mt-1 text-3xl font-semibold text-black tabular-nums">{formatPower(today)}</p>
        <p className="mt-1 text-sm text-gray-600">Hours measured so far</p>
      </div>
      <div className="rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">Predicted power</p>
        <p className="mt-1 text-3xl font-semibold text-black tabular-nums">{formatPower(predicted)}</p>
        {change != null && (
          <p className="mt-1 text-sm text-gray-600 tabular-nums">
            {change >= 0 ? "▲" : "▼"} {Math.abs(change * 100).toFixed(1)}% vs today
          </p>
        )}
      </div>
    </div>
  );
}

const charts = [
  { title: "1. Gauge", Chart: GaugeChart },
  { title: "2. KPI tiles", Chart: KpiTiles },
];

// Same sliders as the glacier page. Wind is stored on the model's 0–6 scale and shown ×8 as mph.
const weatherControls: { key: keyof Weather; label: string; max: number; step: number; format: (value: number) => string }[] = [
  { key: "temp", label: "Temp", max: 100, step: 0.1, format: (value) => `${value} ºF` },
  { key: "solar", label: "Solar", max: 300, step: 0.3, format: (value) => `${value} W/m^2` },
  { key: "humidity", label: "Humidity", max: 100, step: 0.1, format: (value) => `${value} %` },
  { key: "wind", label: "Wind", max: 6, step: 0.06, format: (value) => `${Math.round(value * 80) / 10} mph` },
];

// Each card keeps its own weather, so a chart's response can be explored without moving the others.
function ChartCard({ title, Chart, today }: { title: string; Chart: ComponentType<ChartProps>; today: number }) {
  const [weather, setWeather] = useState<Weather>(defaultWeather);
  const predicted = predictEnergy(weather);

  return (
    <article className="flex flex-col rounded-lg border border-gray-200 p-4 sm:p-5">
      <h4 className="mb-4 font-medium text-black">{title}</h4>
      <div className="flex-1">
        <Chart today={today} predicted={predicted} max={MAX_POWER} />
      </div>
      <div className="mt-5 grid grid-cols-6 gap-1">
        {monthlyWeather.map(({ month, weather }) => (
          <button key={month} type="button" className={glacierStyles.monthbtn} onClick={() => setWeather(weather)}>{month}</button>
        ))}
      </div>
      <fieldset className="mt-4 grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">{title} weather</legend>
        {weatherControls.map(({ key, label, max, step, format }) => (
          <label key={key} className="text-sm text-gray-700">
            {label}: <span className="tabular-nums">{format(weather[key])}</span>
            <input className={`${glacierStyles.slider} focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-500`}
              type="range" min={0} max={max} step={step} value={weather[key]} aria-valuetext={format(weather[key])}
              onChange={(event) => setWeather((previous) => ({ ...previous, [key]: Number(event.target.value) }))} />
          </label>
        ))}
      </fieldset>
    </article>
  );
}

export default function BottleCounterparts() {
  const { today, error } = useTodayAverage();

  return (
    <section className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-800" aria-labelledby="bottle-counterparts-heading">
      <h3 id="bottle-counterparts-heading" className="text-black">Traditional counterparts to the bottle</h3>
      <p className="mt-2 text-sm text-gray-500">
        Each chart shows the usage predicted from its weather settings next to today’s average power so far, on the prediction bottle’s 0–20,000 W scale.
      </p>
      {error ? <p role="alert" className="py-6 text-sm text-gray-600">{error}</p> : today === null ? (
        <p role="status" className="py-6 text-sm text-gray-500">Loading today’s energy…</p>
      ) : (
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {charts.map(({ title, Chart }) => <ChartCard key={title} title={title} Chart={Chart} today={today} />)}
        </div>
      )}
    </section>
  );
}
