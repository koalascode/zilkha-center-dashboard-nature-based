"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { defaultWeather, predictEnergy, type Weather } from "./energyModel";
import sliderStyles from "@/styles/BottlePage.module.css";

const controls: { key: keyof Weather; label: string; min: number; max: number; step: number; unit: string }[] = [
  { key: "temp", label: "Temperature", min: 0, max: 100, step: 0.1, unit: "°F" },
  { key: "solar", label: "Solar", min: 0, max: 300, step: 0.3, unit: "W/m²" },
  { key: "humidity", label: "Humidity", min: 0, max: 100, step: 0.1, unit: "%" },
  { key: "wind", label: "Wind", min: 0, max: 6, step: 0.06, unit: "mph" },
];

const formatPower = (value: number) => `${Math.round(value).toLocaleString("en-US")} W`;

export default function EnergyComparison() {
  const [weather, setWeather] = useState<Weather>(defaultWeather);
  const [baseline, setBaseline] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadBaseline() {
      try {
        const response = await fetch("/api/hourly-totals", { signal: controller.signal });
        if (!response.ok) throw new Error("Unable to load today's energy data.");
        const rows: { Today: number | null }[] = await response.json();
        let sum = 0;
        let hours = 0;
        for (const row of rows) {
          if (row.Today == null) break;
          if (!Number.isFinite(row.Today)) throw new Error("Today's energy data is invalid.");
          sum += row.Today;
          hours += 1;
        }
        if (hours === 0) throw new Error("No energy readings are available for today yet.");
        // The bottle page's 24-hour extrapolation divided by 24 is this average.
        setBaseline(Math.round(sum / hours));
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error instanceof Error ? error.message : "Unable to load today's energy data.");
        }
      }
    }
    void loadBaseline();
    return () => controller.abort();
  }, []);

  // Show the bottle model's prediction directly at the current slider settings.
  const adjusted = predictEnergy(weather);
  const axisMaximum = 20000;
  const axisTicks = Array.from({ length: axisMaximum / 5000 + 1 }, (_, index) => index * 5000);
  const data = [
    { name: "Today’s baseline", power: baseline },
    { name: "Adjusted usage", power: adjusted },
  ];

  return (
    <section className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-800" aria-labelledby="comparison-heading">
      <h3 id="comparison-heading" className="text-black">Weather-adjusted Energy Use</h3>
      <p className="mt-2 text-sm text-gray-500">
        Today’s average power compared with the predicted usage at the current weather slider settings.
      </p>
      {error ? <p role="alert" className="py-6 text-sm text-gray-600">{error}</p> : baseline === null ? (
        <p role="status" className="py-6 text-sm text-gray-500">Loading today’s energy…</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap justify-end gap-4 text-xs text-gray-700 dark:text-gray-300">
            <span><span className="mr-1.5 inline-block h-[3px] w-3.5 rounded-full bg-violet-500" />Today’s baseline</span>
            <span><span className="mr-1.5 inline-block h-[3px] w-3.5 rounded-full bg-cyan-500" />Adjusted usage</span>
          </div>
          <div className="mt-4 h-[480px] w-full sm:h-[560px]">
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 10, right: 20, bottom: 10 }} accessibilityLayer>
                <CartesianGrid vertical={false} className="stroke-gray-200 dark:stroke-gray-800" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} dy={6} />
                <YAxis width={80} domain={[0, axisMaximum]} ticks={axisTicks} allowDataOverflow axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} tickFormatter={formatPower} />
                <Tooltip cursor={{ fill: "#9ca3af", fillOpacity: 0.1 }} content={({ active, payload }) => active && payload?.length ? (
                  <div className="rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-black shadow-md">
                    <p>{payload[0].payload.name}</p>
                    <p className="mt-1 font-medium">{formatPower(Number(payload[0].value))}</p>
                  </div>
                ) : null} />
                <Bar dataKey="power" maxBarSize={140} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  <Cell className="fill-violet-500" />
                  <Cell className="fill-cyan-500" />
                  <LabelList dataKey="name" content={({ index, viewBox }) => {
                    if (index !== 1 || !viewBox || !("width" in viewBox)) return null;
                    const x = Number(viewBox.x ?? 0);
                    const y = Number(viewBox.y ?? 0);
                    const width = Number(viewBox.width ?? 0);
                    const height = Number(viewBox.height ?? 0);
                    const visibleTop = Math.max(10, y);
                    const fitsInside = y + height - visibleTop >= 80;
                    const labelTop = fitsInside ? visibleTop + 20 : Math.max(24, y - 64);

                    return (
                      <text x={x + width / 2} y={labelTop} textAnchor="middle" fill="black" fontSize={11} fontWeight={500} pointerEvents="none">
                        {controls.map(({ key, label, unit }, line) => (
                          <tspan key={key} x={x + width / 2} dy={line === 0 ? 0 : 16}>
                            {key === "temp" ? "Temp" : label}: {key === "wind" ? Math.round(weather.wind * 80) / 10 : weather[key]} {unit}
                          </tspan>
                        ))}
                      </text>
                    );
                  }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300" aria-live="polite">
            Baseline: {formatPower(baseline)} · Predicted: {formatPower(adjusted)} · Difference from today: {adjusted - baseline >= 0 ? "+" : ""}{formatPower(adjusted - baseline)}
          </p>
        </>
      )}
      <fieldset className="mt-6 grid gap-6 sm:grid-cols-2" disabled={baseline === null}>
        <legend className="sr-only">Weather adjustments</legend>
        {controls.map(({ key, label, min, max, step, unit }) => (
          <label key={key} className="text-sm text-gray-700 dark:text-gray-300">
            {label}: {key === "wind" ? Math.round(weather.wind * 80) / 10 : weather[key]} {unit}
            <input className={`${sliderStyles.slider} focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-500`} type="range" min={min} max={max} step={step} value={weather[key]}
              aria-valuetext={`${key === "wind" ? Math.round(weather.wind * 80) / 10 : weather[key]} ${unit}`}
              onChange={(event) => setWeather((previous) => ({ ...previous, [key]: Number(event.target.value) }))} />
          </label>
        ))}
      </fieldset>
      <button type="button" className="mt-6 rounded border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900" onClick={() => setWeather(defaultWeather)}>Reset sliders</button>
    </section>
  );
}
