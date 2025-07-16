// src/components/ui/TransactionTable.tsx
"use client";

import { useState } from "react";
import { Badge } from "./Badge";
import { BadgeProps } from "./Badge";
import { Transaction } from "@/types/transaction";
import { Eye } from "lucide-react";

interface TransactionTableProps {
  transactions: Transaction[];
  onView: (transaction: Transaction) => void;
}

export default function TransactionTable({ transactions, onView }: TransactionTableProps) {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [amountFilter, setAmountFilter] = useState<number | "">("");

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const filteredTransactions = transactions
    .filter((tx) => (amountFilter === "" ? true : (tx.amount ?? 0) >= Number(amountFilter)))
    .sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

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
      return isNaN(dateObj.getTime()) ? "N/A" : dateObj.toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  const formatTime = (date?: string | Date) => {
    if (!date) return "N/A";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return isNaN(dateObj.getTime()) ? "N/A" : dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg shadow border-2 border-green-500">
      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
          <button
            onClick={toggleSortOrder}
            className="text-sm text-blue-600 hover:underline"
          >
            Sort by Date ({sortOrder === "asc" ? "Oldest" : "Newest"})
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Min Amount:</span>
            <input
              type="number"
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0"
              className="border rounded px-2 py-1 text-sm w-24"
            />
          </div>
        </div>

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
            {filteredTransactions.map((tx, idx) => (
              <tr key={tx.id} className={`border-b ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}>
                <td className="px-4 py-2">{tx.receiptNumber || "N/A"}</td>
                <td className="px-4 py-2">{formatDate(tx.timestamp)}</td>
                <td className="px-4 py-2 text-right">KES {(tx.amount ?? 0).toFixed(2)}</td>
                <td className="px-4 py-2">
                  <Badge variant={getStatusVariant(tx.status)}>
                    {tx.status || "Unknown"}
                  </Badge>
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    className="text-blue-600 hover:underline font-medium"
                    onClick={() => onView(tx)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <div className="bg-blue-1200 text-white rounded-t-lg p-2">
          <div className="grid grid-cols-3 text-xs uppercase font-medium">
            <div className="px-2 py-1">Date</div>
            <div className="px-2 py-1 text-right">Amount</div>
            <div className="px-2 py-1 text-center">View</div>
          </div>
        </div>
        <div className="bg-[#0a0a23] divide-y divide-blue-700">
          {filteredTransactions.map((tx) => (
            <div key={tx.id} className="grid grid-cols-3 p-2 hover:bg-blue-700">
              <div className="px-2 py-1 text-gray-200">
                <div className="text-sm">{formatDate(tx.timestamp)}</div>
                <div className="text-xs text-gray-300">{formatTime(tx.timestamp)}</div>
              </div>
              <div className="px-2 py-1 text-right text-white font-medium">
                KES {(tx.amount ?? 0).toFixed(2)}
              </div>
              <div className="px-2 py-1 flex justify-center items-center">
                <button
                  onClick={() => onView(tx)}
                  className="text-white hover:text-green-300 p-1"
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
