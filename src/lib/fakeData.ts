// Fake stand-in for the SQLite `data` table, so local dev doesn't need a real
// dailyenergy.db. Flip this off (or set SQLITE_PATH + USE_FAKE_DATA=false in
// .env.local) to go back to real queries — see src/lib/db.ts.
export const USE_FAKE_DATA = process.env.USE_FAKE_DATA !== "false";

// One row of the `data` table, as better-sqlite3 would hand it back.
export type EnergyRow = {
    time: string;
    energyUsed: number;
};

// Deterministic pseudo-random in [0, 1) derived from a string. Using this
// instead of Math.random() keeps values stable across reloads, so the charts
// and animations don't twitch on every refresh and bugs stay reproducible.
function seededUnit(seed: string) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    // >>> 0 coerces to unsigned so we never get a negative ratio
    return ((h >>> 0) % 100000) / 100000;
}

// Rough shape of a campus building's day: a low overnight floor, a morning
// ramp, an afternoon peak, an evening fall-off. Hour is 0-23.
function hourlyUsage(dateKey: string, hour: number) {
    const BASE = 7000;   // overnight floor
    const SWING = 8000;  // additional load at full occupancy

    // Peaks around hour 14, near zero at hour 2.
    const curve = Math.sin(((hour - 2) / 24) * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;

    const jitter = (seededUnit(`${dateKey}:${hour}`) - 0.5) * 1200;

    return Math.max(0, Math.round(BASE + SWING * curve + jitter));
}

function dateKey(d: Date) {
    return d.toISOString().substring(0, 10);
}

/**
 * Stands in for:
 *   SELECT * FROM data WHERE time > '<yesterday>'
 *
 * Returns yesterday's 24 hours followed by today's hours *so far*, which is the
 * ordering the route relies on (first 24 = Yesterday, remainder = Today). The
 * partial day matters: consumers stop at the first null Today and extrapolate
 * a daily average from the hours elapsed, so a full 48 rows would misrepresent
 * a mid-day reading.
 */
export function fakeHourlyRows(now: Date = new Date()): EnergyRow[] {
    const today = new Date(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayKey = dateKey(today);
    const yesterdayKey = dateKey(yesterday);

    const rows: EnergyRow[] = [];

    for (let hour = 0; hour < 24; hour++) {
        rows.push({
            time: `${yesterdayKey} ${String(hour).padStart(2, "0")}:00:00`,
            energyUsed: hourlyUsage(yesterdayKey, hour),
        });
    }

    // Today is only complete up to the current hour.
    const hoursSoFar = now.getHours() + 1;

    for (let hour = 0; hour < hoursSoFar; hour++) {
        rows.push({
            time: `${todayKey} ${String(hour).padStart(2, "0")}:00:00`,
            energyUsed: hourlyUsage(todayKey, hour),
        });
    }

    return rows;
}
