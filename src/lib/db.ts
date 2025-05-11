// /src/lib/db.ts
import { Database } from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'transactions.db');

export const initDB = () => {
  const db = new Database(dbPath);

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        account TEXT NOT NULL,
        amount REAL NOT NULL,
        transaction_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        checkout_request_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TRIGGER IF NOT EXISTS update_timestamp
      AFTER UPDATE ON transactions
      FOR EACH ROW
      BEGIN
        UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;
    `);
  });

  return db;
};

export const db = initDB();