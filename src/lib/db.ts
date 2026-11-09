import Database from "better-sqlite3";
import path from "path";

// Real SQLite connection. Kept intact for when we switch back off fake data
// (see USE_FAKE_DATA in src/lib/fakeData.ts).
//
// This is lazy on purpose: `new Database(...)` throws if the file is missing,
// and at module scope that crashes any route that merely imports this file.
// Deferring it means nothing breaks until something actually asks to query.

let _db: Database.Database | null = null;

export function getDb() {
    if (_db) return _db;

    const dbPath =
        process.env.SQLITE_PATH ?? path.join(process.cwd(), "data", "dailyenergy.db");

    console.log("PATH PATH PATH IS: ", process.env.SQLITE_PATH);

    _db = new Database(dbPath);
    _db.pragma("journal_mode = WAL");

    return _db;
}

// Daily rollups (one row per day: average W plus that day's weather), used by
// /api/daily-average. Separate from the hourly `data` table above.
//
// Defaults to dailyenergy.db next to SQLITE_PATH, since the collection scripts
// write both files into the same folder. Override with DAILY_SQLITE_PATH.
// Opened read-only: the dashboard never writes to it.

let _dailyDb: Database.Database | null = null;

export function getDailyDb() {
    if (_dailyDb) return _dailyDb;

    const dbPath =
        process.env.DAILY_SQLITE_PATH ??
        (process.env.SQLITE_PATH
            ? path.join(path.dirname(process.env.SQLITE_PATH), "dailyenergy.db")
            : path.join(process.cwd(), "data", "dailyenergy.db"));

    _dailyDb = new Database(dbPath, { readonly: true, fileMustExist: true });

    return _dailyDb;
}
