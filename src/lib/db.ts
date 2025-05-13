// /src/lib/db.ts
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.resolve(process.cwd(), 'payments.db');

const CREATE_PAYMENTS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS payments (
  checkoutRequestId TEXT PRIMARY KEY,
  phoneNumber TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL,
  mpesaReceiptNumber TEXT,
  transactionDate TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
`;

let dbInstance: Database | null = null;

async function createDb(): Promise<Database> {
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  await db.exec(CREATE_PAYMENTS_TABLE_SQL);
  return db;
}

const dbPromise: Promise<Database> = (async () => {
  if (!dbInstance) {
    dbInstance = await createDb();
  }
  return dbInstance;
})();

export default dbPromise;
