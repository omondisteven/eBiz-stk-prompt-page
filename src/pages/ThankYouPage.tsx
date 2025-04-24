import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "react-qr-code";

const ThankYouPage = () => {
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [receiptData, setReceiptData] = useState<any>({});
  const [receiptNumber, setReceiptNumber] = useState("");
  const [timestamp, setTimestamp] = useState("");

  useEffect(() => {
    if (router.query.data) {
      const parsedData = JSON.parse(decodeURIComponent(router.query.data as string));
      setReceiptData(parsedData);

      const randomRef = "RCPT-" + Math.random().toString(36).substring(2, 10).toUpperCase();
      setReceiptNumber(randomRef);

      const now = new Date();
      const formatted = now.toLocaleString("en-KE", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setTimestamp(formatted);
    }
  }, [router.query]);

  const handleDownload = async () => {
    const input = receiptRef.current;
    if (!input) return;

    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${receiptNumber}.pdf`);
  };

  const handleShare = async () => {
    if (navigator.share && receiptRef.current) {
      const canvas = await html2canvas(receiptRef.current);
      canvas.toBlob(async (blob) => {
        const file = new File([blob!], `${receiptNumber}.png`, { type: "image/png" });
        await navigator.share({
          files: [file],
          title: "Your Receipt",
          text: "Here is your transaction receipt.",
        });
      });
    } else {
      alert("Sharing not supported. Please download the receipt instead.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div
        ref={receiptRef}
        className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center overflow-auto"
      >
        <h2 className="text-lg font-semibold mt-2 mb-1">
          {receiptData.businessName || "Merchant Name"}
        </h2>
        <p className="text-sm text-gray-500 mb-1">Receipt No: {receiptNumber}</p>
        <p className="text-sm text-gray-500 mb-4">Date: {timestamp}</p>
        
        <h3 className="text-2xl font-bold font-underline mb-4">YOUR RECEIPT</h3>
        <p>{receiptData.TransactionType}</p>

        <p className="text-3xl text-green-700 font-bold my-4">
          KSHS {receiptData.Amount}
        </p>

        <QRCode
          value={JSON.stringify({
            receiptNumber,
            businessName: receiptData.businessName,
            amount: receiptData.Amount,
            timestamp,
          })}
          size={128}
          className="mx-auto my-4"
        />

        {/* Divider added here */}
        <hr className="my-4 border-gray-300" />

        {/* Footer Section with spacing, word wrapping and captions */}
        <div className="mt-2 text-sm text-gray-600 break-words space-y-1">
          {receiptData.businessAddress && <p>{receiptData.businessAddress}</p>}
          {receiptData.businessPhone && <p>Phone: {receiptData.businessPhone}</p>}
          {receiptData.businessEmail && <p>Email: {receiptData.businessEmail}</p>}
        </div>

      </div>

      <div className="flex gap-4 mt-6">
        <Button
          onClick={handleDownload}
          className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded"
        >
          Download
        </Button>
        <Button
          onClick={handleShare}
          className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded"
        >
          Share
        </Button>
      </div>
    </div>
  );
};

export default ThankYouPage;