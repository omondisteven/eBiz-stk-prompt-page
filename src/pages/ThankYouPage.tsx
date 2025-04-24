import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { HiDownload, HiShare } from "react-icons/hi";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import toast from 'react-hot-toast';

const ThankYouPage = () => {
  const router = useRouter();
  const [receiptData, setReceiptData] = useState<any>({});
  const [receiptNumber, setReceiptNumber] = useState("");
  // const { data: appData } = useAppContext();

  useEffect(() => {
    if (router.query.data) {
      const parsedData = JSON.parse(decodeURIComponent(router.query.data as string));
      setReceiptData(parsedData);
      // Generate a random receipt number (8 alphanumeric characters)
      setReceiptNumber("RCPT-" + Math.random().toString(36).substring(2, 10).toUpperCase());
    }
  }, [router.query]);

  const handleExit = () => {
    if (typeof window !== "undefined") {
      window.location.href = "about:blank";
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const downloadReceipt = () => {
    const receiptElement = document.getElementById("receipt");
    if (receiptElement) {
      html2canvas(receiptElement).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`receipt_${receiptNumber}.pdf`);
      });
    }
  };

  const shareReceipt = async () => {
    const receiptElement = document.getElementById("receipt");
    if (receiptElement) {
      try {
        const canvas = await html2canvas(receiptElement);
        const image = canvas.toDataURL("image/png");
        
        if (navigator.share) {
          // Convert base64 to blob
          const blob = await (await fetch(image)).blob();
          const file = new File([blob], "receipt.png", { type: "image/png" });
          
          await navigator.share({
            title: "Payment Receipt",
            text: `Receipt for ${receiptData.TransactionType} payment`,
            files: [file]
          });
        } else {
          // Fallback for browsers that don't support sharing files
          const link = document.createElement("a");
          link.href = image;
          link.download = `receipt_${receiptNumber}.png`;
          link.click();
        }
      } catch (err) {
        console.error("Error sharing:", err);
        toast.error("Sharing failed. You can download the receipt instead.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        {/* Receipt Component */}
        <div id="receipt" className="p-6 border border-gray-200 rounded-lg">
          <h1 className="text-2xl font-bold text-center mb-6">YOUR RECEIPT</h1>
          
          {/* Name Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">{receiptData.Name || receiptData.FirstName}</h2>
            <div className="space-y-1">
              <div>{receiptData.TransactionType}</div>
              {receiptData.Amount && (
                <div className="text-3xl font-bold text-center my-4">
                  KSHS {receiptData.Amount}
                </div>
              )}
            </div>
          </div>

          {/* Receipt Details */}
          <div className="border-t border-b border-gray-200 py-4 my-4">
            <div className="flex justify-between mb-2">
              <span>Receipt No:</span>
              <span className="font-medium">{receiptNumber}</span>
            </div>
            {receiptData.PaybillNumber && (
              <div className="flex justify-between mb-2">
                <span>Paybill:</span>
                <span className="font-medium">{receiptData.PaybillNumber}</span>
              </div>
            )}
            {receiptData.AccountNumber && (
              <div className="flex justify-between mb-2">
                <span>Account:</span>
                <span className="font-medium">{receiptData.AccountNumber}</span>
              </div>
            )}
            {receiptData.TillNumber && (
              <div className="flex justify-between mb-2">
                <span>Till No:</span>
                <span className="font-medium">{receiptData.TillNumber}</span>
              </div>
            )}
            {receiptData.RecepientPhoneNumber && (
              <div className="flex justify-between mb-2">
                <span>Recipient:</span>
                <span className="font-medium">{receiptData.RecepientPhoneNumber}</span>
              </div>
            )}
            <div className="flex justify-between mb-2">
              <span>Date:</span>
              <span className="font-medium">{new Date().toLocaleString()}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm">
            <div>{receiptData.Address || receiptData.address}</div>
            <div>{receiptData.businessPhone || receiptData.PhoneNumber || receiptData.whatsappnumber}</div>
            <div>{receiptData.Email || receiptData.email}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
          <Button 
            onClick={downloadReceipt}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center"
          >
            <HiDownload className="mr-2" />
            Download
          </Button>
          <Button 
            onClick={shareReceipt}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md flex items-center"
          >
            <HiShare className="mr-2" />
            Share
          </Button>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <Button 
            onClick={handleGoBack}
            className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-md"
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