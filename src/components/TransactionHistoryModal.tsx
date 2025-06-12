// /src/components/TransactionHistoryModal.tsx
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import TransactionTable from "./ui/TransactionTable";
import { HiX } from "react-icons/hi";

export default function TransactionHistoryModal({ phoneNumber, onClose }: {
  phoneNumber: string;
  onClose: () => void;
}) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      const q = query(
        collection(db, "transactions"),
        where("PhoneNumber", "==", Number(phoneNumber)),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(q);
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchTransactions();
  }, [phoneNumber]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-4 relative">
        <button className="absolute top-3 right-3 text-gray-600 hover:text-black" onClick={onClose}>
          <HiX className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold mb-4">Transaction History</h2>

        {transactions.length === 0 ? (
          <p>No past Transactions for this account.</p>
        ) : (
          <TransactionTable transactions={transactions} onView={setSelectedTx} />
        )}

        {/* Nested Details Modal */}
        {selectedTx && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded shadow-lg max-w-md w-full relative">
              <button className="absolute top-2 right-2 text-gray-600" onClick={() => setSelectedTx(null)}>
                <HiX />
              </button>
              <h3 className="text-lg font-semibold mb-2">Transaction Details</h3>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto max-h-64">
                {JSON.stringify(selectedTx, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
