// src/pages/history.tsx
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import TransactionTable from "@/components/ui/TransactionTable";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get phone number from localStorage
    const getPhoneNumber = () => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('payerPhoneNumber') || null;
      }
      return null;
    };

    const phone = getPhoneNumber();
    setPhoneNumber(phone);

    if (!phone) {
      router.push('/');
      return;
    }
  }, [router]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        if (!phoneNumber) return;

        setLoading(true);
        const formattedPhone = String(phoneNumber).startsWith('254') 
          ? String(phoneNumber) 
          : `254${String(phoneNumber).slice(-9)}`;

        console.log("Fetching transactions for:", formattedPhone); // Debug log

        const q = query(
          collection(db, "transactions"),
          where("phoneNumber", "==", formattedPhone),
        //   orderBy("timestamp", "desc")
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
            timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp || data.processedAt?.toDate?.()?.toISOString(),
            details: data.details
          };
        });

        console.log("Fetched transactions:", txData); // Debug log
        setTransactions(txData);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (phoneNumber && phoneNumber.length >= 12) {
      fetchTransactions();
    }
  }, [phoneNumber]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl text-white font-bold mb-6">Transaction History</h1>
      
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

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Transaction Details</h3>
              <button 
                className="text-gray-600 hover:text-black"
                onClick={() => setSelectedTx(null)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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

            {/* <div className="mt-4">
              <h4 className="font-medium mb-2">Transaction Details:</h4>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span>{selectedTx.phoneNumber}</span>
               </div>
            </div> */}

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
  );
}

TransactionHistoryPage.getLayout = function getLayout(page: React.ReactNode) {
  return <Layout>{page}</Layout>;
};