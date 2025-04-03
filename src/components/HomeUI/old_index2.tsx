//HomeUI (home page)
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

const HomeUI = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false); // This state is no longer needed

  const isActive = (path: string) => router.pathname === path;

  return (
    <div className="flex h-screen">
      {/* Mobile Sidebar Toggle Button - REMOVE THIS */}
      {/* <button  onClick={() => setIsOpen(!isOpen)} className="absolute top-4 left-4 md:hidden z-50 p-2 bg-gray-900 text-white rounded-md">
        {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button> */}      

      {/* Main Content */}
      <main className="flex-1 bg-gray-100 text-gray-900 p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6">Welcome to eBiz</h1>
        <p>Select a transaction type from the navigation.</p>
      </main>
    </div>
  );
};

export default HomeUI;