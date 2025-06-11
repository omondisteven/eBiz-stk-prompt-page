// src/pages/index.tsx
import HomeUI from "@/components/HomeUI";
import { TransactionHistory } from '@/components/ui/TransactionHistory';

  const Home = () => {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 items-center">
        <HomeUI />
        <TransactionHistory />
      </div>
    );
  };

  export default Home;
