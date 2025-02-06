import Layout from "@/components/Layout";
import { useContext, useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader, Result } from "@zxing/library";
import { HiOutlineCreditCard } from "react-icons/hi";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { AppContext, AppContextType } from "@/context/AppContext";

const QrScanner = () => {
  const [paybillNumber, setPaybillNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [tillNumber, setTillNumber] = useState("");
  const [agentId, setAgentId] = useState("");
  const [storeNumber, setStoreNumber] = useState("");
  const [recepientPhoneNumber, setRecepientPhoneNumber] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null); // Store the stream in state
  const [showScanner, setShowScanner] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState("environment");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { data } = useContext(AppContext) as AppContextType;

  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      try {
        const constraints = { video: { facingMode: selectedCamera } };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isMounted && videoRef.current) {
          setStream(newStream); // Store the stream in state
          videoRef.current.srcObject = newStream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        toast.error("Error accessing camera. Please check permissions.");
      }
    };

    const stopCamera = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);  // Clear the stream from state
        if (videoRef.current) {
          videoRef.current.srcObject = null; // Release the MediaStream object
        }
      }
    };

    if (showScanner) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      isMounted = false;
      stopCamera(); // Stop on unmount
    };
  }, [showScanner, selectedCamera]);

  const handleScanSuccess = (scannedData: string) => {
    try {
      const parsedData = JSON.parse(scannedData);
      setTransactionType(parsedData.TransactionType);

      switch (parsedData.TransactionType) {
        case "PayBill":
          setPaybillNumber(parsedData.PaybillNumber || "");
          setAccountNumber(parsedData.AccountNumber || "");
          setAmount(parsedData.Amount || "");
          break;
        case "BuyGoods":
          setTillNumber(parsedData.TillNumber || "");
          setAmount(parsedData.Amount || "");
          break;
        case "SendMoney":
          setRecepientPhoneNumber(parsedData.RecepientPhoneNumber || "");
          setAmount(parsedData.Amount || "");
          break;
        case "WithdrawMoney":
          setAgentId(parsedData.AgentId || "");
          setStoreNumber(parsedData.StoreNumber || "");
          setAmount(parsedData.Amount || "");
          break;
        default:
          break;
      }

      toast.success("QR Code scanned successfully!");
      setShowScanner(false);
    } catch (error) {
      toast.error("Invalid QR Code format.");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const tempImage = document.createElement("img");
        tempImage.src = reader.result as string;

        tempImage.onload = async () => {
          try {
            const codeReader = new BrowserMultiFormatReader();
            const result: Result = await codeReader.decodeFromImageElement(tempImage);
            handleScanSuccess(result.getText());
          } catch (scanError) {
            toast.error("Failed to scan QR code from image.");
          }
        };
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Error loading image for QR scan.");
    }
  };

  const resetForm = () => {
    setPaybillNumber("");
    setAccountNumber("");
    setAmount("");
    setPhoneNumber("");
    setTillNumber("");
    setAgentId("");
    setStoreNumber("");
    setRecepientPhoneNumber("");
    setTransactionType("");
    setShowScanner(true); // Show the scanner after reset
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the file input
    }
    toast.success("Form reset successfully!");
  };

  // ******QR CODE SCANNING FUNCTIONALITY FOR CAMERA******

  useEffect(() => {
  const codeReader = new BrowserMultiFormatReader();
  let scanInterval: NodeJS.Timeout;

  const startScanning = () => {
    if (videoRef.current) {
      scanInterval = setInterval(async () => {
        try {
          // Properly handle the callback function for decoding
          await codeReader.decodeFromVideoDevice(
            selectedCamera,
            videoRef.current,
            (result: any, error) => {
              if (error) {
                console.error("Error decoding QR code:", error);
                return;
              }
              if (result && result.getText) {
                handleScanSuccess(result.getText());
              }
            }
          );
        } catch (error) {
          console.error("Error scanning QR code:", error);
        }
      }, 200); // Scan every 200ms
    }
  };
  

  startScanning(); // Initiate scanning process

  return () => clearInterval(scanInterval); // Clean up interval on component unmount
}, [showScanner, selectedCamera]);  // Add selectedCamera dependency to restart scanning if the camera changes


  // ******PAYMENT METHODS******
  const handlePayBill = async () => {
    if (
      !phoneNumber.trim() ||
      !data.paybillNumber?.trim() ||
      !data.accountNumber?.trim() ||
      !data.amount ||
      isNaN(Number(data.amount)) || Number(data.amount) <= 0
    ) {
      toast.error("Please fill in all the fields.");
      return;
    }
  
    try {
      const response = await fetch("/api/stk_api/paybill_stk_api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneNumber.trim(),
          amount: data.amount.toString(),
          accountnumber: data.accountNumber.trim(),
        }),
      });
  
      const result = await response.json();
      if (response.ok) {
        toast.success("Payment initiated successfully! Please emter your M-pesa PIN on your phone when prompted shortly");
      } else {
        toast.error(result?.message || "Something went wrong.");
      }
    } catch (error) {
      toast.error("Network error: Unable to initiate payment.");
    }
  };
  
  const handlePayTill = async () => {
    if (
      !phoneNumber.trim() ||
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
      const response = await fetch("/api/stk_api/till_stk_api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneNumber.trim(),
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
  const handleSendMoney = async () => {
    if (
      !recepientPhoneNumber.trim() ||
      !data.phoneNumber?.trim() ||
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
          phone: phoneNumber.trim(),
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

  const handleWithdraw = async () => {
    if (
      !phoneNumber.trim() ||
      !data.agentNumber?.trim() ||
      !data.storeNumber?.trim() ||
      !data.amount ||
      isNaN(Number(data.amount)) || Number(data.amount) <= 0
    ) {
      toast.error("Please fill in all the fields.");
      return;
    }
  
    try {
      const response = await fetch("/api/stk_api/agent_stk_api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneNumber.trim(),
          amount: data.amount.toString(),
          accountnumber: data.storeNumber.trim(),
        }),
      });
  
      const result = await response.json();
      if (response.ok) {
        toast.success("Payment initiated successfully! Please emter your M-pesa PIN on your phone when prompted shortly");
      } else {
        toast.error(result?.message || "Something went wrong.");
      }
    } catch (error) {
      toast.error("Network error: Unable to initiate payment.");
    }
  };

  return (
    <Layout>
      <p className="text-xl text-center">Scan non-Mpesa QR Code to make Payment</p>
      <div className="w-full border-t-2 border-gray-300 my-4"></div>

      <div className="mt-6 flex flex-col items-center space-y-4">
        {/* Controls Section */}
        <div className="flex items-center space-x-4">
          {/* Start/Stop Scanner Button */}
          {!showScanner ? (
            <Button onClick={() => setShowScanner(true)} className="bg-green-500 text-white">
              Start Scanning
            </Button>
          ) : (
            <Button onClick={() => setShowScanner(false)} className="bg-red-500 text-white">
              Stop Scanning
            </Button>
          )}

          {/* Camera Selection (Always Visible) */}
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="user">Front Camera</option>
            <option value="environment">Back Camera</option>
          </select>
        </div>

        {/* Scanner */}
        {showScanner && <video ref={videoRef} className="w-full max-w-md mt-4" autoPlay playsInline muted></video>}

        {/* Scan result UI + Payment Button */}
        {!showScanner && transactionType && (
          <div className="w-full max-w-md p-4 border rounded shadow-md bg-white">
            <p className="text-lg font-semibold">Scanned Details:</p>
            {transactionType === "PayBill" && (
              <>
                <label>Paybill Number</label>
                <Input value={paybillNumber} readOnly />
                <label>Account Number</label>
                <Input value={accountNumber} readOnly />
                <label>Amount</label>
                <Input value={amount} readOnly />
              </>
            )}
            {transactionType === "BuyGoods" && (
              <>
                <label>Till Number</label>
                <Input value={tillNumber} readOnly />
                <label>Amount</label>
                <Input value={amount} readOnly />
              </>
            )}
            {transactionType === "SendMoney" && (
              <>
                <label>Recipient Phone</label>
                <Input value={recepientPhoneNumber} readOnly />
                <label>Amount</label>
                <Input value={amount} readOnly />
              </>
            )}
            {transactionType === "WithdrawMoney" && (
              <>
                <label>Agent ID</label>
                <Input value={agentId} readOnly />
                <label>Store Number</label>
                <Input value={storeNumber} readOnly />
                <label>Amount</label>
                <Input value={amount} readOnly />
              </>
            )}
            {/* PAY Buttons */}
            <br />
              {transactionType === "PayBill" && (
                <Button
                  className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md transition-all"
                  onClick={handlePayBill}
                >
                  <HiOutlineCreditCard className="text-xl" />
                  <span>Pay Now</span>
                </Button>
              )}

              {transactionType === "BuyGoods" && (
                <Button
                  className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md transition-all"
                  onClick={handlePayTill}
                >
                  <HiOutlineCreditCard className="text-xl" />
                  <span>Pay Now</span>
                </Button>
              )}

              {transactionType === "SendMoney" && (
                <Button
                  className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md transition-all"
                  onClick={handleSendMoney}
                >
                  <HiOutlineCreditCard className="text-xl" />
                  <span>Send Now</span>
                </Button>
              )}

              {transactionType === "WithdrawMoney" && (
                <Button
                  className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md transition-all"
                  onClick={handleWithdraw}
                >
                  <HiOutlineCreditCard className="text-xl" />
                  <span>Withdraw Now</span>
                </Button>
              )}
          </div>
        )}

        {/* File Upload */}
        <input type="file" accept="image/*" onChange={handleFileUpload} className="border p-2 rounded" ref={fileInputRef} />
      </div>
    </Layout>
  );
};

export default QrScanner;
