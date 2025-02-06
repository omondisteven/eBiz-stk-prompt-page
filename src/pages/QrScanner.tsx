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
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [showScanner, setShowScanner] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState("environment");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { data } = useContext(AppContext) as AppContextType;

  useEffect(() => {
    let isMounted = true;
    const codeReader = new BrowserMultiFormatReader();  // Initialize the code reader here
  
    const startCamera = async () => {
      try {
        const constraints = { video: { facingMode: selectedCamera } };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
  
        if (isMounted && videoRef.current) {
          setStream(newStream);
          videoRef.current.srcObject = newStream;
  
          // Start continuous decoding from the video stream
          const decodeFromVideo = async () => {
            if (videoRef.current) {
              try {
                // Provide the deviceId (null here for auto selection) and the video element
                await codeReader.decodeFromVideoDevice(
                  null, // Device ID, null for default camera
                  videoRef.current, // Video element where the camera feed is shown
                  (result, error) => {
                    if (result) {
                      handleScanSuccess(result.getText());
                    } else if (error) {
                      console.error('Error decoding QR code:', error);
                    }
                  }
                );
              } catch (error) {
                console.error('Error scanning QR code from video:', error);
              }
            }
          };
  
          // Start scanning
          decodeFromVideo();
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        toast.error('Error accessing camera. Please check permissions.');
      }
    };
  
    const stopCamera = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
  
      // Stop the QR code scanner by resetting the codeReader
      codeReader.reset();  // This will stop the ongoing QR code scanning
    };
  
    if (showScanner) {
      startCamera();
    } else {
      stopCamera();
    }
  
    return () => {
      isMounted = false;
      stopCamera();
      codeReader.reset();  // Ensure that the QR code reader is reset when the component unmounts
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
          setPhoneNumber(parsedData.PhoneNumber || "");
          break;
        case "BuyGoods":
          setTillNumber(parsedData.TillNumber || "");
          setAmount(parsedData.Amount || "");
          setPhoneNumber(parsedData.PhoneNumber || "");
          break;
        case "SendMoney":
          setRecepientPhoneNumber(parsedData.RecepientPhoneNumber || "");
          setAmount(parsedData.Amount || "");
          setPhoneNumber(parsedData.PhoneNumber || "");
          break;
        case "WithdrawMoney":
          setAgentId(parsedData.AgentId || "");
          setStoreNumber(parsedData.StoreNumber || "");
          setAmount(parsedData.Amount || "");
          setPhoneNumber(parsedData.PhoneNumber || "");
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
    setShowScanner(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Form reset successfully!");
  };

  // ******PAYMENT METHODS******
  const handlePayBill = async () => {
    if (
      !phoneNumber.trim() ||
      !paybillNumber.trim() ||
      !accountNumber.trim() ||
      !amount ||
      isNaN(Number(amount)) || Number(amount) <= 0
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
          amount: amount.toString(),
          accountnumber: accountNumber.trim(),
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
  
  const handlePayTill = async () => {
    if (
      !phoneNumber.trim() ||
      !paybillNumber.trim() ||
      !tillNumber.trim() ||
      !amount ||
      isNaN(Number(amount)) || Number(amount) <= 0
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
          amount: amount.toString(),
          accountnumber: tillNumber.trim(),
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
      !phoneNumber.trim() ||
      !amount ||
      isNaN(Number(amount)) || Number(amount) <= 0
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
          amount: amount.toString(),
          recepientPhoneNumber: recepientPhoneNumber.trim(),
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
      !agentId.trim() ||
      !storeNumber.trim() ||
      !amount ||
      isNaN(Number(amount)) || Number(amount) <= 0
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
          amount: amount.toString(),
          accountnumber: storeNumber.trim(),
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

  return (
    <Layout>
      <p className="text-xl text-center">Scan non-Mpesa QR Code to make Payment</p>
      <div className="w-full border-t-2 border-gray-300 my-4"></div>

      <div className="mt-6 flex flex-col items-center space-y-4">
        {/* Controls Section */}
        <div className="flex items-center space-x-4">
          {/* Camera Selection (Always Visible) */}
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="user">Front Camera</option>
            <option value="environment">Back Camera</option>
          </select>
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
                {/* <label>Payer Phone No.</label>
                <Input value={phoneNumber} /> */}
              </>
            )}
            {transactionType === "BuyGoods" && (
              <>
                <label>Till Number</label>
                <Input value={tillNumber} readOnly />
                <label>Amount</label>
                <Input value={amount} readOnly />
                {/* <label>Payer Phone No.</label>
                <Input value={phoneNumber} /> */}
              </>
            )}
            {transactionType === "SendMoney" && (
              <>
                <label>Recipient Phone</label>
                <Input value={recepientPhoneNumber} readOnly />
                <label>Amount</label>
                <Input value={amount} readOnly />
                {/* <label>Payer Phone No.</label>
                <Input value={phoneNumber} /> */}
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
                {/* <label>Payer Phone No.</label>
                <Input value={phoneNumber} /> */}
              </>
            )}
            
            {/* Show PhoneNumber input only after successful scan */}
          {transactionType && (
            <div>
                <label className="block text-sm font-medium">Phone Number</label>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter Phone Number"
                />
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
          </div>
        )}

        {/* File Upload & Reset */}
        <div className="flex items-center space-x-2"> {/* Container for side-by-side placement */}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileUpload} 
            className="border p-2 rounded" 
            ref={fileInputRef} 
          />
          <button
            onClick={resetForm}
            className="bg-blue-500 text-white p-2 rounded"
          >
            Reset
          </button>
        </div>
      </div>
       
    </Layout>
  );
};

export default QrScanner;