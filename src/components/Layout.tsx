import { ReactNode, useState, useRef, useEffect } from "react"; // Import useEffect
import { useRouter } from "next/router";
import Link from "next/link";
import { FaBars, FaTimes, FaHome, FaMoneyBill, FaBuilding, FaUsers, FaExchangeAlt, FaCreditCard, FaQrcode } from "react-icons/fa";

const Layout = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null); // Ref for main content

  const isActive = (path: string) => router.pathname === path;

  const closeSidebar = () => setIsSidebarOpen(false); // Function to close sidebar

  useEffect(() => {
    // Attach the event listener after the component mounts
    const menuButton = document.querySelector("header button"); // Select the button

    if (menuButton) {
      menuButton.addEventListener("click", () => setIsSidebarOpen(true));

      // Clean up the event listener when the component unmounts to prevent memory leaks
      return () => {
        menuButton.removeEventListener("click", () => setIsSidebarOpen(true));
      };
    }
  }, []); // Empty dependency array ensures this runs only once after the initial render

  return (
    <div className="h-screen flex flex-col md:flex-row">
      {/* Mobile Menu Button */}
      <header className="bg-blue-700 text-white p-4 flex items-center justify-between shadow-md md:hidden">
        <button
          onClick={() => setIsSidebarOpen(true)} // Open sidebar
          className="text-white text-3xl cursor-pointer"
          aria-label={isSidebarOpen ? "Close Menu" : "Open Menu"}
        >
          <FaBars /> {/* Always show the bars icon here*/}
        </button>
        <h1 className="text-lg font-bold">eBiz Business Payment Platform</h1>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 left-0 w-4/5 md:w-1/5 bg-gray-900 text-white flex flex-col p-4 space-y-4 shadow-lg h-full z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:relative ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        id="sidebar"
      >
        {/* Close Button (Mobile Only) */}
        <div className="flex justify-end items-center md:hidden">
          <button
            onClick={closeSidebar}
            className="text-white text-3xl cursor-pointer"
            aria-label="Close Menu"
          >
            <FaTimes />
          </button>
        </div>

        <nav className="space-y-2">
          <h2 className="text-xl font-bold">eBiz</h2>
          <Link href="/" className={`flex items-center p-3 rounded-md transition-all ${isActive("/") ? "bg-green-500 text-white" : "hover:bg-gray-700"}`}>
            <FaHome className="mr-2" /> Home
          </Link>
          <Link href="/Till" className={`flex items-center p-3 rounded-md transition-all ${isActive("/Till") ? "bg-green-500 text-white" : "hover:bg-gray-700"}`}>
            <FaMoneyBill className="mr-2" /> Buy Goods
          </Link>
          <Link href="/Paybill" className={`flex items-center p-3 rounded-md transition-all ${isActive("/Paybill") ? "bg-green-500 text-white" : "hover:bg-gray-700"}`}>
            <FaBuilding className="mr-2" /> Pay Bill
          </Link>
          <Link href="/Agent" className={`flex items-center p-3 rounded-md transition-all ${isActive("/Agent") ? "bg-green-500 text-white" : "hover:bg-gray-700"}`}>
            <FaUsers className="mr-2" /> Withdraw Money
          </Link>
          <Link href="/SendMoney" className={`flex items-center p-3 rounded-md transition-all ${isActive("/SendMoney") ? "bg-green-500 text-white" : "hover:bg-gray-700"}`}>
            <FaExchangeAlt className="mr-2" /> Send Money
          </Link>
          <Link href="/QrGenerator" className={`flex items-center p-3 rounded-md transition-all ${isActive("/QrGenerator") ? "bg-green-500 text-white" : "hover:bg-gray-700"}`}>
            <FaQrcode className="mr-2" /> Generate non Mpesa Qr
          </Link>
            {/* Generator to tiny URL */}
          <Link href="/QrToURLGenerator" className={`flex items-center p-3 rounded-md transition-all ${isActive("/QrToURLGenerator") ? "bg-green-500 text-white" : "hover:bg-gray-700"}`}>
            <FaQrcode className="mr-2" /> Generate Qr with tiny URL (WIP)
          </Link>
          <Link href="/QrScannerNormal" className={`flex items-center p-3 rounded-md transition-all ${isActive("/QrScannerNormal") ? "bg-green-500 text-white" : "hover:bg-gray-700"}`}>
            <FaCreditCard className="mr-2" /> Normal QR Scanner
          </Link>

          <Link href="/QrScanner" className={`flex items-center p-3 rounded-md transition-all ${isActive("/QrScanner") ? "bg-green-500 text-white" : "hover:bg-gray-700"}`}>
            <FaCreditCard className="mr-2" /> Non-Mpesa QR Scanner
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div
        className="flex-1 md:ml-1/5"
        ref={mainContentRef}
        onClick={(e) => {
          if (isSidebarOpen) {
            e.stopPropagation(); // Prevent immediate closing
            closeSidebar();
          }
        }}>
        {/* Desktop Header */}
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
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeSidebar} // Close sidebar on overlay click
        ></div>
      )}
    </div>
  );
};

export default Layout;