// src/pages/history.tsx
import Layout from '@/components/Layout';
import TransactionTable from '@/components/TransactionTable';

export default function HistoryPage() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Transaction History</h1>
          <TransactionTable />
        </div>
      </div>
    </Layout>
  );
}