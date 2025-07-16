// src/@types/transaction.ts
export interface Transaction {
  id: string;
  receiptNumber?: string;
  amount?: number;
  phoneNumber?: string;
  status?: string;
  timestamp?: string | Date;
  details?: any[] | Record<string, any>;
  // Direct fields that might exist in the document
  AccountNumber?: string;
  PaybillNumber?: string;
  TransactionType?: string;
  // Raw fields from different naming conventions
  MpesaReceiptNumber?: string;
  Amount?: number;
  PhoneNumber?: string;
  processedAt?: string | Date;
}