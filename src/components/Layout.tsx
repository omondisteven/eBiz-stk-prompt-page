'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Home, Clock } from 'lucide-react'; // Icons

const tabs = [
  { id: 'home', label: 'Home', path: 'back', icon: Home },
  { id: 'history', label: 'History', path: '/history', icon: Clock },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activeTab, setActiveTab] = useState(router.pathname === '/history' ? 'history' : 'home');

  const handleTabClick = (path: string) => {
    if (path === 'back') {
      router.back();
    } else {
      router.push(path);
    }
  };

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      setActiveTab(url === '/history' ? 'history' : 'home');
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a23] text-white">
      {/* Sticky top nav on desktop */}
      {!isMobile && (
        <div className="sticky top-0 z-50 bg-[#0a0a23] border-b border-gray-700 shadow-md">
          <div className="flex space-x-8 px-4 max-w-4xl mx-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.path)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-green-400 text-green-300'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:pb-0">{children}</main>

      {/* Bottom nav on mobile */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-blue-900 flex justify-around divide-x divide-gray-300 py-2 z-50 shadow-lg md:hidden">
          <div className="w-full max-w-md mx-auto flex justify-around">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.path)}
                  className={`flex items-center justify-center gap-1 w-full px-2 ${
                    activeTab === tab.id ? 'text-green-400 bg-gray-800' : 'text-white hover:bg-gray-800'
                  } py-2 rounded-md transition-colors duration-200`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
