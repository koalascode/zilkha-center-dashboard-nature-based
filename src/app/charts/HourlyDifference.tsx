"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type HourRow = { time: string; Today: number | null; Yesterday: number };

const formatPower = (value: number) => `${Math.round(value).toLocaleString("en-US")} W`;
const formatSigned = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatPower(Math.abs(value))}`;

export default function HourlyDifference() {
  const [rows, setRows] = useState<HourRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/hourly-totals", { signal: controller.signal });
        if (!response.ok) throw new Error("Unable to load hourly energy data.");
        setRows(await response.json());
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error instanceof Error ? error.message : "Unable to load hourly energy data.");
        }
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  // Hours that haven't happened yet have no Today value. They still show
  // yesterday's bar, but they're left out of the summary and the table.
  const measured = rows?.filter((row): row is HourRow & { Today: number } => row.Today != null) ?? [];
  const hoursHigher = measured.filter((row) => row.Today > row.Yesterday).length;

  return (
    <section className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-800" aria-labelledby="hourly-comparison-heading">
      <h3 id="hourly-comparison-heading" className="text-black">Hour-by-hour: Today vs Yesterday</h3>
      <p className="mt-2 text-sm text-gray-500">
        Each hour shows yesterday’s usage next to today’s. Hover a pair to see the difference.
      </p>
      {error ? <p role="alert" className="py-6 text-sm text-gray-600">{error}</p> : rows === null ? (
        <p role="status" className="py-6 text-sm text-gray-500">Loading hourly energy…</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap justify-end gap-4 text-xs text-gray-700 dark:text-gray-300">
            <span><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-cyan-500" />Yesterday</span>
            <span><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-violet-500" />Today</span>
          </div>
          <div className="mt-4 h-[320px] w-full sm:h-[380px]">
            <ResponsiveContainer>
              <BarChart data={rows} margin={{ top: 10, right: 20, bottom: 10 }} barCategoryGap="20%" barGap={2} accessibilityLayer>
                <CartesianGrid vertical={false} className="stroke-gray-200 dark:stroke-gray-800" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} interval="preserveStart" minTickGap={16} dy={6} />
                <YAxis width={80} axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} tickFormatter={formatPower} />
                <Tooltip cursor={{ fill: "#9ca3af", fillOpacity: 0.1 }} content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as HourRow | undefined;
                  if (!active || !row) return null;
                  return (
                    <div className="rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-black shadow-md">
                      <p className="font-medium">{row.time}</p>
                      <p className="mt-1">Yesterday: {formatPower(row.Yesterday)}</p>
                      <p>Today: {row.Today == null ? "No reading yet" : formatPower(row.Today)}</p>
                      {row.Today != null && <p className="mt-1 font-medium">Difference: {formatSigned(row.Today - row.Yesterday)}</p>}
                    </div>
                  );
                }} />
                <Bar dataKey="Yesterday" className="fill-cyan-500" maxBarSize={14} radius={[3, 3, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="Today" className="fill-violet-500" maxBarSize={14} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {measured.length > 0 && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Today used more energy than yesterday in {hoursHigher} of {measured.length} hours so far.
            </p>
          )}
          <details className="mt-3 text-sm text-gray-700 dark:text-gray-300">
            <summary className="cursor-pointer">Show as table</summary>
            <table className="mt-2 w-full max-w-md text-left">
              <thead className="text-gray-500">
                <tr><th className="py-1 font-normal">Hour</th><th className="py-1 font-normal">Yesterday</th><th className="py-1 font-normal">Today</th><th className="py-1 font-normal">Difference</th></tr>
              </thead>
              <tbody className="tabular-nums">
                {measured.map((row) => (
                  <tr key={row.time} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-1">{row.time}</td>
                    <td className="py-1">{formatPower(row.Yesterday)}</td>
                    <td className="py-1">{formatPower(row.Today)}</td>
                    <td className="py-1">{formatSigned(row.Today - row.Yesterday)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </section>
  );
}
