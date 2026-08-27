import Database from "better-sqlite3";
import path from "path";

console.log("PATH PATH PATH IS: ", process.env.SQLITE_PATH)

const dbPath = process.env.SQLITE_PATH ?? path.join(process.cwd(), "data", "dailyenergy.db")


export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");