// global.d.ts
declare module '@/lib/paymentMonitor' {
  import { Database } from 'better-sqlite3';
  
  export class PaymentMonitor {
    constructor(
      phone: string,
      account: string,
      onStatusChange: (status: string) => void,
      onCleanup: () => void,
      db: Database
    );
    start(checkoutRequestId: string): void;
    stop(): void;
  }
}
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