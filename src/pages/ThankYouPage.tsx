// /src/pages/ThankYouPage.tsx
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "react-qr-code";
import toast from "react-hot-toast";
import {
  Mail, Phone, Globe, MapPin, Share2, Download, Copy, X, Contact, FileDown, Share, Printer
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";
import { MousePointerClick } from "lucide-react";

const ThankYouPage = () => {
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const [receiptData, setReceiptData] = useState<any>({});
  const [receiptNumber, setReceiptNumber] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [showContact, setShowContact] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showContactInstructionModal, setShowContactInstructionModal] = useState(false);

  useEffect(() => {
    if (router.query.data) {
      try {
        let rawData = router.query.data as string;
        console.log("✅ Raw data received from QR:", rawData);

        let decodedData;
        let parsedData;

        // Attempt 1: Direct Base64 decode (new format)
        try {
          decodedData = decodeURIComponent(escape(atob(rawData)));
          parsedData = JSON.parse(decodedData);
          console.log("✅ Successfully decoded with Base64 method");
        } catch (base64Err) {
          console.warn("⚠️ Base64 decode failed, trying alternative methods:", base64Err);

          // Attempt 2: Double URI decode (legacy format)
          try {
            decodedData = decodeURIComponent(decodeURIComponent(rawData));
            parsedData = JSON.parse(decodedData);
            console.log("✅ Successfully decoded with double URI method");
          } catch (doubleDecodeErr) {
            console.warn("⚠️ Double decode failed, trying single decode:", doubleDecodeErr);

            // Attempt 3: Single URI decode
            try {
              decodedData = decodeURIComponent(rawData);
              parsedData = JSON.parse(decodedData);
              console.log("✅ Successfully decoded with single URI method");
            } catch (singleDecodeErr) {
              console.warn("⚠️ Single decode failed, trying raw JSON parse:", singleDecodeErr);

              // Attempt 4: Direct JSON parse (might work for some legacy codes)
              try {
                parsedData = JSON.parse(rawData);
                console.log("✅ Successfully parsed raw JSON");
              } catch (finalErr) {
                console.error("❌ All decode attempts failed:", finalErr);
                toast.error("Invalid QR code format. Please try scanning again.");
                return;
              }
            }
          }
        }

        // Validate the parsed data
        if (!parsedData || typeof parsedData !== 'object') {
          console.error("❌ Parsed data is not an object:", parsedData);
          toast.error("Invalid QR data structure");
          return;
        }

        if (!parsedData.TransactionType && !parsedData.businessName) {
          console.error("❌ Required fields missing from parsed data:", parsedData);
          toast.error("QR code missing required data fields");
          return;
        }

        console.log("✅ Final parsed data object:", parsedData);

        // Set the data
        setReceiptData(parsedData);
        
        setReceiptNumber(parsedData.ReceiptNumber || 'N/A');

        if (parsedData.Timestamp) {
          const parsedDate = new Date(parsedData.Timestamp);
          const formattedTimestamp = parsedDate.toLocaleString("en-KE", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
          setTimestamp(formattedTimestamp);
        } else {
          setTimestamp('N/A');
        }
      } catch (e) {
        console.error("❌ Error processing QR code data:", e);
        toast.error("Failed to process QR code. Please try again.");
      }
    }
  }, [router.query]);

  const handleDownload = async (format: 'pdf' | 'png') => {
    const input = showContact ? contactRef.current : receiptRef.current;
    if (!input) return;

    if (format === 'pdf') {
      const canvas = await html2canvas(input);
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${showContact ? 'contact' : receiptNumber}.pdf`);
    } else {
      const canvas = await html2canvas(input);
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `${showContact ? 'contact' : receiptNumber}.png`);
        }
      });
    }
    setShowDownloadModal(false);
  };

  const handleShare = async () => {
    const input = showContact ? contactRef.current : receiptRef.current;
    if (navigator.share && input) {
      try {
        const canvas = await html2canvas(input);
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `${showContact ? 'contact' : receiptNumber}.png`, { type: "image/png" });
            await navigator.share({
              files: [file],
              title: showContact ? "Contact information" : "Your Receipt",
              text: showContact ? "Here is the contact information." : "Here is your transaction receipt.",
            });
          }
        });
      } catch (error) {
        console.error('Error sharing:', error);
        toast.error("Failed to share. Please try downloading instead.");
      }
    } else {
      toast.error("Sharing not supported in your browser. Please download instead.");
    }
  };

  const handlePrint = () => {
    const input = showContact ? contactRef.current : receiptRef.current;
    if (!input) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Print</title>');
      printWindow.document.write('<style>@media print { body { margin: 0; padding: 0; } }</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(input.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } else {
      toast.error("Popup blocked. Please allow popups to print.");
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
      .then(() => toast.success("Link copied to clipboard!"))
      .catch(() => toast.error("Failed to copy link"));
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
  // ***SAVE CONTACT FUNCTION***
  const saveContactToDevice = () => {
    if (!receiptData.businessName || !receiptData.businessPhone) {
      toast.error("Contact information is incomplete");
      return;
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      setShowContactInstructionModal(true);
    } else {
      try {
        const vCard = generateVCard();
        saveAsVCard(vCard);
      } catch (error) {
        console.error("Error saving contact:", error);
        toast.error("Failed to save contact. Please try again.");
      }
    }
  };

  const handleSaveContactConfirmation = () => {
    try {
      const vCard = generateVCard();
      saveAsVCard(vCard);
    } catch (error) {
      console.error("Error saving contact:", error);
      toast.error("Failed to save contact. Please try the download option.");
    }
  };


// Helper function to generate vCard content
const generateVCard = () => {
  let vCard = 'BEGIN:VCARD\n';
  vCard += 'VERSION:3.0\n';
  vCard += `FN:${receiptData.businessName}\n`;
  vCard += `ORG:${receiptData.businessName}\n`;
  
  if (receiptData.businessPhone) {
    vCard += `TEL;TYPE=WORK,VOICE:${receiptData.businessPhone}\n`;
  }
  
  if (receiptData.businessEmail) {
    vCard += `EMAIL;TYPE=WORK:${receiptData.businessEmail}\n`;
  }
  
  if (receiptData.businessAddress) {
    vCard += `ADR;TYPE=WORK:;;${receiptData.businessAddress}\n`;
  }
  
  vCard += 'END:VCARD';
  return vCard;
};

// Helper function to save vCard
const saveAsVCard = (vCard: string) => {
  const blob = new Blob([vCard], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${receiptData.businessName || 'contact'}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success("Contact downloaded as vCard!");
};

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      {!showContact ? (
        <>
        <div className="bg-white shadow-lg p-6 w-full max-w-md overflow-auto relative"> {/* Added relative positioning */}
            {/* Added close button at top right */}
            <div className="flex justify-end">
              <button 
                onClick={() => router.back()} 
                className="flex items-center gap-1 p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
                <span className="text-sm">Close</span>
              </button>
            </div>
            <div className="flex justify-center mb-4">
            <div className="animate-ping-once bg-green-500 rounded-full p-2 w-16 h-16 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white animate-bounce"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div
            ref={receiptRef}
            className="bg-white text-center border border-gray-400 border-dotted"
          >
            <div className="flex flex-col items-center mb-6">              
              <div>
                <p className="text-green-600">
                  Payment Approved Successfully!
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold mt-2 mb-1" style={{color: "#2ecc71"}}>
              {receiptData.businessName || "BLTA Solutions Limited"}
            </h2>
            <p className="font-bold mt-2 mb-1" style={{color: "#999999"}}>
              {receiptData.businessComment || "SMS | Short Codes | Solutions"}
            </p>       
            
            <p className="text-3xl text-green-700 font-bold my-4">
              {new Intl.NumberFormat("en-KE", {
                style: "currency",
                currency: "KES",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(receiptData.Amount)}
            </p>

            <div className="mt-2 text-sm break-words space-y-1">
              {receiptData.businessAddress && <p>{receiptData.businessAddress}</p>}
              {receiptData.businessPhone && <p className="font-bold text-green-600">{receiptData.businessPhone}</p>}
              <p>{receiptData.businessComment}</p>
            </div>

            <br />
            <p>{receiptData.TransactionType}</p>  
            <br />
            <p className="text-sm text-gray-500 mb-1">MPESA REF#: {receiptNumber}</p>
            <p className="text-sm text-gray-500 mb-4">Date: {timestamp}</p>
            <br />
            <div className="w-full text-red-600 font-semibold italic p-4 rounded-3xl shadow-lg animate-blink">
              {receiptData.businessPromo1 || "Look out for Our Special Offers Here!"}
            </div>      
            <br />       
          </div>
             <div className="w-full max-w-md mt-6">
                <Button
                  onClick={() => setShowContact(true)}
                  className="w-full bg-green-900 text-white hover:bg-purple-700 px-6 py-4 rounded-lg flex items-center justify-center gap-3 text-lg font-bold"
                >          
                  <p>{receiptData.businessPromo2 || "Contact us for available Offers!"}</p>
                  <MousePointerClick className="mr-2" />
                </Button>
              </div>
        </div>          
          
          {/* Action buttons below receipt */}
          <div className="flex justify-center gap-4 mt-6 w-full max-w-md">
            <button 
              onClick={() => setShowDownloadModal(true)}
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-white shadow hover:bg-gray-50 transition-colors w-20"
            >
              <Download className="w-6 h-6 text-blue-600" />
              <span className="text-xs mt-1">Download</span>
            </button>
            
            <button 
              onClick={handlePrint}
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-white shadow hover:bg-gray-50 transition-colors w-20"
            >
              <Printer className="w-6 h-6 text-gray-600" />
              <span className="text-xs mt-1">Print</span>
            </button>
            
            <button 
              onClick={handleShare}
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-white shadow hover:bg-gray-50 transition-colors w-20"
            >
              <Share2 className="w-6 h-6 text-green-600" />
              <span className="text-xs mt-1">Share</span>
            </button>
          </div>
        </>
      ) : (
        <div
          ref={contactRef}
          className="bg-white p-6 rounded-lg border-4 border-[#2f363d] shadow-md w-full max-w-md relative overflow-y-auto max-h-[90vh]"
        >
          <div className="flex justify-end mb-2">
            <button 
              onClick={() => setShowContact(false)}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
            <div className="flex items-center gap-2 text-xl font-bold mb-4 text-center">
              <Contact className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-bold text-green-600">Save Our Contacts</h2>
            </div>
          <p className="text-blue-500 text-sm text-center">Scan the Qr Code or click <strong className="text-gray-900"> &quot;Add to Contacts&quot; </strong> to add our contacts to your phone book</p>

          <div className="flex justify-center mb-4 w-full p-4 bg-white">
            <QRCode 
              value={generateVCard()}  // Directly use the vCard content as QR value
              size={200}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              bgColor="transparent"
            />
          </div>

          <div className="space-y-3">
            <div className="text-center mb-2">
              <h1 className="text-2xl font-bold" style={{color: "#3CB371"}}>
                {receiptData.businessName}
              </h1>
            </div>

            {receiptData.businessPhone && (
              <div className="flex items-center p-2 border rounded hover:bg-gray-50">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Phone</p>
                  <p>{receiptData.businessPhone}</p>
                </div>
                <a href={`tel:${receiptData.businessPhone}`} className="p-1 hover:bg-gray-100 rounded">
                  <Phone className="w-5 h-5 text-blue-500" />
                </a>
              </div>
            )}

            {receiptData.businessEmail && (
              <div className="flex items-center p-2 border rounded hover:bg-gray-50">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{receiptData.businessEmail}</p>
                </div>
                <a href={`mailto:${receiptData.businessEmail}`} className="p-1 hover:bg-gray-100 rounded">
                  <Mail className="w-5 h-5 text-blue-500" />
                </a>
              </div>
            )}

            {receiptData.businessAddress && (
              <div className="flex items-center p-2 border rounded hover:bg-gray-50">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Address</p>
                  <p>{receiptData.businessAddress}</p>
                </div>
                <a 
                  href={`https://maps.google.com?q=${encodeURIComponent(receiptData.businessAddress)}`} 
                  target="_blank" 
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <MapPin className="w-5 h-5 text-blue-500" />
                </a>
              </div>
            )}

            {receiptData.businessPhone && (
              <div className="flex items-center p-2 border rounded hover:bg-gray-50">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">WhatsApp</p>
                  <p>{receiptData.businessPhone}</p>
                </div>
                <a 
                  href="#" 
                  onClick={(e) => handleWhatsAppClick(receiptData.businessPhone, e)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <FaWhatsapp className="w-5 h-5 text-green-500" />
                </a>
              </div>
            )}
          </div>
          

          {/* Update the button group in the contact section to this: */}
          <div className="flex justify-center mt-6 w-full">            
            <Button 
              onClick={saveContactToDevice}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 w-full py-6"
            >
              <Contact className="w-5 h-5" />
              <span className="text-lg font-semibold">Add to Contacts</span>
            </Button>
          </div>
        </div>
      )}

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Download Options</h3>
              <button 
                onClick={() => setShowDownloadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={() => handleDownload('pdf')}
                className="w-full flex items-center justify-center gap-2"
              >
                <FileDown className="w-5 h-5" />
                Download as PDF
              </Button>
              
              <Button 
                onClick={() => handleDownload('png')}
                className="w-full flex items-center justify-center gap-2"
                variant="outline"
              >
                <FileDown className="w-5 h-5" />
                Download as PNG
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* SAVE CONTACT INSTRUCTION MODAL */}
        {showContactInstructionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Contact className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-bold">Add to Contacts.</h3>
              </div>
              <button 
                onClick={() => setShowContactInstructionModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Select <strong>&quot;Open&quot;</strong> after download is completed to save our contacts to your phone book.
              </p>
              
              <Button 
                onClick={() => {
                  setShowContactInstructionModal(false);
                  handleSaveContactConfirmation();
                }}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700">
                OK, I Understand
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ThankYouPage;