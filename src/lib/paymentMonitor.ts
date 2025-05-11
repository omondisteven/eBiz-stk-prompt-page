// /src/lib/paymentMonitor.ts
import { Database } from 'better-sqlite3';

interface Transaction {
  checkout_request_id: string;
  phone: string;
  account: string;
  status: 'Pending' | 'Success' | 'Failed' | 'Cancelled' | 'Timeout';
}

export class PaymentMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private timeoutId: NodeJS.Timeout | null = null;
  private isComplete = false;
  private currentCheckoutId: string | null = null;

  constructor(
    private phone: string,
    private account: string,
    private onStatusChange: (status: string) => void,
    private onCleanup: () => void,
    private db: Database
  ) {}

  start(checkoutRequestId: string): void {
    this.currentCheckoutId = checkoutRequestId;
    this.timeoutId = setTimeout(() => this.handleTimeout(), 60000);
    this.intervalId = setInterval(() => this.checkStatus(), 5000);
  }

  stop(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (!this.isComplete) this.onCleanup();
    this.currentCheckoutId = null;
  }

  private async checkStatus(): Promise<void> {
  try {
    if (!this.currentCheckoutId) return;

    const response = await fetch(
      `/api/stk_api/check_payment_status?checkoutRequestId=${this.currentCheckoutId}`
    );

    // First check if response is OK
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    // Then try to parse as JSON
    const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Unknown error from server');
      }

      switch (data.status) {
        case 'Success':
          this.complete('Payment successful');
          break;
        case 'Cancelled':
          this.complete('Payment cancelled by user');
          break;
        case 'Failed':
          this.complete('Payment failed');
          break;
        case 'Timeout':
          this.complete('Payment timed out');
          break;
      }
    } catch (error) {
      console.error('Status check error:', error);
      this.complete('Error checking payment status');
    }
  }

  private handleTimeout(): void {
    if (!this.isComplete) {
      this.db.prepare(`
        UPDATE transactions
        SET status = 'Timeout'
        WHERE checkout_request_id = ?
      `).run(this.currentCheckoutId);
      this.complete('Payment timed out');
    }
  }

  private complete(message: string): void {
    if (this.isComplete) return;
    
    this.isComplete = true;
    this.stop();
    this.onStatusChange(message);
  }
}