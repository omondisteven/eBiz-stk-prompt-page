// /src/components/TransactionDetails.tsx
"use client";

import { useRef } from "react";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
    
    // Add padding to the captured content
    const element = contentRef.current;
    const originalPadding = element.style.padding;
    element.style.padding = '16px'; // Add some padding
    
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Restore original padding
    element.style.padding = originalPadding;

    if (format === "pdf") {
      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Center the image on the page
      const x = 0;
      const y = 0;
      pdf.addImage(imgData, "PNG", x, y, pdfWidth, pdfHeight);
      pdf.save(`Transaction_${transaction.receiptNumber || "details"}.pdf`);
    } else {
      const link = document.createElement("a");
      link.download = `Transaction_${transaction.receiptNumber || "details"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  const shareAs = async (format: "pdf" | "png") => {
    if (!contentRef.current) return;
    
    try {
      if (format === "pdf") {
        // For PDF sharing, we'll create a blob and share it
        const canvas = await html2canvas(contentRef.current, {
          scale: 2,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        const pdfBlob = pdf.output('blob');
        
        await navigator.share({
          files: [new File([pdfBlob], `Transaction_${transaction.receiptNumber || "details"}.pdf`, { 
            type: 'application/pdf' 
          })],
          title: 'Transaction Details',
          text: 'Here is the transaction details PDF',
        });
      } else {
        // For PNG sharing
        const canvas = await html2canvas(contentRef.current, {
          scale: 2,
          backgroundColor: '#ffffff'
        });
        
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          
          await navigator.share({
            files: [new File([blob], `Transaction_${transaction.receiptNumber || "details"}.png`, {
              type: 'image/png'
            })],
            title: 'Transaction Details',
            text: 'Here is the transaction details image',
          });
        }, 'image/png');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      alert('Sharing failed. Please try again or use download instead.');
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

        <div 
          ref={contentRef} 
          className="overflow-y-auto space-y-4 p-4" 
          style={{ backgroundColor: 'white' }}
            >
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

        {/* Action Buttons with Dropdown Menus */}
        <div className="flex justify-around mt-4 pt-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-blue-600 hover:text-blue-800">
                <Share2 className="mr-2 h-4 w-4 text-blue-600" /> Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => shareAs("pdf")}>Share as PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => shareAs("png")}>Share as PNG</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-green-600 hover:text-green-800">
                <Download className="mr-2 h-4 w-4 text-green-600" /> Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => downloadAs("pdf")}>Download as PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadAs("png")}>Download as PNG</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
