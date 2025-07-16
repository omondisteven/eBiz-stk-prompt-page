"use client";

import { useRef } from "react";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/button";
import { Transaction } from "@/types/transaction";
import { Share2, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface TransactionDetailsProps {
  transaction: Transaction;
  onClose: () => void;
}

export default function TransactionDetails({ transaction, onClose }: TransactionDetailsProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return isNaN(dateObj.getTime()) ? "N/A" : dateObj.toLocaleString();
    } catch {
      return "N/A";
    }
  };

  const getStatusVariant = (status?: string) => {
    switch (status) {
      case "Success": return "success";
      case "Failed": return "destructive";
      case "Cancelled": return "warning";
      default: return "default";
    }
  };

  const renderDetailRow = (label: string, value: any) => (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}:</span>
      <span className="text-blue-800">{value || "N/A"}</span>
    </div>
  );

  const downloadAs = async (format: "pdf" | "png") => {
    if (!contentRef.current) return;
    if (format === "pdf") {
      const canvas = await html2canvas(contentRef.current);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Transaction_${transaction.receiptNumber || "details"}.pdf`);
    } else {
      const canvas = await html2canvas(contentRef.current);
      const img = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = img;
      link.download = `Transaction_${transaction.receiptNumber || "details"}.png`;
      link.click();
    }
  };

  const shareAs = async (format: "pdf" | "png") => {
    if (!navigator.canShare) {
      alert("Sharing not supported on this device/browser.");
      return;
    }

    if (!contentRef.current) return;
    const canvas = await html2canvas(contentRef.current);
    const blob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(blob => resolve(blob), "image/png");
    });
    if (!blob) return;

    const fileName = `Transaction_${transaction.receiptNumber || "details"}.${format}`;
    const file = new File([blob], fileName, { type: "image/png" });

    try {
      await navigator.share({
        files: [file],
        title: "Transaction Details",
        text: "See the attached transaction details.",
      });
    } catch (err) {
      console.error("Sharing failed:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onClose} aria-label="Close details" className="text-gray-600 hover:text-black">
            ✕
          </button>
        </div>

        <div ref={contentRef} className="overflow-y-auto space-y-4">
          {/* Header Section */}
          <div className="text-center">
            <h3 className="text-xl font-bold" style={{ color: "#0c0246ff" }}>BLTA Solutions Limited</h3>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#09c95fff" }}>M-POSTER TRANSACTION DETAILS</h2>
            <h4 className="text-lg mb-4" style={{ color: "#0c0246ff" }}>{transaction.TransactionType || "N/A"}</h4>
            <h3 className="text-2xl font-bold mb-2" style={{ color: "#09c95fff" }}>
              KES {typeof transaction.amount === "number" ? transaction.amount.toFixed(2) : "0.00"}
            </h3>
            <div className="flex justify-center items-center gap-2 mb-4">
              <strong className="text-black">MPESA REF#</strong>
              <span className="text-black">{transaction.receiptNumber || "N/A"}</span>
            </div>
            <div className="border-b border-gray-200 mb-4"></div>
          </div>

          {/* Details Section */}
          <div className="space-y-2">
            {renderDetailRow("Status",
              <Badge variant={getStatusVariant(transaction.status)}>
                {transaction.status || "N/A"}
              </Badge>
            )}
            {renderDetailRow("Date", formatDate(transaction.timestamp))}
            {renderDetailRow("Phone Number", transaction.phoneNumber)}
            {renderDetailRow("Paybill Number", transaction.PaybillNumber)}
            {renderDetailRow("Account Number", transaction.AccountNumber)}

            {transaction.details && transaction.details.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium text-gray-600 mb-2">Additional Details:</h4>
                {Array.isArray(transaction.details) ? (
                  transaction.details
                    .filter(detail => detail.Name && detail.Value)
                    .map((detail, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-600">{detail.Name}:</span>
                        <span>{String(detail.Value)}</span>
                      </div>
                    ))
                ) : (
                  Object.entries(transaction.details)
                    .filter(([key, value]) => key && value)
                    .map(([key, value], index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-600">{key}:</span>
                        <span>{String(value)}</span>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-around mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => {
            const choice = confirm("Share as PDF? (Cancel for PNG)");
            shareAs(choice ? "pdf" : "png");
          }}>
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>

          <Button variant="outline" onClick={() => {
            const choice = confirm("Download as PDF? (Cancel for PNG)");
            downloadAs(choice ? "pdf" : "png");
          }}>
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
        </div>
      </div>
    </div>
  );
}
