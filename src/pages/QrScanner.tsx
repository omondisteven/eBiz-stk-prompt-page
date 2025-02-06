import Layout from "@/components/Layout";
import { useContext, useState, useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { HiOutlineCreditCard } from "react-icons/hi"; // Import payment icon
import { AppContext, AppContextType } from "@/context/AppContext";
import { Button } from "@/components/ui/button";


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
  const [showScanner, setShowScanner] = useState(true); // Control visibility of the scanner
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { data, setData } = useContext(AppContext) as AppContextType;

  useEffect(() => {
    // Initialize the scanner
    scannerRef.current = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: 250,
    }, false);

    scannerRef.current.render(
      (decodedText) => {
        handleScanSuccess(decodedText);
      },
      (errorMessage) => {
        console.log("QR Scan Error:", errorMessage);
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear(); // Stop scanning and clean up
      }
    };
  }, []);

  const handleScanSuccess = (scannedData: string) => {
    try {
      const parsedData = JSON.parse(scannedData);
      setTransactionType(parsedData.TransactionType);

      // Set data based on TransactionType
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
    } catch (error) {
      toast.error("Invalid QR Code format.");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const html5Qrcode = new Html5Qrcode("reader");
      const result = await html5Qrcode.scanFile(file, false);
      handleScanSuccess(result);
    } catch (error) {
      toast.error("Failed to scan QR code from image.");
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
      <p className="text-xl text-center">Scan non Mpesa Qr Code to make Payment</p>
      <div className="w-full border-t-2 border-gray-300 my-4"></div>  {/* Added Divider */}
      <div className="mt-6 flex flex-col items-center space-y-4">      
        <div className="flex items-center space-x-4">
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

        {/* Show the scanner container only when 'showScanner' is true */}
        {showScanner && <div id="reader" className="w-full max-w-md mt-4"></div>}

        <div className="w-full max-w-md p-4 border rounded shadow-md bg-white">
          <p className="text-lg font-semibold">Scanned Details:</p>
          
          {transactionType === "PayBill" && (
            <>
              <div>
                <label className="block text-sm font-medium">Paybill Number</label>
                <Input value={paybillNumber} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium">Account Number</label>
                <Input value={accountNumber} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium">Amount</label>
                <Input value={amount} readOnly />
              </div>
            </>
          )}
          
          {transactionType === "BuyGoods" && (
            <>
              <div>
                <label className="block text-sm font-medium">Till Number</label>
                <Input value={tillNumber} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium">Amount</label>
                <Input value={amount} readOnly />
              </div>
            </>
          )}

          {transactionType === "SendMoney" && (
            <>
            <div>
              <label className="block text-sm font-medium">Recipient Phone Number</label>
              <Input value={recepientPhoneNumber} readOnly />
            </div>
            <div>
                <label className="block text-sm font-medium">Amount</label>
                <Input value={amount} readOnly />
              </div>
            </>
            
            
            
          )}

          {transactionType === "WithdrawMoney" && (
            <>
              <div>
                <label className="block text-sm font-medium">Agent ID</label>
                <Input value={agentId} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium">Store Number</label>
                <Input value={storeNumber} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium">Amount</label>
                <Input value={amount} readOnly />
              </div>
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
      </div>
    </Layout>
  );
};

export default QrScanner;
