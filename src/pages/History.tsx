// src/pages/History.tsx
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAppContext } from "@/context/AppContext";
import Layout from "@/components/Layout";
import { FaHistory, FaReceipt, FaSpinner } from "react-icons/fa";
import { MdError } from "react-icons/md";
import { BsCheckCircleFill, BsXCircleFill } from "react-icons/bs";
import Modal from "@/components/ui/modal/modal";

type Transaction = {
  id: string;
  amount: number;
  phoneNumber: string;
  receiptNumber: string;
  timestamp: string;
  status: "Success" | "Failed" | "Cancelled";
  details: any;
};

const HistoryPage = () => {
 
const { data } = useAppContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get phone number from app context (stored when user first pays)
        const userPhone = data.defaultPhoneNumber;
        
        if (!userPhone || userPhone === "254") {
          setLoading(false);
          return;
        }

        const transactionsRef = collection(db, "transactions");
        const q = query(
          transactionsRef,
          where("phoneNumber", "==", userPhone),
          orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(q);
        const fetchedTransactions: Transaction[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedTransactions.push({
            id: doc.id,
            amount: data.amount || 0,
            phoneNumber: data.phoneNumber,
            receiptNumber: data.receiptNumber || "N/A",
            timestamp: data.timestamp,
            status: data.status || "Failed",
            details: data.details
          });
        });

        setTransactions(fetchedTransactions);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Failed to load transaction history");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [data.defaultPhoneNumber]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Success":
        return <BsCheckCircleFill className="text-green-500" />;
      case "Failed":
        return <BsXCircleFill className="text-red-500" />;
      case "Cancelled":
        return <MdError className="text-yellow-500" />;
      default:
        return null;
    }
  };

  const openTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FaHistory /> Transaction History
      </h1>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg">
            {data.defaultPhoneNumber && data.defaultPhoneNumber !== "254"
              ? "No past transactions for this account."
              : "Please complete a transaction to view your history."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="py-3 px-4 text-left">Receipt #</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-right">Amount (KES)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">{txn.receiptNumber}</td>
                  <td className="py-3 px-4">{formatDate(txn.timestamp)}</td>
                  <td className="py-3 px-4 text-right">
                    {txn.amount.toLocaleString("en-KE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getStatusIcon(txn.status)}
                      <span>{txn.status}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => openTransactionDetails(txn)}
                      className="text-blue-500 hover:text-blue-700 flex items-center justify-center gap-1 mx-auto"
                    >
                      <FaReceipt /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Transaction Details Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {selectedTransaction && (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Transaction Details</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-semibold">Receipt Number:</span>
                <span>{selectedTransaction.receiptNumber}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-semibold">Date:</span>
                <span>{formatDate(selectedTransaction.timestamp)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-semibold">Amount:</span>
                <span>
                  {selectedTransaction.amount.toLocaleString("en-KE", {
                    style: "currency",
                    currency: "KES",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-semibold">Status:</span>
                <span className="flex items-center gap-1">
                  {getStatusIcon(selectedTransaction.status)}
                  {selectedTransaction.status}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-semibold">Phone Number:</span>
                <span>{selectedTransaction.phoneNumber}</span>
              </div>
              
              {selectedTransaction.details && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Additional Details:</h3>
                  <div className="bg-gray-100 p-3 rounded">
                    {Array.isArray(selectedTransaction.details) ? (
                      <ul className="space-y-1">
                        {selectedTransaction.details.map((item: any, index: number) => (
                          <li key={index}>
                            <span className="font-medium">{item.Name}:</span> {item.Value}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>{selectedTransaction.details}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

HistoryPage.getLayout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default HistoryPage;