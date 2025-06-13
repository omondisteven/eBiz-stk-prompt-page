// src/components/ui/TransactionTable.tsx
import { Badge } from "./Badge";

export default function TransactionTable({
  transactions,
  onView,
}: {
  transactions: any[];
  onView: (transaction: any) => void;
}) {
  const getStatusVariant = (status: string) => {
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
              <td className="px-4 py-2">{tx.receiptNumber || "N/A"}</td>
              <td className="px-4 py-2">{new Date(tx.timestamp).toLocaleString()}</td>
              <td className="px-4 py-2 text-right">KES {tx.amount?.toFixed(2)}</td>
              <td className="px-4 py-2">
                <Badge variant={getStatusVariant(tx.status)}>{tx.status}</Badge>
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
  );
}
