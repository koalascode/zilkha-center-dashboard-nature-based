import { getDb } from "@/lib/db";
import { USE_FAKE_DATA, fakeDayRows, EnergyRow } from "@/lib/fakeData";

export const runtime = "nodejs"; // SQLite won't run on Edge

// The range the date picker on /glacier offers. Enforced here too, because
// anyone can call the API directly and skip the picker's min/max.
const MIN_DATE = "2021-01-01";
const MAX_DATE = "2025-12-31";

/**
 * GET /api/daily-average?date=YYYY-MM-DD
 *
 * Returns { date, avgEnergy } where avgEnergy is the mean of that day's hourly
 * energyUsed readings, the same "average W" figure the glacier page derives
 * for today and yesterday.
 */
export async function GET(req: Request) {
    const date = new URL(req.url).searchParams.get("date") ?? "";

    // 'YYYY-MM-DD' strings compare correctly as plain strings, so the range
    // check needs no Date parsing.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < MIN_DATE || date > MAX_DATE) {
        return Response.json(
            { error: `date must be YYYY-MM-DD between ${MIN_DATE} and ${MAX_DATE}` },
            { status: 400 },
        );
    }

    // Next calendar day, computed in UTC so the local timezone can't shift it.
    const next = new Date(`${date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    const nextDay = next.toISOString().substring(0, 10);

    const rows: EnergyRow[] = USE_FAKE_DATA
        ? fakeDayRows(date)
        : (getDb()
              .prepare("SELECT * FROM data WHERE time >= ? AND time < ?")
              .all(date, nextDay) as EnergyRow[]);

    if (rows.length === 0) {
        return Response.json({ error: `no data for ${date}` }, { status: 404 });
    }

    const total = rows.reduce((sum, r) => sum + r.energyUsed, 0);

    return Response.json({ date, avgEnergy: Math.round(total / rows.length) });
}
