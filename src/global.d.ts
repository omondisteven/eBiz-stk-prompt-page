// global.d.ts
interface Navigator {
    contacts?: {
      select: (properties: string[], options?: { multiple: boolean }) => Promise<unknown[]>;
    };
    
  }

  declare module '@/lib/db' {
  import { Database } from 'better-sqlite3';
  const db: Database;
  export default db;
}