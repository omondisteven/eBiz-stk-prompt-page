import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "react-qr-code";
import {
  Mail, Phone, Globe, MapPin, Share2, Download, Copy, X, Contact, FileDown, Share
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";

const ThankYouPage = () => {
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const [receiptData, setReceiptData] = useState<any>({});
  const [receiptNumber, setReceiptNumber] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [showContact, setShowContact] = useState(false);

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
    const input = showContact ? contactRef.current : receiptRef.current;
    if (!input) return;

    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${showContact ? 'contact' : receiptNumber}.pdf`);
  };

  const handleShare = async () => {
    const input = showContact ? contactRef.current : receiptRef.current;
    if (navigator.share && input) {
      const canvas = await html2canvas(input);
      canvas.toBlob(async (blob) => {
        const file = new File([blob!], `${showContact ? 'contact' : receiptNumber}.png`, { type: "image/png" });
        await navigator.share({
          files: [file],
          title: showContact ? "Contact us directly!" : "Your Receipt",
          text: showContact ? "Here is the contact us directly." : "Here is your transaction receipt.",
        });
      });
    } else {
      alert("Sharing not supported. Please download instead.");
    }
  };

  const downloadContactQR = () => {
    if (contactRef.current) {
      toPng(contactRef.current).then(dataUrl => {
        saveAs(dataUrl, `contact.png`);
      });
    }
  };

  const copyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link)
      .then(() => alert("Link copied to clipboard!"))
      .catch(() => alert("Failed to copy link"));
  };

  const shareContact = async () => {
    if ('share' in navigator && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${receiptData.businessName}'s Contact Card`,
          text: `Here's ${receiptData.businessName}'s contact information`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      copyLink();
    }
  };

  const handleWhatsAppClick = (phoneNumber: string, e: React.MouseEvent) => {
    e.preventDefault();
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.location.href = `whatsapp://send?phone=${phoneNumber}`;
    } else {
      window.open(`https://web.whatsapp.com/send?phone=${phoneNumber}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      {!showContact ? (
        <div
        ref={receiptRef}
        className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center overflow-auto"
      >
        {/* Increased size for businessName */}
        <h2 className="text-2xl font-bold mt-2 mb-1">
          {receiptData.businessName || "Merchant Name"}
        </h2>
        
        <p className="text-sm text-gray-500 mb-1">Receipt No: {receiptNumber}</p>
        <p className="text-sm text-gray-500 mb-4">Date: {timestamp}</p>
        
        {/* Reduced size for "YOUR RECEIPT" heading */}
        <h3 className="text-xl font-bold mb-4">YOUR RECEIPT</h3>
        
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
      
        <hr className="my-4 border-gray-300" />
      
        <div className="mt-2 text-sm text-gray-600 break-words space-y-1">
          {receiptData.businessAddress && <p>{receiptData.businessAddress}</p>}
          {receiptData.businessPhone && <p>Phone: {receiptData.businessPhone}</p>}
          {receiptData.businessEmail && <p>Email: {receiptData.businessEmail}</p>}
        </div>
      </div>
      ) : (
        <div
          ref={contactRef}
          className="bg-white p-6 rounded-lg border-4 border-[#2f363d] shadow-md w-full max-w-md relative" // Added relative positioning
        >
          {/* New close button positioned above the heading */}
          <div className="flex justify-end mb-1">
            <button 
              onClick={() => setShowContact(false)}
              className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
            >
              Close
            </button>
          </div>

          <h2 className="text-xl font-bold mb-4">Contact Information</h2>

          <div className="flex justify-center mb-4 w-full p-4">
            <div className="w-full">
              <QRCode 
                value={JSON.stringify({
                  name: receiptData.businessName,
                  email: receiptData.businessEmail,
                  phone: receiptData.businessPhone,
                  address: receiptData.businessAddress,
                })} 
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                bgColor="transparent"
              />
            </div>
          </div>
          <hr className="border-t border-gray-300 my-2" />

          <div className="space-y-2">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-[#2f363d] hover:text-[#170370] transition-colors">
                {receiptData.businessName}
              </h1>
            </div>

            {/* Phone */}
            {receiptData.businessPhone && (
              <>
                <div className="h-[1px] bg-gray-200 mx-2 my-1"></div>
                <div className="group pl-2 border-l-4 border-gray-500 hover:border-l-8 hover:border-[#170370] hover:bg-[rgba(23,3,112,0.05)] transition-all">
                  <div className="text-xs uppercase font-bold text-gray-500 group-hover:text-[#170370] transition-colors pl-2">
                    Telephone
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="group-hover:text-[#170370] transition-colors pl-2 py-1">
                      {receiptData.businessPhone}
                    </p>
                    <a href={`tel:${receiptData.businessPhone}`} className="p-2 hover:scale-125 transition-transform">
                      <Phone className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            {receiptData.businessEmail && (
              <>
                <div className="h-[1px] bg-gray-200 mx-2 my-1 group-hover:bg-[rgba(23,3,112,0.2)]"></div>
                <div className="group pl-2 border-l-4 border-gray-500 hover:border-l-8 hover:border-[#170370] hover:bg-[rgba(23,3,112,0.05)] transition-all">
                  <div className="text-xs uppercase font-bold text-gray-500 group-hover:text-[#170370] transition-colors pl-2">
                    Email
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="group-hover:text-[#170370] transition-colors pl-2 py-1">
                      {receiptData.businessEmail}
                    </p>
                    <a href={`mailto:${receiptData.businessEmail}`} className="p-2 hover:scale-125 transition-transform">
                      <Mail className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </>
            )}

            {/* Address */}
            {receiptData.businessAddress && (
              <>
                <div className="h-[1px] bg-gray-200 mx-2 my-1"></div>
                <div className="group pl-2 border-l-4 border-gray-500 hover:border-l-8 hover:border-[#170370] hover:bg-[rgba(23,3,112,0.05)] transition-all">
                  <div className="text-xs uppercase font-bold text-gray-500 group-hover:text-[#170370] transition-colors pl-2">
                    Address
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="group-hover:text-[#170370] transition-colors pl-2 py-1">
                      {receiptData.businessAddress}
                    </p>
                    <a 
                      href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(receiptData.businessAddress)}`} 
                      target="_blank" 
                      className="p-2 hover:scale-125 transition-transform"
                    >
                      <MapPin className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </>
            )}

            {/* WhatsApp */}
            {receiptData.businessPhone && (
              <>
                <div className="h-[1px] bg-gray-200 mx-2 my-1"></div>
                <div className="group pl-2 border-l-4 border-gray-500 hover:border-l-8 hover:border-[#170370] hover:bg-[rgba(23,3,112,0.05)] transition-all">
                  <div className="text-xs uppercase font-bold text-gray-500 group-hover:text-[#170370] transition-colors pl-2">
                    WhatsApp
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="group-hover:text-[#170370] transition-colors pl-2 py-1">
                      {receiptData.businessPhone}
                    </p>
                    <a 
                      href="#" 
                      onClick={(e) => handleWhatsAppClick(receiptData.businessPhone, e)}
                      className="p-2 hover:scale-125 transition-transform"
                    >
                      <FaWhatsapp className="w-4 h-4 mr-1 text-green-500" />
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>

          <hr className="border-t border-gray-300 my-4" />

          <div className="flex justify-end gap-2">
            {'share' in navigator && typeof navigator.share === 'function' ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={shareContact}
                className="p-2 hover:bg-gray-100"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyLink}
                className="p-2 hover:bg-gray-100"
              >
                <Copy className="w-4 h-4" />
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={downloadContactQR}
              className="p-2 hover:bg-gray-100"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

<div className="flex justify-between w-full max-w-md mt-6">
        {/* Left-aligned Contact Us button with label */}
        {!showContact && (
          <Button
            onClick={() => setShowContact(true)}
            className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2 rounded flex items-center gap-2"
          >
            <Contact className="w-4 h-4" />
            Contact Us
          </Button>
        )}

        {/* Right-aligned Download and Share icons */}
        {!showContact && (
          <div className="flex items-center gap-4">
            <Download 
              onClick={handleDownload}
              className="w-5 h-5 text-blue-600 cursor-pointer hover:text-blue-700 hover:scale-110 transition-all"
              name="Download Receipt"
            />
            <Share2 
              onClick={handleShare}
              className="w-5 h-5 text-green-600 cursor-pointer hover:text-green-700 hover:scale-110 transition-all"
              name="Share Receipt"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ThankYouPage;