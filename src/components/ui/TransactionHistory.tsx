// src/components/ui/TransactionHistory.tsx
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { HiX, HiReceiptTax } from 'react-icons/hi';
import { useAppContext } from '@/context/AppContext';
import toast from 'react-hot-toast';

interface Transaction {
  id: string;
  phoneNumber: string;
  amount: number;
  receiptNumber: string;
  timestamp: string;
  status: 'Success' | 'Failed' | 'Cancelled';
  details: any;
}

export const TransactionHistory = () => {
  const { data } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Check if we have a phone number in local storage
      const storedPhone = localStorage.getItem('payerPhoneNumber');
      if (!storedPhone) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, 'transactions'),
        where('phoneNumber', '==', storedPhone),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const fetchedTransactions: Transaction[] = [];

      querySnapshot.forEach((doc) => {
        const transactionData = doc.data();
        fetchedTransactions.push({
          id: doc.id,
          phoneNumber: transactionData.phoneNumber,
          amount: transactionData.amount,
          receiptNumber: transactionData.receiptNumber || 'N/A',
          timestamp: new Date(transactionData.timestamp).toLocaleString(),
          status: transactionData.status,
          details: transactionData.details
        });
      });

      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
    }
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedTransaction(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Success':
        return <Badge variant="success">Success</Badge>;
      case 'Failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'Cancelled':
        return <Badge variant="warning">Cancelled</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="ghost"
        className="fixed bottom-4 right-4 shadow-lg rounded-full p-3"
        title="Transaction History"
      >
        <HiReceiptTax className="h-6 w-6" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-xl font-bold">Transaction History</h2>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                <HiX className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {selectedTransaction ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Transaction Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Receipt Number</p>
                      <p>{selectedTransaction.receiptNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p>KES {selectedTransaction.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      {getStatusBadge(selectedTransaction.status)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date & Time</p>
                      <p>{selectedTransaction.timestamp}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Details</p>
                    <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-auto">
                      {JSON.stringify(selectedTransaction.details, null, 2)}
                    </pre>
                  </div>
                  <Button onClick={() => setSelectedTransaction(null)} className="mt-4">
                    Back to List
                  </Button>
                </div>
              ) : loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Receipt
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.receiptNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            KES {transaction.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.timestamp}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {getStatusBadge(transaction.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTransaction(transaction)}
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No past transactions for this account</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};