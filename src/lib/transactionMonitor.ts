// /src/lib/transactionMonitor.ts
import db from '@/lib/db';

interface Transaction {
  checkout_request_id: string;
  phone: string;
  account: string;
}

class TransactionMonitor {
  private interval: NodeJS.Timeout | null = null;
  private readonly checkInterval = 5000; // 5 seconds

  start(): void {
    this.interval = setInterval(async () => {
      try {
        await this.checkExpiredTransactions();
      } catch (error) {
        console.error('Transaction monitor error:', error);
      }
    }, this.checkInterval);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async checkExpiredTransactions(): Promise<void> {
    const now = new Date().toISOString();
    
    try {
      const stmt = db.prepare<[string], Transaction>(`
        SELECT checkout_request_id, phone, account 
        FROM transactions 
        WHERE status = 'Pending' AND expires_at < ?
      `);
      
      const transactions = stmt.all(now);

      for (const tx of transactions) {
        try {
          await this.cancelTransaction(tx.checkout_request_id, tx.phone, tx.account);
        } catch (error) {
          console.error(`Failed to cancel transaction ${tx.checkout_request_id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking expired transactions:', error);
    }
  }

  private async cancelTransaction(
    checkoutId: string,
    phone: string,
    account: string
  ): Promise<void> {
    try {
      // Update status in database
      db.prepare(`
        UPDATE transactions 
        SET status = 'Timeout' 
        WHERE checkout_request_id = ?
      `).run(checkoutId);

      // Here you would implement actual STK cancellation logic
      console.log(`Cancelled transaction ${checkoutId} for ${phone}`);
    } catch (error) {
      console.error(`Error cancelling transaction ${checkoutId}:`, error);
      throw error;
    }
  }
}

export const transactionMonitor = new TransactionMonitor();