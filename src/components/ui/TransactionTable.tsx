// src/components/ui/TransactionTable.tsx
import { Badge } from "./Badge";
import { BadgeProps } from "./Badge";
import { Transaction } from "@/types/transaction";
import { Eye, ArrowUpDown, FilterX, Filter } from "lucide-react";
import { useState } from "react";

interface TransactionTableProps {
  transactions: Transaction[];
  onView: (transaction: Transaction) => void;
}

export default function TransactionTable({
  transactions,
  onView,
}: TransactionTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: 'date' | 'amount';
    direction: 'ascending' | 'descending';
  } | null>(null);
  
  const [amountFilter, setAmountFilter] = useState<{
    min?: number;
    max?: number;
  }>({});

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
      return isNaN(dateObj.getTime()) ? "N/A" : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "N/A";
    }
  };

  const requestSort = (key: 'date' | 'amount') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const applyAmountFilter = (min?: number, max?: number) => {
    setAmountFilter({ min, max });
  };

  const clearAmountFilter = () => {
    setAmountFilter({});
  };

  const getSortedAndFilteredTransactions = () => {
    let filteredTransactions = [...transactions];

    // Apply amount filter
    if (amountFilter.min !== undefined || amountFilter.max !== undefined) {
      filteredTransactions = filteredTransactions.filter(tx => {
        const amount = tx.amount ?? 0;
        return (
          (amountFilter.min === undefined || amount >= amountFilter.min) &&
          (amountFilter.max === undefined || amount <= amountFilter.max)
        );
      });
    }

    // Apply sorting
    if (sortConfig !== null) {
      filteredTransactions.sort((a, b) => {
        if (sortConfig.key === 'date') {
          const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return sortConfig.direction === 'ascending' ? dateA - dateB : dateB - dateA;
        } else {
          const amountA = a.amount ?? 0;
          const amountB = b.amount ?? 0;
          return sortConfig.direction === 'ascending' ? amountA - amountB : amountB - amountA;
        }
      });
    }

    return filteredTransactions;
  };

  const sortedAndFilteredTransactions = getSortedAndFilteredTransactions();

  return (
    <div className="overflow-x-auto rounded-lg shadow border-2 border-green-500">
      {/* Desktop View */}
      <div className="hidden md:block">
        <table className="w-full text-sm text-left text-gray-800">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600 border-b">
            <tr>
              <th className="px-4 py-3">Receipt</th>
              <th className="px-4 py-3">
                <button
                  onClick={() => requestSort('date')}
                  className="flex items-center hover:text-blue-600"
                >
                  Date
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <div className="flex justify-end items-center">
                  <button
                    onClick={() => requestSort('amount')}
                    className="flex items-center hover:text-blue-600 mr-2"
                  >
                    Amount
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </button>
                  <div className="relative group">
                    <Filter className="h-4 w-4 text-gray-500 hover:text-blue-600 cursor-pointer" />
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block p-2">
                      <div className="text-xs text-gray-500 mb-1">Filter Amount</div>
                      <div className="flex space-x-2 mb-2">
                        <input
                          type="number"
                          placeholder="Min"
                          className="w-20 p-1 border rounded text-xs"
                          value={amountFilter.min || ''}
                          onChange={(e) => applyAmountFilter(
                            e.target.value ? Number(e.target.value) : undefined,
                            amountFilter.max
                          )}
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          className="w-20 p-1 border rounded text-xs"
                          value={amountFilter.max || ''}
                          onChange={(e) => applyAmountFilter(
                            amountFilter.min,
                            e.target.value ? Number(e.target.value) : undefined
                          )}
                        />
                      </div>
                      <button
                        onClick={clearAmountFilter}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center"
                      >
                        <FilterX className="h-3 w-3 mr-1" />
                        Clear Filter
                      </button>
                    </div>
                  </div>
                </div>
              </th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredTransactions.map((tx, idx) => (
              <tr
                key={tx.id}
                className={`border-b ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}
              >
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

      {/* Mobile View */}
      <div className="md:hidden">
        <div className="bg-blue-1200 text-white rounded-t-lg p-2">
          <div className="grid grid-cols-3 text-xs uppercase font-medium">
            <div className="px-2 py-1">
              <button
                onClick={() => requestSort('date')}
                className="flex items-center justify-start hover:text-blue-300"
              >
                Date
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </button>
            </div>
            <div className="px-2 py-1 text-right">
              <button
                onClick={() => requestSort('amount')}
                className="flex items-center justify-end hover:text-blue-300"
              >
                Amount
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </button>
            </div>
            <div className="px-2 py-1 text-center">View</div>
          </div>
        </div>
        <div className="bg-[#0a0a23] divide-y divide-blue-700">
          {sortedAndFilteredTransactions.map((tx) => (
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
                  aria-label={`View transaction ${tx.id}`}
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