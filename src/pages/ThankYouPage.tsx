import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";

const ThankYouPage = () => {
  const router = useRouter();

  const handleExit = () => {
    if (typeof window !== "undefined") {
      window.close(); // Close the current tab
    }
  };

  const handleGoBack = () => {
    router.back(); // Go back to the previous page
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-6">
          Thank you for using M-Poster payment Platform for M-Pesa
        </h1>
        <h4 className="text-2xl text-green-600 font-bold mb-6">
          If you cancelled the "Enter PIN" prompt and you still wish to make corrections to your entries, you may go BACK to the payments page.
        </h4>
        <div className="flex justify-center gap-4">
          <Button 
            onClick={handleGoBack}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-md"
          >
            Back
          </Button>
          <Button 
            onClick={handleExit}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-6 rounded-md"
          >
            Exit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;