// src/components/TransactionDetails.tsx
import { Badge } from "./ui/Badge";
import { Button } from "./ui/button";
import { Transaction } from "@/types/transaction";

interface TransactionDetailsProps {
  transaction: Transaction;
  onClose: () => void;
}

export default function TransactionDetails({ transaction, onClose }: TransactionDetailsProps) {
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return isNaN(dateObj.getTime()) ? "N/A" : dateObj.toLocaleString();
    } catch {
      return "N/A";
    }
  };

  const getStatusVariant = (status?: string) => {
    switch (status) {
      case "Success": return "success";
      case "Failed": return "destructive";
      case "Cancelled": return "warning";
      default: return "default";
    }
  };

  const renderDetailRow = (label: string, value: any) => (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}:</span>
      <span className="text-blue-900">{value || "N/A"}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-center"
              style={{color: "#0c0246ff"}}>BLTA SOLUTIONS LIMITED</h3>
              <br />
           <h2 className="text-xl font-bold text-center"
              style={{color: "#09c95fff"}}>M-POSTER TRANSACTION DETAILS</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-black">
            ✕
          </button>
        </div>
        
        <div className="space-y-3 mb-4 overflow-y-auto">
          {renderDetailRow("Status", 
            <Badge variant={getStatusVariant(transaction.status)}>
              {transaction.status}
            </Badge>
          )}
          {renderDetailRow("Amount", `KES ${transaction.amount?.toLocaleString('en-KE')}`)}
          {renderDetailRow("Receipt Number", transaction.receiptNumber)}
          {renderDetailRow("Date", formatDate(transaction.timestamp))}
          {renderDetailRow("Phone Number", transaction.phoneNumber)}
          {renderDetailRow("Transaction Type", transaction.TransactionType)}
          {renderDetailRow("Paybill Number", transaction.PaybillNumber)}
          {renderDetailRow("Account Number", transaction.AccountNumber)}

          {transaction.details && transaction.details.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium text-gray-600 mb-2">Additional Details:</h4>
              {Array.isArray(transaction.details) ? (
                transaction.details
                  .filter(detail => detail.Name && detail.Value)
                  .map((detail, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600">{detail.Name}:</span>
                      <span>{String(detail.Value)}</span>
                    </div>
                  ))
              ) : (
                Object.entries(transaction.details)
                  .filter(([key, value]) => key && value)
                  .map(([key, value], index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600">{key}:</span>
                      <span>{String(value)}</span>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

        <Button onClick={onClose} className="mt-4">
          Close
        </Button>
      </div>
    </div>
  );
}