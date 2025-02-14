// Layout.tsx
import { ReactNode, useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  FaBars, FaTimes, FaHome, FaMoneyBill, FaBuilding, FaUsers,
  FaExchangeAlt, FaCreditCard, FaQrcode, FaChevronDown, FaChevronRight, FaCog
} from "react-icons/fa";

const Layout = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNonMpesaQrOpen, setIsNonMpesaQrOpen] = useState(false);
  const [isNormalQrOpen, setIsNormalQrOpen] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => router.pathname === path;
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="h-screen flex flex-col md:flex-row">
      {/* Mobile Menu Button */}
      <header className="bg-blue-700 text-white p-4 flex items-center justify-between shadow-md md:hidden">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="text-white text-3xl cursor-pointer"
          aria-label="Open Menu"
        >
          <FaBars />
        </button>
        <h1 className="text-lg font-bold">eBiz Business Payment Platform</h1>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 left-0 w-4/5 md:w-1/5 bg-gray-900 text-white flex flex-col p-4 space-y-4 shadow-lg h-full z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:relative ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        id="sidebar"
      >
        {/* Close Button (Mobile Only) */}
        <div className="flex justify-end items-center md:hidden">
          <button onClick={closeSidebar} className="text-white text-3xl cursor-pointer">
            <FaTimes />
          </button>
        </div>

        <nav className="space-y-2">
          <h2 className="text-xl font-bold">eBiz</h2>
          <Link href="/" className={`flex items-center p-3 rounded-md transition-all ${isActive("/") ? "bg-green-500 text-white" : "hover:bg-gray-700"}`}>
            <FaHome className="mr-2" /> Home
          </Link>

          {/* Divider with centered label */}
          <div className="flex items-center my-2">
            <div className="flex-grow border-t border-gray-100"></div>
            <h3 className="text-sm font-bold text-gray-400 px-3 whitespace-nowrap">M-PESA TRANSACTIONS</h3>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>
          <Link href="/Paybill" className={`flex items-center p-3 rounded-md transition-all ${isActive("/Paybill") ? "bg-green-500 text-white" : "hover:bg-gray-700"}`}>
            <FaBuilding className="mr-2" /> Pay Bill
          </Link>
          <Link href="/Till" className={`flex items-center p-3 rounded-md transition-all ${isActive("/Till") ? "bg-green-500 text-white" : "hover:bg-gray-700"}`}>
            <FaMoneyBill className="mr-2" /> Buy Goods
          </Link>
          <Link href="/SendMoney" className={`flex items-center p-3 rounded-md transition-all ${isActive("/SendMoney") ? "bg-green-500 text-white" : "hover:bg-gray-700"}`}>
            <FaExchangeAlt className="mr-2" /> Send Money
          </Link>
          <Link href="/Agent" className={`flex items-center p-3 rounded-md transition-all ${isActive("/Agent") ? "bg-green-500 text-white" : "hover:bg-gray-700"}`}>
            <FaUsers className="mr-2" /> Withdraw Money
          </Link>

          {/* Divider with centered label */}
          <div className="flex items-center my-2">
            <div className="flex-grow border-t border-gray-100"></div>
            <h3 className="text-sm font-bold text-gray-400 px-3 whitespace-nowrap">QR CODES</h3>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          {/* Collapsible "Normal Qr" Section */}
          <button
            className="flex items-center w-full p-3 rounded-md transition-all hover:bg-gray-700 focus:outline-none"
            onClick={() => setIsNormalQrOpen(!isNormalQrOpen)}
          >
            <FaQrcode className="mr-2" />
            Normal Qr (with short URL)
            <span className="ml-auto">{isNormalQrOpen ? <FaChevronDown /> : <FaChevronRight />}</span>
          </button>
          {isNormalQrOpen && (
            <div className="ml-6 space-y-2 transition-all">
              <Link href="/QrToURLGenerator" className={`flex items-center p-3 rounded-md transition-all ${isActive("/QrToURLGenerator") ? "bg-green-500 text-white" : "hover:bg-gray-700"}`}>
                <FaQrcode className="mr-2" /> Generate Qr
              </Link>
              <Link href="/QrScannerNormal" className={`flex items-center p-3 rounded-md transition-all ${isActive("/QrScannerNormal") ? "bg-green-500 text-white" : "hover:bg-gray-700"}`}>
                <FaCreditCard className="mr-2" /> Scan QR
              </Link>
            </div>
          )}

          {/* Settings Link */}
          <Link href="/Settings" className={`flex items-center p-3 rounded-md transition-all ${isActive("/Settings") ? "bg-green-500 text-white" : "hover:bg-gray-700"}`}>
            <FaCog className="mr-2" /> Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-1/5" ref={mainContentRef} onClick={() => isSidebarOpen && closeSidebar()}>
        <header className="hidden md:flex bg-blue-700 text-white p-4 items-center shadow-md">
          <FaCreditCard className="text-3xl mr-2" />
          <h1 className="text-2xl font-bold">Welcome to eBiz Business Payment Platform</h1>
        </header>

        <main className="bg-gray-100 text-gray-900 p-6 rounded-lg shadow-md">
          {children}
        </main>

        {/* Footer */}
        <footer className="text-center py-2 text-white bg-gray-500">
          Built in 🇰🇪 by
          <Link href="https://bltasolutions.co.ke/" target="_blank" className="font-bold underline ml-1">
            BLTA Solutions (K) Limited
          </Link>
        </footer>
      </div>

      {/* Overlay for Mobile */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={closeSidebar}></div>}
    </div>
  );
};

export default Layout;