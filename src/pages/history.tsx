// src/pages/history.tsx
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, getDoc, doc } from "firebase/firestore";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import TransactionTable from "@/components/ui/TransactionTable";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { Transaction } from "@/types/transaction";

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  // const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
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
        const formattedPhone = String(phoneNumber).startsWith("254")
          ? String(phoneNumber)
          : `254${String(phoneNumber).slice(-9)}`;

        console.log("Fetching transactions for:", formattedPhone);

        // Fetch all transactions first
        const snapshot = await getDocs(collection(db, "transactions"));

        // Normalize and filter by phone number
        // Update the txData mapping in fetchTransactions
        const txData = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            const phone = data.phoneNumber || data.PhoneNumber || "";
            
            return {
              id: doc.id,
              receiptNumber: data.receiptNumber || data.MpesaReceiptNumber || "N/A",
              amount: Number(data.amount ?? data.Amount ?? 0),
              phoneNumber: phone,
              status: data.status ?? "Unknown",
              timestamp: 
                data.timestamp?.toDate?.()?.toISOString() ||
                data.processedAt?.toDate?.()?.toISOString() ||
                data.Timestamp || 
                new Date().toISOString(),
              details: data.details || [],
              AccountNumber: data.AccountNumber || "N/A",
              PaybillNumber: data.PaybillNumber || "N/A",
              TransactionType: data.TransactionType || "N/A",
            };
          })
          .filter((tx) => tx.phoneNumber === formattedPhone);

        console.log("Fetched transactions:", txData);
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

  // Add this function to history.tsx
    const fetchTransactionDetails = async (id: string, fallbackTx: Transaction): Promise<Transaction> => {
      try {
        const docRef = doc(db, "transactions", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Return the complete transaction data with fallbacks
          return {
            id: docSnap.id,
            receiptNumber: data.receiptNumber || data.MpesaReceiptNumber || fallbackTx.receiptNumber || "N/A",
            amount: Number(data.amount ?? data.Amount ?? fallbackTx.amount ?? 0),
            phoneNumber: data.phoneNumber || data.PhoneNumber || fallbackTx.phoneNumber || "N/A",
            status: data.status ?? fallbackTx.status ?? "Unknown",
            timestamp: data.timestamp?.toDate?.()?.toISOString() || 
                      data.processedAt?.toDate?.()?.toISOString() || 
                      data.Timestamp ||
                      fallbackTx.timestamp,
            details: data.details || fallbackTx.details || [],
            AccountNumber: data.AccountNumber || fallbackTx.AccountNumber || "N/A",
            PaybillNumber: data.PaybillNumber || fallbackTx.PaybillNumber || "N/A",
            TransactionType: data.TransactionType || fallbackTx.TransactionType || "N/A",
          };
        }
        return fallbackTx;
      } catch (error) {
        console.error("Error fetching transaction details:", error);
        return fallbackTx;
      }
    };
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
        onView={async (tx: Transaction) => {
          setLoading(true);
          const details = await fetchTransactionDetails(tx.id, tx);
          console.log("Modal Transaction Details:", details);
          setSelectedTx(details);
          setLoading(false);
        }}
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

            {(() => {
              const {
                status,
                amount,
                receiptNumber,
                timestamp,
                phoneNumber,
                TransactionType,
                PaybillNumber,
                AccountNumber,
                details
              } = selectedTx;

              return (
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={
                      status === "Success" ? "success" :
                      status === "Failed" ? "destructive" :
                      status === "Cancelled" ? "warning" : "default"
                    }>
                      {status || "Unknown"}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span>{amount ? `KES ${amount.toLocaleString('en-KE')}` : "N/A"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Receipt Number:</span>
                    <span>{receiptNumber || "N/A"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span>{timestamp ? new Date(timestamp).toLocaleString() : "N/A"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone Number:</span>
                    <span>{phoneNumber || "N/A"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction Type:</span>
                    <span>{TransactionType || "N/A"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Paybill Number:</span>
                    <span>{PaybillNumber || "N/A"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Number:</span>
                    <span>{AccountNumber || "N/A"}</span>
                  </div>

                  {Array.isArray(details) && details.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium text-gray-600 mb-2">Additional Details:</h4>
                      {details
                        .filter(detail => detail?.Name && detail?.Value)
                        .map((detail, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-gray-600">{detail.Name}:</span>
                            <span>{String(detail.Value)}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <Button onClick={() => setSelectedTx(null)} className="mt-4">
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