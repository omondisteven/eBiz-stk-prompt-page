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

const TillPage = () => {
  const { data, setData } = useContext(AppContext) as AppContextType;
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [showQRCode, setShowQRCode] = useState(true);
  const [qrColor, setQrColor] = useState("#000000");
  const [phoneNumber, setPhoneNumber] = useState("");

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
  return (
    <Layout>
      <div className="flex items-center justify-between">
        <ColorPicker />
        {showInstallBtn && <InstallButton handleInstall={handleInstallClick} />}
      </div>

      <p className="text-xl text-center">TILL NUMBER</p>
      <NumericFormat
        onValueChange={(value) => {
          if (value.floatValue && value.floatValue.toString().length <= 12) {
            setData({ ...data, tillNumber: value.value, type: TRANSACTION_TYPE.TILL_NUMBER });
          }
        }}
        inputMode="numeric"
        value={data.tillNumber}
        customInput={Input}
        allowNegative={false}
        allowLeadingZeros={true}
        placeholder="Enter Till Number"
        className="w-full text-center text-xl py-2 border rounded-lg"
      />

      <div className="flex items-center px-4 py-2 space-x-2">
        <Checkbox
          id="hideAmount"
          checked={data.hideAmount}
          onCheckedChange={(checked) => setData({ ...data, hideAmount: !!checked })}
        />
        <label htmlFor="hideAmount" className="text-sm font-medium">
          Hide amount
        </label>
      </div>

      {/* ✅ Side-by-side layout for NumPad & QR Code with toggle */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-8 mt-6">
        {!data.hideAmount && (
          <div className="w-full md:w-1/2 flex justify-center">
            <NumPad className="w-3/4 md:w-full" />
          </div>
        )}

        {showQRCode && (
          <div className="w-full md:w-1/2 flex justify-center">
            <div className="p-3 border-4 border-black bg-white rounded-md">
              <QrSvg
                value={generateQRCode(data) ?? ""}
                className="qr-code-svg w-32 h-32 md:w-40 md:h-40"
                style={{ color: qrColor }}
              />
            </div>
          </div>
        )}

        {/* Column layout for buttons to the right of QR code */}
        <div className="flex flex-col items-center md:items-start space-y-4 ml-4">
          <Button
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-all"
            onClick={() => setShowQRCode(!showQRCode)}
          >
            {showQRCode ? <HiOutlineEyeOff /> : <HiOutlineEye />}
            <span>{showQRCode ? "Hide QR Code" : "Show QR Code"}</span>
          </Button>

          <div className="flex items-center space-x-2">            
            <input
              id="colorPicker"
              type="color"
              value={qrColor}
              onChange={(e) => setQrColor(e.target.value)}
              className="w-16 h-10 border rounded-md cursor-pointer"
            />
            <label htmlFor="colorPicker" className="text-sm font-medium">Change Color</label>
          </div>

          <Button
            onClick={handleQRCodeDownload}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-all"
          >
            <HiOutlineDownload />
            <span>Download</span>
          </Button>          
        </div>
      </div>
    </Layout>
  );
};

export default TillPage;
