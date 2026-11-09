import { getDailyDb } from "@/lib/db";
import { USE_FAKE_DATA, fakeDailyRow, DailyRow } from "@/lib/fakeData";

export const runtime = "nodejs"; // SQLite won't run on Edge

/**
 * GET /api/daily-average?date=YYYY-MM-DD
 *
 * Reads that day's row from dailyenergy.db (one row per day, 2021-01-01 to
 * 2025-12-30) and returns:
 *   { date, avgEnergy, temp, solarRad, humidity, windSpeed }
 * avgEnergy is the day's average W, the same figure the glacier page shows for
 * today and yesterday. The weather fields are that day's averages and may be
 * null if the weather station had no readings.
 *
 * Which dates exist is decided by the table itself, not by a hardcoded range
 * here, so this keeps working as more days are added. A missing day is a 404.
 */
export async function GET(req: Request) {
    const date = new URL(req.url).searchParams.get("date") ?? "";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return Response.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
    }

    const row: DailyRow | undefined = USE_FAKE_DATA
        ? fakeDailyRow(date)
        : (getDailyDb().prepare("SELECT * FROM data WHERE date = ?").get(date) as DailyRow | undefined);

    if (!row) {
        return Response.json({ error: `no data for ${date}` }, { status: 404 });
    }

    return Response.json({
        date,
        avgEnergy: Math.round(row.energyUsed),
        temp: row.temp_out_avg,
        solarRad: row.solar_rad_avg,
        humidity: row.hum_out_avg,
        windSpeed: row.wind_speed_avg,
    });
}
