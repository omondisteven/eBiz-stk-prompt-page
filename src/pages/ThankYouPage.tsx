import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";

const ThankYouPage = () => {
  const router = useRouter();

  const handleExit = () => {
    if (typeof window !== "undefined") {
      window.close(); // Close the current tab
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-6">
          Thank you for using M-Poster payment Platform for M-Pesa
        </h1>
        <h4 className="text-2xl text-color:green font-bold mb-6">
        if you cancelled the "Enter PIN" prompt and you still wish to make corrections your entries, you may go BACK to the payments page if you cancelled the "Enter PIN" prompt and wish to correct your entries
        </h4>
        <Button 
          onClick={handleExit}
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-6 rounded-md"
        >
          Exit
        </Button>
      </div>
    </div>
  );
};

export default ThankYouPage;