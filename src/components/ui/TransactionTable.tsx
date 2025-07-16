// src/components/ui/TransactionTable.tsx
import { Badge } from "./Badge";
import { BadgeProps } from "./Badge";
import { Transaction } from "@/types/transaction";
import { Eye } from "lucide-react";

interface TransactionTableProps {
  transactions: Transaction[];
  onView: (transaction: Transaction) => void;
}

export default function TransactionTable({ transactions, onView }: TransactionTableProps) {
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
    <div className="overflow-x-auto rounded-lg shadow border border-green-500">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-100 dark:bg-[#001f3f] text-xs uppercase border-b border-green-500">
          <tr className="text-gray-600 dark:text-gray-200">
            <th className="px-4 py-3 hidden md:table-cell">Receipt</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3 hidden md:table-cell">Status</th>
            <th className="px-4 py-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="text-gray-800 dark:text-gray-100">
          {transactions.map((tx, idx) => (
            <tr
              key={tx.id}
              className={`border-b border-green-500 ${idx % 2 === 0 ? "bg-white dark:bg-[#002855]" : "bg-gray-50 dark:bg-[#003366]"} hover:bg-gray-100 dark:hover:bg-[#003366]`}
            >
              <td className="px-4 py-2 hidden md:table-cell">{tx.receiptNumber || "N/A"}</td>
              <td className="px-4 py-2">{formatDate(tx.timestamp)}</td>
              <td className="px-4 py-2 text-right">KES {(tx.amount ?? tx.Amount ?? 0).toFixed(2)}</td>
              <td className="px-4 py-2 hidden md:table-cell">
                <Badge variant={getStatusVariant(tx.status)}>
                  {tx.status || "Unknown"}
                </Badge>
              </td>
              <td className="px-4 py-2 text-center">
                <button
                  onClick={() => onView(tx)}
                  aria-label={`View transaction ${tx.id}`}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <Eye className="h-5 w-5 inline" />
                  <span className="hidden md:inline ml-1">View</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
