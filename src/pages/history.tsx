// src/pages/history.tsx
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, getDoc, doc } from "firebase/firestore";
// import { Badge } from "@/components/ui/Badge";
// import { Button } from "@/components/ui/button";
import TransactionTable from "@/components/ui/TransactionTable";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { Transaction } from "@/types/transaction";
import TransactionDetails from "@/components/TransactionDetails";

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

  // In your history.tsx
    const normalizeTransaction = (docData: any): Transaction => {
      // Handle both array and object details
      let details = docData.details || [];
      if (!Array.isArray(details) && typeof details === 'object') {
        details = Object.entries(details).map(([key, value]) => ({ 
          Name: key, 
          Value: value 
        }));
      }

      return {
        id: docData.id,
        receiptNumber: docData.receiptNumber || docData.MpesaReceiptNumber || 'N/A',
        amount: Number(docData.amount || docData.Amount || 0),
        phoneNumber: docData.phoneNumber || docData.PhoneNumber || 'N/A',
        status: docData.status || 'Unknown',
        timestamp: docData.timestamp?.toDate?.()?.toISOString() || 
                  docData.processedAt?.toDate?.()?.toISOString() || 
                  docData.Timestamp ||
                  new Date().toISOString(),
        details,
        AccountNumber: docData.AccountNumber || 'N/A',
        PaybillNumber: docData.PaybillNumber || 'N/A',
        TransactionType: docData.TransactionType || 'N/A',
      };
    };

    const fetchTransactionDetails = async (id: string): Promise<Transaction | null> => {
      try {
        const docRef = doc(db, "transactions", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return normalizeTransaction({ id: docSnap.id, ...docSnap.data() });
        }
        return null;
      } catch (error) {
        console.error("Error fetching transaction details:", error);
        return null;
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
          onView={async (tx) => {
            setLoading(true);
            const details = await fetchTransactionDetails(tx.id);
            if (details) {
              setSelectedTx(details);
            }
            setLoading(false);
          }}
        />
      )}

      {selectedTx && (
        <TransactionDetails 
          transaction={selectedTx} 
          onClose={() => setSelectedTx(null)} 
        />
      )}
    </div>
  );
}

TransactionHistoryPage.getLayout = function getLayout(page: React.ReactNode) {
  return <Layout>{page}</Layout>;
};