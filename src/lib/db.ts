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
