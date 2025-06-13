// src/components/Layout.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Home, Clock } from 'lucide-react'; // icons for Home and History

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activeTab, setActiveTab] = useState(router.pathname === '/history' ? 'history' : 'home');
  const [prevPath, setPrevPath] = useState<string | null>(null);

  const handleTabClick = (path: string) => {
    if (path === 'back') {
      router.back();
    } else {
      router.push(path);
    }
  };

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      setPrevPath(router.pathname);
      setActiveTab(url === '/history' ? 'history' : 'home');
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.pathname]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main content with padding to avoid overlap with bottom nav */}
      <main className="flex-1 md:pb-0">{children}</main>

      {isMobile ? (
        // Mobile bottom navigation
        <div className="fixed bottom-0 left-0 right-0 bg-blue-1000 flex justify-around divide-x divide-gray-300 py-2 z-50 shadow-lg md:hidden">
          <div className="w-full max-w-md mx-auto flex justify-around">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.path)}
                  className={`flex items-center justify-center gap-1 w-full px-2 ${
                    activeTab === tab.id ? 'text-green-400' : 'text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
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
  { id: 'home', label: 'Home', path: 'back', icon: Home },
  { id: 'history', label: 'History', path: '/history', icon: Clock },
];

