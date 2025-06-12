// /src/components/TransactionHistoryModal.tsx
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { HiX } from "react-icons/hi";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/button";
import toast from "react-hot-toast";
import TransactionTable from "./ui/TransactionTable";

export default function TransactionHistoryModal({ phoneNumber, onClose }: {
  phoneNumber: string;
  onClose: () => void;
}) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const formattedPhone = String(phoneNumber).startsWith('254') 
          ? String(phoneNumber) 
          : `254${String(phoneNumber).slice(-9)}`;

        const q = query(
            collection(db, "transactions"),
            where("phoneNumber", "==", formattedPhone),
            // orderBy("timestamp", "desc"),
            // orderBy("__name__") // Add this to match the index exactly
            );

        const snapshot = await getDocs(q);
        const txData = snapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id,
            receiptNumber: data.receiptNumber || data.MpesaReceiptNumber,
            amount: data.amount,
            phoneNumber: data.phoneNumber,
            status: data.status,
            timestamp: data.timestamp || data.processedAt?.toDate()?.toISOString(),
            details: data.details
          };
        });

        setTransactions(txData);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };

    if (phoneNumber && phoneNumber.length >= 12) {
      fetchTransactions();
    }
  }, [phoneNumber]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Transaction History</h2>
          <button 
            className="text-gray-600 hover:text-black"
            onClick={onClose}
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 overflow-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <p>No transactions found for this account</p>
              <p className="text-sm mt-2">Transactions will appear here after you make payments</p>
            </div>
          ) : (
            <TransactionTable 
              transactions={transactions} 
              onView={setSelectedTx} 
            />
          )}
        </div>

        {/* Nested Details Modal */}
        {selectedTx && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Transaction Details</h3>
                <button 
                  className="text-gray-600 hover:text-black"
                  onClick={() => setSelectedTx(null)}
                >
                  <HiX className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={
                    selectedTx.status === "Success" ? "success" :
                    selectedTx.status === "Failed" ? "destructive" :
                    selectedTx.status === "Cancelled" ? "warning" : "default"
                  }>
                    {selectedTx.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span>KES {selectedTx.amount?.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Receipt:</span>
                  <span>{selectedTx.receiptNumber || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span>
                    {selectedTx.timestamp ? new Date(selectedTx.timestamp).toLocaleString() : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span>{selectedTx.phoneNumber}</span>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Transaction Details:</h4>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
                  {JSON.stringify(selectedTx.details, null, 2)}
                </pre>
              </div>

              <Button 
                onClick={() => setSelectedTx(null)}
                className="mt-4"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}