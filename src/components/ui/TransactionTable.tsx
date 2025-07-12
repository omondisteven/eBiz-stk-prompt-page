// src/components/ui/TransactionTable.tsx
import { Badge } from "./Badge";
import { BadgeProps } from "./Badge";
import { Transaction } from "@/types/transaction";

interface TransactionTableProps {
  transactions: Transaction[];
  onView: (transaction: Transaction) => void;
}

export default function TransactionTable({
  transactions,
  onView,
}: TransactionTableProps) {
  const getStatusVariant = (status?: string): BadgeProps["variant"] => {
    switch (status) {
      case "Success":
        return "success";
      case "Failed":
        return "destructive";
      case "Cancelled":
        return "warning";
      default:
        return "default";
    }
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return isNaN(dateObj.getTime()) ? "N/A" : dateObj.toLocaleString();
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg shadow border border-gray-200 bg-white">
      <table className="w-full text-sm text-left text-gray-800">
        <thead className="bg-gray-100 text-xs uppercase text-gray-600 border-b">
          <tr>
            <th className="px-4 py-3">Receipt</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, idx) => (
            <tr
              key={tx.id}
              className={`border-b ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}
            >
              <td className="px-4 py-2">{tx.receiptNumber || tx.MpesaReceiptNumber || "N/A"}</td>
              <td className="px-4 py-2">{formatDate(tx.timestamp)}</td>
              <td className="px-4 py-2 text-right">KES {(tx.amount ?? tx.Amount ?? 0).toFixed(2)}</td>
              <td className="px-4 py-2">
                <Badge variant={getStatusVariant(tx.status)}>
                  {tx.status || "Unknown"}
                </Badge>
              </td>
              <td className="px-4 py-2 text-center">
                <button
                  className="text-blue-600 hover:underline font-medium"
                  onClick={() => onView(tx)}
                  aria-label={`View transaction ${tx.id}`}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}