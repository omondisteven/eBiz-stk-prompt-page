// /src/components/ui/TransactionTable.tsx
import { Badge } from "./Badge";

export default function TransactionTable({ transactions, onView }: {
  transactions: any[],
  onView: (transaction: any) => void
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
    <table className="w-full table-auto border-collapse text-sm">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 text-left">Receipt</th>
          <th className="p-2 text-left">Date</th>
          <th className="p-2 text-right">Amount</th>
          <th className="p-2 text-left">Status</th>
          <th className="p-2">Details</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((tx) => (
          <tr key={tx.id} className="border-b hover:bg-gray-50">
            <td className="p-2">{tx.receiptNumber || "N/A"}</td>
            <td className="p-2">{new Date(tx.timestamp).toLocaleString()}</td>
            <td className="p-2 text-right">KES {tx.amount?.toFixed(2)}</td>
            <td className="p-2">
              <Badge variant={getStatusVariant(tx.status)}>
                {tx.status}
              </Badge>
            </td>
            <td className="p-2 text-center">
              <button
                className="text-blue-600 hover:underline"
                onClick={() => onView(tx)}
              >
                View
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}