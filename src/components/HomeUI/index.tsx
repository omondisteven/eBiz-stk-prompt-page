// /src/components/index.tsx
import { useRouter } from "next/router";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { HiOutlineCreditCard, HiCalculator } from "react-icons/hi";
import { HiX } from "react-icons/hi";
import { History } from "lucide-react";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import 'react-toastify/dist/ReactToastify.css';
import { useAppContext } from "@/context/AppContext";
import Link from "next/link";
import TransactionHistoryModal from "../TransactionHistoryModal";

// Add this Calculator component near your other imports
const Calculator = ({ onCalculate, onClose, onClear }: {
  onCalculate: (result: string) => void,
  onClose: () => void,
  onClear: () => void
}) => {
  const [input, setInput] = useState('');
  const [liveResult, setLiveResult] = useState('0');
  

  useEffect(() => {
    try {
      if (input) {
        const sanitizedInput = input.replace(/[+\-*/]+$/, '');
        if (sanitizedInput) {
          // eslint-disable-next-line no-eval
          const result = eval(sanitizedInput);
          setLiveResult(result.toString());
        } else {
          setLiveResult('0');
        }
      } else {
        setLiveResult('0');
      }
    } catch (error) {
      setLiveResult('Error');
    }
  }, [input]);
  const handleButtonClick = (value: string) => {
    if (value === 'OK') {
      if (liveResult !== 'Error') {
        onCalculate(liveResult);
        onClose();
      }
    } else if (value === 'C') {
      setInput('');
      setLiveResult('0');
      onClear();
      // Clear the amount input box
    } else if (value === '⌫') {
      setInput(input.slice(0, -1));
    } else {
      const lastChar = input.slice(-1);
      if (['+', '-', '*', '/'].includes(value) && ['+', '-', '*', '/'].includes(lastChar)) {
        setInput(input.slice(0, -1) + value);
      } else {
        setInput(input + value);
      }
    }
  };
  const buttons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    '0', '.', '⌫', '+',
    'C', 'OK'
  ];
  return (
    <div className="mt-2 bg-white rounded-lg shadow-md p-2 border border-gray-200 relative">
      <button
        onClick={onClose}
        className="absolute top-1 right-1 text-gray-500 hover:text-gray-700"
      >
        <HiX className="h-4 w-4" />
      </button>

      {/* Display current input and live result */}
      <div className="mb-2 p-2 bg-gray-100 rounded">
        <div className="text-gray-600 text-sm h-5 text-right">{input || '0'}</div>
        <div className={`text-lg font-semibold text-right ${
          liveResult === 'Error' ? 'text-red-500' : 'text-gray-800'
        }`}>
          {liveResult}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {buttons.map((btn) => (
          <button
            key={btn}
            onClick={() => handleButtonClick(btn)}
            className={`p-2 rounded-md text-center font-medium
              ${btn === 'OK' ? 'bg-green-500 text-white hover:bg-green-600' :
                btn === 'C' ?
                'bg-red-500 text-white hover:bg-red-600' :
                btn === '⌫' ?
                'bg-gray-500 text-white hover:bg-gray-600' :
                'bg-gray-200 hover:bg-gray-300'}`}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
};

const HomeUI = () => {
  useEffect(() => {
    console.log("Phone number initialized:", phoneNumber);
  }, []);

    const router = useRouter();
    const [transactionType, setTransactionType] = useState("");
    const [data, setData] = useState<any>({});
    const { data: appData } = useAppContext();
    // ✅ Initialize from localStorage only (ignore QR)
    const [phoneNumber, setPhoneNumber] = useState(() => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('payerPhoneNumber') || '254';
      }
      return '254';
    });

    const [amount, setAmount] = useState(data.Amount || "");
    const [warning, setWarning] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showCalculator, setShowCalculator] = useState(false);
    const [hasQrData, setHasQrData] = useState(false); // New state for QR data presence

    const [showHistory, setShowHistory] = useState(false);

    const [isAwaitingPayment, setIsAwaitingPayment] = useState(false);
    const [countdown, setCountdown] = useState(30);
    const [isPaying, setIsPaying] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed' | 'cancelled'>('pending');

    const isCompleteRef = useRef(false);
    const countdownRef = useRef(60);
    const activeIntervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    // Handle visibility changes for mobile
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && paymentStatus === 'pending') {
                console.log('Mobile app came to foreground - refreshing payment status');
            }
        };

        if (isMobile) {
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }

        return () => {
            if (isMobile) {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            }
        };
    }, [isMobile, paymentStatus]);
    // QR code data processing
    useEffect(() => {
      if (router.query.data) {
        try {
          let rawData = router.query.data as string;
          let decodedData;

          try {
            decodedData = decodeURIComponent(escape(atob(rawData)));
          } catch (base64Err) {
            console.warn("Base64 decode failed, trying URI decode");
            decodedData = decodeURIComponent(rawData);
          }

          let parsedData = JSON.parse(decodedData);
          if (!parsedData.TransactionType) {
            toast.error("Missing transaction type in QR data");
            setHasQrData(false);
            return;
          }

          setTransactionType(parsedData.TransactionType);
          setData(parsedData);
          setAmount(parsedData.Amount || "");
          // if (parsedData.PhoneNumber) {
          //   setPhoneNumber(parsedData.PhoneNumber);
          //   localStorage.setItem('payerPhoneNumber', parsedData.PhoneNumber);
          // }
          if (parsedData.PhoneNumber) {
            console.log("Ignoring QR phone number:", parsedData.PhoneNumber);
          }

          setHasQrData(true);

        } catch (e) {
          console.error("Error processing QR code data:", e);
          toast.error("Failed to process QR code");
          setHasQrData(false);
        }
      } else {
        setHasQrData(false);
      }
    }, [router.query]);

    // Phone number validation
    const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

      if (value === '') {
        value = '254'; // ✅ Reset to '254' if input is cleared
      }

      if (!value.startsWith("254")) {
        value = "254";
        setWarning("Phone number must start with '254'.");
      } else {
        setWarning(null);
      }

      if (value.length > 3) {
        const afterPrefix = value.slice(3);
        if (/^0/.test(afterPrefix)) {
          setError("The digit after '254' cannot be zero.");
        } else {
          setError(null);
        }
      } else {
        setError(null);
      }

      setPhoneNumber(value);
      localStorage.setItem('payerPhoneNumber', value);
    };

    const handlePhoneNumberBlur = () => {
        if (phoneNumber.length !== 12) {
            setError("Phone number must be exactly 12 digits.");
        } else {
            setError(null);
        }
    };
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(e.target.value);
    };
    // Enhanced payment handling with proper status tracking
  const handlePayment = async (url: string, payload: any) => {
    const transactionId = `tx_${Date.now()}`;
    console.log(`[${transactionId}] Initiating payment`);

    // Reset state
    isCompleteRef.current = false;
    setPaymentStatus('pending');
    setIsPaying(true);
    setIsAwaitingPayment(true);
    setCountdown(60);
    const activeIntervals = new Set<NodeJS.Timeout>();
    activeIntervalsRef.current = activeIntervals;

    const cleanup = () => {
      if (isCompleteRef.current) return;
      isCompleteRef.current = true;
      setIsPaying(false);
      setIsAwaitingPayment(false);
      activeIntervals.forEach(clearInterval);
      activeIntervals.clear();
    };

    try {
      // Initiate STK push
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await response.text());

      const result = await response.json();
      if (!result.CheckoutRequestID) throw new Error('No CheckoutRequestID received');
      const checkoutId = result.CheckoutRequestID;
      console.log(`[${transactionId}] CheckoutRequestID: ${checkoutId}`);
      toast.success('Enter your M-PESA PIN when prompted');
      // Enhanced polling with STK Query
      const pollPaymentStatus = async () => {
        try {
          console.log(`[${transactionId}] Checking payment status...`);
          const statusCheckUrl = `/api/stk_api/check_payment_status?checkout_id=${checkoutId}&t=${Date.now()}&force_query=${countdown < 45}`;
          const checkRes = await fetch(statusCheckUrl);

          if (!checkRes.ok) throw new Error(await checkRes.text());
          const { status, details, resultCode, receiptNumber } = await checkRes.json();
          console.log(`[${transactionId}] Status: ${status}, ResultCode: ${resultCode}, Receipt: ${receiptNumber}`);
          if (status === 'Success') {
            setPaymentStatus('success');
            cleanup();
            const paymentDetails = {
              ...data,
              TransactionType: transactionType,
              Amount: payload.amount,
              Receipt: receiptNumber || 'N/A',
              PhoneNumber: payload.phone,
              AccountNumber: payload.accountnumber || payload.storenumber || 'N/A',
              Timestamp: new Date().toISOString(),
            };
            console.log(`[${transactionId}] Payment successful!`, paymentDetails);
            toast.success('Payment successful!');
            router.push({
              pathname: '/ThankYouPage',
              query: { data: JSON.stringify(paymentDetails) }
            });
          } else if (status === 'Failed') {
            setPaymentStatus('failed');
            cleanup();
            console.error(`[${transactionId}] Payment failed: ${details}`);
            toast.error(details || 'Payment failed. Please try again.');
          } else if (status === 'Cancelled') {
            setPaymentStatus('cancelled');
            cleanup();
            console.log(`[${transactionId}] Payment cancelled by user`);
            toast.error('Payment cancelled by the user');
          }
        } catch (error) {
          console.error(`[${transactionId}] Poll error:`, error);
        }
      };

      // Start polling
      const pollInterval = setInterval(pollPaymentStatus, 3000);
      activeIntervals.add(pollInterval);
      pollPaymentStatus(); // Immediate first check

      // Countdown timer
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (paymentStatus === 'pending') {
              cleanup();
              console.log(`[${transactionId}] Payment process timed out`);
              toast('Payment process timed out', { icon: '⏱️' });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      activeIntervals.add(countdownInterval);

    } catch (error) {
      cleanup();
      console.error(`[${transactionId}] Payment error:`, error);
      toast.error(error instanceof Error ? error.message : 'Payment failed');
    }
  };
    // ******PAYMENT METHODS******
    const handlePayBill = () => {
        if (!phoneNumber.trim() || !data.PaybillNumber?.trim() || !data.AccountNumber?.trim() || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error("Please fill in all the fields.");
            return;
        }

        handlePayment("/api/stk_api/paybill_stk_api", {
            phone: phoneNumber.trim(),
            amount: amount.toString(),
            accountnumber: data.AccountNumber.trim(),
            businessShortCode: data.PaybillNumber.trim(), // Pass the Paybill Number
        });
    };

    const handlePayTill = () => {
        if (!phoneNumber.trim() || !data.TillNumber?.trim() || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error("Please fill in all the fields.");
            return;
        }

        handlePayment("/api/stk_api/till_stk_api", {
            phone: phoneNumber.trim(),
            amount: amount.toString(),
            accountnumber: data.TillNumber.trim(), // Use TillNumber as accountnumber
            businessShortCode: data.TillNumber.trim(), // Pass the Till Number
        });
    };

    const handleSendMoney = () => {
        if (!phoneNumber.trim() || !data.RecepientPhoneNumber?.trim() || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error("Please fill in all the fields.");
            return;
        }

        // For Send Money, BusinessShortCode is typically a specific short code (e.g., 247247 for personal transactions)
        // or the business short code if it's a business initiating a 'send money' equivalent.
        // Assuming '174379' from your API code is the default for sandbox.
        handlePayment("/api/stk_api/sendmoney_stk_api", {
            phone: phoneNumber.trim(), // The sender's phone number
            amount: amount.toString(),
            accountnumber: data.RecepientPhoneNumber.trim(), // The recipient's phone number as account reference
            businessShortCode: '174379', // Or a dynamic value if available in QR data
        });
    };

    const handleWithdraw = () => {
        if (!phoneNumber.trim() || !data.AgentId?.trim() || !data.StoreNumber?.trim() || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error("Please fill in all the fields.");
            return;
        }

        handlePayment("/api/stk_api/agent_stk_api", {
            phone: phoneNumber.trim(),
            amount: amount.toString(),
            storenumber: data.StoreNumber.trim(), // Store Number for agent withdrawal
            businessShortCode: data.AgentId.trim(), // Pass the Agent ID as BusinessShortCode
        });
    };


    // Save Contact Functionality
  const handleSaveContact = () => {
    if (transactionType !== "Contact") return;
    const contactData = [
      ["Title", "First Name", "Last Name", "Company Name", "Position", "Email", "Address", "Post Code", "City", "Country", "Phone Number"],
      [data.Title, data.FirstName, data.LastName, data.CompanyName, data.Position, data.Email, data.Address, data.PostCode, data.City, data.Country, data.PhoneNumber],
    ];
    const csvContent = contactData.map((row) => row.join(",")).join("\n");

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // Mobile: Save as vCard
      const vCard = `BEGIN:VCARD\nVERSION:3.0\nFN:${data.FirstName} ${data.LastName}\nORG:${data.CompanyName}\nTITLE:${data.Position}\nEMAIL:${data.Email}\nTEL:${data.PhoneNumber}\nADR:${data.Address}, ${data.City}, ${data.PostCode}, ${data.Country}\nEND:VCARD`;
      const blob = new Blob([vCard], { type: "text/vcard" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${data.FirstName}_${data.LastName}.vcf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Contact saved to phonebook!");
    } else {
      // Desktop: Save as CSV
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${data.FirstName}_${data.LastName}_contact.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Contact saved as CSV!");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 items-center">
      {/* Container with width constraints */}
      <div className="w-full md:w-1/3 lg:w-1/3 xl:w-1/3 2xl:w-1/3 flex flex-col flex-grow">
        {/* Header Section */}
        <div className="p-4 border-b border-gray-200 bg-white shadow-sm rounded-t-lg mx-2 sm:mx-0 mt-2 sm:mt-0">
          <h2 className="text-xl font-bold text-center"
              style={{color: "#3CB371"}}>
            {transactionType === 'Contact' ? (
              <>E-BUSINESS CARD SCAN DETAILS</>
            ) : (
              <>e-BIZ: M-PESA PAYMENT PAGE</>
            )}
          </h2>
        </div>
        {/* Main Content */}
        <div className="flex-1 p-4 overflow-auto mx-2 sm:mx-0">
          <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.15)] p-4 mb-4 border border-gray-200">
            {hasQrData ? (
              <>
                <div className="text-center">
                  <p className="text-lg mb-4 text-center">
                    {transactionType === 'Contact' ? (
                      <>You are viewing the Contact Details for <strong>{data.FirstName}</strong>.</>
                    ) : (
                      <>You are about to perform a <strong>{transactionType}</strong> transaction to <br /> {data.businessName ? <strong style={{color: "#3CB371"}}>{data.businessName}</strong> : <strong style={{color: "#3CB371"}}>BLTA SOLUTIONS LTD</strong>}.</>
                    )}
                  </p>
                </div>
                <hr />
                <br />

                {/* Transaction Details */}
                <div className="space-y-3">
                {transactionType === "PayBill" && (
                  <>
                    <p>Paybill Number: {data.PaybillNumber}</p>
                    <p>Account Number: {data.AccountNumber}</p>
                    <label className="block text-sm font-bold">Amount:</label>
                    <div className="relative">
                      <Input
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="Enter Amount (KES)"
                        type="number"
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-md shadow-sm pr-10 w-full"
                      />
                      <button
                        onClick={() => setShowCalculator(true)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                      >
                        <HiCalculator className="h-5 w-5" />
                      </button>
                    </div>
                    {showCalculator && (
                      <Calculator
                        onCalculate={(result) => setAmount(result)}
                        onClose={() => setShowCalculator(false)}
                        onClear={() => setAmount('')}
                      />
                    )}
                  </>
                )}

                  {transactionType === "BuyGoods" && (
                    <>
                      <p>Till Number: {data.TillNumber}</p>
                      <label className="block text-sm font-bold">Amount:</label>
                      <div className="relative">
                      <Input
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="Enter Amount (KES)"
                        type="number"
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-md shadow-sm pr-10 w-full"
                      />
                      <button
                        onClick={() => setShowCalculator(true)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                      >
                        <HiCalculator className="h-5 w-5" />
                      </button>
                    </div>
                    {showCalculator && (
                      <Calculator
                        onCalculate={(result) => setAmount(result)}
                        onClose={() => setShowCalculator(false)}
                        onClear={() => setAmount('')}
                      />
                    )}
                    </>
                  )}

                  {transactionType === "SendMoney" && (
                    <>
                      <p>Recipient Phone Number: {data.RecepientPhoneNumber}</p>
                      <label className="block text-sm font-bold">Amount:</label>
                      <div className="relative">
                      <Input
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="Enter Amount (KES)"
                        type="number"
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-md shadow-sm pr-10 w-full"
                      />
                      <button
                        onClick={() => setShowCalculator(true)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                      >
                        <HiCalculator className="h-5 w-5" />
                      </button>
                    </div>
                    {showCalculator && (
                      <Calculator
                        onCalculate={(result) => setAmount(result)}
                        onClose={() => setShowCalculator(false)}
                        onClear={() => setAmount('')}
                      />
                    )}
                    </>
                  )}

                  {transactionType === "WithdrawMoney" && (
                    <>
                      <p>Agent ID: {data.AgentId}</p>
                      <p>Store Number: {data.StoreNumber}</p>
                      <label className="block text-sm font-bold">Amount:</label>
                      <div className="relative">
                      <Input
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="Enter Amount (KES)"
                        type="number"
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-md shadow-sm pr-10 w-full"
                      />
                      <button
                        onClick={() => setShowCalculator(true)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                      >
                        <HiCalculator className="h-5 w-5" />
                      </button>
                    </div>
                    {showCalculator && (
                      <Calculator
                        onCalculate={(result) => setAmount(result)}
                        onClose={() => setShowCalculator(false)}
                        onClear={() => setAmount('')}
                      />
                    )}
                    </>
                  )}

                  {transactionType === "Contact" && (
                    <>
                      {data.Photo && (
                        <div className="mt-4 flex flex-col items-center">
                          <p className="text-center">Profile Picture:</p>
                          <img
                            src={`data:image/png;base64,${data.Photo}`}
                            alt="Scanned Contact"
                            className="mt-2 w-32 h-32 object-cover rounded-full shadow-md border border-gray-300"
                            onError={(e) => console.error("Image Load Error:", e)}
                          />
                        </div>
                      )}
                      <p>Title: {data.Title}</p>
                      <p>First Name: {data.FirstName}</p>
                      <p>Last Name: {data.LastName}</p>
                      <p>Company Name: {data.CompanyName}</p>
                      <p>Position: {data.Position}</p>
                      <p>Email: {data.Email}</p>
                      <p>Address: {data.Address}</p>
                      <p>Post Code: {data.PostCode}</p>
                      <p>City: {data.City}</p>
                      <p>Country: {data.Country}</p>
                      <p>Phone Number: {data.PhoneNumber}</p>
                    </>
                  )}
                </div>

                {/* Phone Number Input */}
                {transactionType && transactionType !== "Contact" && (
                  <div className="mt-4">
                    <label className="block text-sm font-bold">Payers Phone Number:</label>
                    <Input
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      onBlur={handlePhoneNumberBlur}
                      placeholder="Enter Phone Number"
                      type="tel" // Change to tel input type
                      inputMode="tel" // Ensure numeric keyboard on mobile
                      pattern="[0-9\- ]*" // Only allow numbers, dashes and spaces
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-md shadow-sm"
                      onKeyDown={(e) => {
                        // Only allow numbers, dashes, spaces, and navigation keys
                        const allowedKeys = [
                          '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                          '-', ' ', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'
                        ];
                        if (!allowedKeys.includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                    {warning && <p className="text-yellow-600 text-sm mt-1">{warning}</p>}
                    {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-xl font-bold text-gray-400 p-8">
                <div className="flex flex-col items-center space-y-2">
                  <div className="text-5xl">⚠️</div>
                  <span>
                    Scan an e-Biz QR Code and enter the resultant URL to proceed with payment
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

          {/* Updated Action Buttons section */}
        <div className="p-4 border-t border-gray-200 bg-white shadow-sm rounded-b-lg mx-2 sm:mx-0 mb-2 sm:mb-0">
          {hasQrData && ( // Only show buttons if QR data is available
            <div className="flex flex-col space-y-2">
              {(transactionType === "PayBill" ||
                transactionType === "BuyGoods" ||
                transactionType === "SendMoney" ||
                transactionType === "WithdrawMoney") && (
                <Button
                  className={`font-bold w-full text-white py-3 rounded-md shadow-md flex items-center justify-center ${
                    isPaying ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-900 hover:bg-green-800'
                  }`}
                  disabled={
                    isPaying ||
                    !!error || !!warning || phoneNumber.length !== 12 || !amount || isNaN(Number(amount)) ||
                    Number(amount) <= 0
                  }
                  onClick={() => {
                    switch (transactionType) {
                      case "PayBill":
                        return handlePayBill();
                      case "BuyGoods":
                        return handlePayTill();
                      case "SendMoney":
                        return handleSendMoney();
                      case "WithdrawMoney":
                        return handleWithdraw();
                      default:
                        return;
                    }
                  }}
                >
                  <HiOutlineCreditCard className="mr-2" />
                  {isPaying ?
                  (
                    <span>
                      Processing... {countdown}s
                    </span>
                  ) : (
                    <>
                      {transactionType === "SendMoney"
                        ? "SEND"
                        : transactionType === "WithdrawMoney"
                        ? "WITHDRAW"
                        : "PAY"}
                    </>
                  )}
                </Button>
              )}

              {transactionType === "Contact" && (
                <Button
                  className="font-bold w-full bg-green-900 text-white py-3 rounded-md shadow-md"
                  style={{ backgroundColor: "#006400" }}
                  onClick={handleSaveContact}
                >
                  Save Contact
                </Button>
              )}

            </div>
          )}
          {paymentStatus === 'cancelled' && (
              <div className="text-red-500">
                  Payment cancelled by the user
              </div>
          )}
        {paymentStatus === 'success' && (
              <div className="text-green-500">
                  Payment successful! Redirecting...
              </div>
          )}
        </div>

        {/* Transaction History Button */}
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center text-sm text-gray-700 hover:text-green-700 hover:underline"
            >
              <History className="w-4 h-4 mr-1" />
              View History
            </button>
          </div>

          {/* History Modal */}
          {showHistory && (
            <TransactionHistoryModal
              phoneNumber={phoneNumber}
              onClose={() => setShowHistory(false)}
            />
          )}

        {/* Footer Section */}
        <div className="py-4 text-center text-sm text-gray-500">
          Powered by{' '}
          <Link
            href="https://www.bltasolutions.co.ke"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-800 hover:underline"
          >
            BLTA Solutions
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomeUI;