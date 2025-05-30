// src/components/TransactionTable.tsx
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { useAppContext } from '@/context/AppContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Transaction {
  id: string;
  receiptNumber: string;
  timestamp: string;
  amount: number;
  status: 'Success' | 'Failed' | 'Cancelled' | 'Pending';
  phoneNumber: string;
}

export default function TransactionTable() {
  const { data } = useAppContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        if (!data.defaultPhoneNumber) {
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, 'transactions'),
          where('phoneNumber', '==', data.defaultPhoneNumber)
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedTransactions: Transaction[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedTransactions.push({
            id: doc.id,
            receiptNumber: data.receiptNumber || 'N/A',
            timestamp: data.timestamp,
            amount: data.amount || 0,
            status: data.status || 'Pending',
            phoneNumber: data.phoneNumber,
          });
        });

        setTransactions(fetchedTransactions.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [data.defaultPhoneNumber]);

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>;
  }

  if (!data.defaultPhoneNumber) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-gray-500 mb-4">
          No phone number detected. Please make a payment first to store your phone number.
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-gray-500 mb-4">
          No past transactions for this account.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Receipt #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Details
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {transaction.receiptNumber}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(transaction.timestamp), 'PPpp')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Intl.NumberFormat('en-KE', {
                  style: 'currency',
                  currency: 'KES',
                }).format(transaction.amount)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <Badge status={transaction.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button
                  onClick={() => setSelectedTransaction(transaction)}
                  className="text-green-600 hover:text-green-800"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Transaction Details</h3>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Receipt Number</p>
                <p className="font-medium">{selectedTransaction.receiptNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium">
                  {format(new Date(selectedTransaction.timestamp), 'PPpp')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium">
                  {new Intl.NumberFormat('en-KE', {
                    style: 'currency',
                    currency: 'KES',
                  }).format(selectedTransaction.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge status={selectedTransaction.status} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="font-medium">{selectedTransaction.phoneNumber}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}