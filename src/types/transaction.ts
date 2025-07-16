// src/@types/transaction.ts
export interface Transaction {
  id: string;
  receiptNumber?: string;
  // MpesaReceiptNumber?: string;
  amount?: number;
  // Amount?: number;
  phoneNumber?: string;
  // PhoneNumber?: string;
  status?: string;
  timestamp?: string | Date;
  // processedAt?: string | Date;
  // Timestamp?: string;
  details?: any;
  AccountNumber?: string;
  PaybillNumber?: string;
  TransactionType?: string;
  [key: string]: any; // Add index signature for dynamic access
}