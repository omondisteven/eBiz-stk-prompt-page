// src/components/Layout.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activeTab, setActiveTab] = useState(router.pathname === '/history' ? 'history' : '');
  const [prevPath, setPrevPath] = useState<string | null>(null);

  const handleTabClick = (path: string) => {
    if (path === 'back') {
      router.back(); // Always navigate to previous page
    } else {
      router.push(path);
    }
  };

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      setPrevPath(router.pathname);
      setActiveTab(url === '/history' ? 'history' : '');
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.pathname]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main content with padding to avoid overlap with bottom nav */}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>

      {isMobile ? (
        // Mobile bottom navigation
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50 shadow-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.path)}
              className={`flex flex-col items-center p-2 w-full ${
                activeTab === tab.id ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      ) : (
        // Desktop tabs
        <div className="bg-white border-b border-gray-200">
          <div className="flex space-x-8 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.path)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const tabs = [
  { id: 'home', label: 'Home', path: 'back' }, // changed to Back
  { id: 'history', label: 'History', path: '/history' },
];
