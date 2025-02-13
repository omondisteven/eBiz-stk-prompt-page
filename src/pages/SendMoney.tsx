import Layout from "@/components/Layout";
import { useContext, useEffect, useState } from "react";
import { AppContext, AppContextType } from "@/context/AppContext";
import { Input } from "@/components/ui/input";
import { NumericFormat } from "react-number-format";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { HiOutlineDownload, HiOutlineEye, HiOutlineEyeOff, HiMoon, HiSun } from "react-icons/hi";
import { TRANSACTION_TYPE } from "@/@types/TransactionType";
import QrSvg from "@wojtekmaj/react-qr-svg";
import { generateQRCode } from "@/utils/helpers";
import toast from "react-hot-toast";
import { ColorPicker } from "@/components/ColorPicker";
import InstallButton from "@/components/InstallButton";
import NumPad from "@/components/NumPad";
import { HiOutlineCreditCard } from "react-icons/hi"; // Import payment icon

const SendMoneyPage = () => {
  const { data, setData } = useContext(AppContext) as AppContextType;
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [showQRCode, setShowQRCode] = useState(true);
  const [qrColor, setQrColor] = useState("#000000");
  const [senderPhoneNumber, setSenderPhoneNumber] = useState("254");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isPayEnabled, setIsPayEnabled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as any);
      setShowInstallBtn(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = () => {
    setShowInstallBtn(false);
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
  };

  const handleQRCodeDownload = () => {
    const svgElement = document.querySelector(".qr-code-svg");
    if (!svgElement) return;

    const svgRect = svgElement.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      toast.error("Error generating QR code");
      return;
    }

    canvas.width = svgRect.width;
    canvas.height = svgRect.height;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `till_${data.tillNumber}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, "image/png");
    };
    img.src = url;
  };
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Ensure the number starts with "254"
    if (!value.startsWith("254")) {
      value = "254";
    }

    // Validate the number after "254"
    if (value.length > 3) {
      const afterPrefix = value.slice(3);
      if (/^0/.test(afterPrefix)) {
        setError("Phone number cannot start with '0' after '254'.");
      } else {
        setError(null);
      }
    } else {
      setError(null);
    }

    setSenderPhoneNumber(value);
  };

  useEffect(() => {
    const isPhoneNumberValid = !!(senderPhoneNumber && senderPhoneNumber.startsWith("254") && !/^2540/.test(senderPhoneNumber) && senderPhoneNumber.length == 12);
    const isFormComplete = !!(data.paybillNumber?.trim() && data.accountNumber && data.tillNumber && data.amount && !isNaN(Number(data.amount)) && Number(data.amount) > 0);
    
    setIsPayEnabled(isPhoneNumberValid && isFormComplete && !error);
  }, [senderPhoneNumber, data, error]);


  const handlePay = async () => {
    if (
      !senderPhoneNumber.trim() ||
      !data.paybillNumber?.trim() ||
      !data.tillNumber?.trim() ||
      !data.amount ||
      isNaN(Number(data.amount)) || Number(data.amount) <= 0 ||
      !data.accountNumber?.trim() // Ensure accountNumber is defined and not empty
    ) {
      toast.error("Please fill in all the fields.");      
      return;
    }
  
    try {
      const response = await fetch("/api/stk_api/sendmoney_stk_api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: senderPhoneNumber.trim(),
          amount: data.amount.toString(),
          accountnumber: data.accountNumber.trim(), // Safe to use trim() now
        }),
      });
  
      const result = await response.json();
      if (response.ok) {
        toast.success("Payment initiated successfully! Please enter your M-pesa PIN on your phone when prompted shortly");
      } else {
        toast.error(result?.message || "Something went wrong.");
      }
    } catch (error) {
      toast.error("Network error: Unable to initiate payment.");
    }
  };  

  // *******NEW LOOK COMPONENT******
    return (
      <Layout>
        <h1 className="text-3xl font-bold mb-4 text-center">Send Money Online</h1>
        <div className="w-full border-t-2 border-gray-300 my-4"></div>  {/* Added Divider */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          {/* Left Column: Paybill Number, Account Number, NumPad */}
          <div className="space-y-4">
          <p className="text-xl text-center" style={{ color: data.color }}>
            RECEPIENT PHONE NUMBER
          </p>
          <NumericFormat
            onValueChange={(value) => {
              if (value.floatValue && value.floatValue.toString().length <= 12) {
                setData({ ...data, phoneNumber: value.value, type: TRANSACTION_TYPE.SEND_MONEY });
              }
            }}
            inputMode="numeric"
            value={data.phoneNumber}
            customInput={Input}
            allowNegative={false}
            allowLeadingZeros={true}
            placeholder="Enter recepient Phone Number"
            className="w-full text-center text-xl py-2 border rounded-lg"
          />

            <NumPad className="w-full" />
          </div>

          {/* Right Column: Hide QR, Color Picker, QR Code, Phone Number, Pay Button */}
          <div className="flex flex-col items-center space-y-4 pt-[50px] bg-white">
          <p className="text-xl text-center">Scan Qr Code to send with Mpesa App</p>
            {/* Hide QR Code Button */}
            <Button
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-all"
              onClick={() => setShowQRCode(!showQRCode)}
            >
              {showQRCode ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              <span>{showQRCode ? "Hide QR Code" : "Show QR Code"}</span>
            </Button>
       
            {/* QR Code Display */}
            {showQRCode && (
              <div className="p-3 border-4 border-black bg-white rounded-md">
                <QrSvg
                  value={generateQRCode(data) ?? ""}
                  className="qr-code-svg w-32 h-32 md:w-40 md:h-40"
                  style={{ color: qrColor }}
                />
              </div>
            )}

            {/* Download Qr */}
            <Button
              onClick={handleQRCodeDownload}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-all"
            >
              <HiOutlineDownload />
              <span>Download Qr</span>
            </Button>
            
            <div className="w-full border-t-2 border-gray-300 my-4"></div>  {/* Added Divider */}
            {/* Phone Number Input */}
          <p className="text-xl text-center">Enter your Phone Number to send directly</p>
          <Input
             onChange={handlePhoneNumberChange}
            value={senderPhoneNumber ?? ""}
            placeholder="Enter sender Phone Number"
            className="w-full text-center text-xl py-2 border rounded-lg"
          />
          {/* Display validation messages */}
          {warning && <p className="text-yellow-600">{warning}</p>}
          {error && <p className="text-red-600">{error}</p>}

          {/* Pay Button */}
          <Button
            className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md transition-all"
            onClick={handlePay}
            disabled={!isPayEnabled}
          >
            <HiOutlineCreditCard className="text-xl" /> {/* Payment Icon */}
            <span>Send Now</span>
          </Button>
          </div>
        </div>
      </Layout>
    );
};

export default SendMoneyPage;
