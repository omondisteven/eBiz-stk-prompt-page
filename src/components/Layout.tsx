// src/components/Layout.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activeTab, setActiveTab] = useState(router.pathname === '/history' ? 'history' : 'home');

  const tabs = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'history', label: 'History', path: '/history' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {isMobile ? (
        // Mobile bottom navigation
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-10">
          {tabs.map((tab) => (
            <Link href={tab.path} key={tab.id} passHref>
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center p-2 ${activeTab === tab.id ? 'text-green-600' : 'text-gray-500'}`}
              >
                <span className="text-sm">{tab.label}</span>
              </button>
            </Link>
          ))}
        </div>
      ) : (
        // Desktop tabs
        <div className="bg-white border-b border-gray-200">
          <div className="flex space-x-8 px-4">
            {tabs.map((tab) => (
              <Link href={tab.path} key={tab.id} passHref>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  {tab.label}
                </button>
              </Link>
            ))}
          </div>
        </div>
      )}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
    </div>
  );
}