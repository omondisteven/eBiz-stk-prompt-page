import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { HiOutlineCreditCard, HiCalculator } from "react-icons/hi";
import { HiX } from "react-icons/hi";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import 'react-toastify/dist/ReactToastify.css';
import { useAppContext } from "@/context/AppContext"; 
import Link from "next/link";

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
      onClear(); // Clear the amount input box
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
                btn === 'C' ? 'bg-red-500 text-white hover:bg-red-600' : 
                btn === '⌫' ? 'bg-gray-500 text-white hover:bg-gray-600' : 
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
  const router = useRouter();
  const [transactionType, setTransactionType] = useState("");
  const [data, setData] = useState<any>({});
  const { data: appData } = useAppContext(); // Use the context
  const [phoneNumber, setPhoneNumber] = useState("254"); // Initialize with default value
  const [amount, setAmount] = useState(data.Amount || ""); // State for editable Amount
  const [warning, setWarning] = useState<string | null>(null); // Warning message
  const [error, setError] = useState<string | null>(null); // Error message
  const [showCalculator, setShowCalculator] = useState(false);

  // Update phoneNumber when QR code data is decoded
  useEffect(() => {
    if (router.query.data) {
      const parsedData = JSON.parse(decodeURIComponent(router.query.data as string));
      setTransactionType(parsedData.TransactionType);
      setData(parsedData);
      setAmount(parsedData.Amount || ""); // Initialize Amount from parsed data
      setPhoneNumber(parsedData.PhoneNumber || "254"); // Initialize PhoneNumber from parsed data
    }
  }, [router.query]);

  // Handle phone number input change
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Ensure the number starts with "254"
    if (!value.startsWith("254")) {
      value = "254";
      setWarning("Phone number must start with '254'.");
    } else {
      setWarning(null);
    }

    // Validate the number after "254"
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
  };

  // Validate phone number length on blur
  const handlePhoneNumberBlur = () => {
    if (phoneNumber.length !== 12) {
      setError("Phone number must be exactly 12 digits.");
    } else {
      setError(null);
    }
  };

  // Handle Amount input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
  };

  // ******PAYMENT METHODS******
  const handlePayBill = async () => {
    if (
      !phoneNumber.trim() ||
      !data.PaybillNumber?.trim() ||
      !data.AccountNumber?.trim() ||
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
          accountnumber: data.AccountNumber.trim(),
        }),
      });
  
      const result = await response.json();
      if (response.ok) {
        toast.success("Payment initiated successfully! Please enter your M-pesa PIN on your phone when prompted shortly");
        // Add 3-second delay before redirecting
      setTimeout(() => {
        router.push(
          `/ThankYouPage?data=${encodeURIComponent(
            JSON.stringify({ ...data, Amount: amount }) // overwrite the amount from QR with user input
          )}`
        );
      }, 6000);
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
      !data.TillNumber?.trim() ||
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
          accountnumber: data.TillNumber.trim(),
        }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success("Payment initiated successfully! Please enter your M-pesa PIN on your phone when prompted shortly");
        // Add 3-second delay before redirecting
        setTimeout(() => {
          router.push(
            `/ThankYouPage?data=${encodeURIComponent(
              JSON.stringify({ ...data, Amount: amount }) // overwrite the amount from QR with user input
            )}`
          );
        }, 3000);
      } else {
        toast.error(result?.message || "Something went wrong.");
      }
    } catch (error) {
      toast.error("Network error: Unable to initiate payment.");
    }
  };

  const handleSendMoney = async () => {
    if (
      !phoneNumber.trim() ||
      !data.RecepientPhoneNumber?.trim() ||
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
          accountnumber: data.RecepientPhoneNumber.trim(),
        }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success("Payment initiated successfully! Please enter your M-pesa PIN on your phone when prompted shortly");
        // Add 3-second delay before redirecting
        setTimeout(() => {
          router.push(
            `/ThankYouPage?data=${encodeURIComponent(
              JSON.stringify({ ...data, Amount: amount }) // overwrite the amount from QR with user input
            )}`
          );
        }, 3000);
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
      !data.AgentId?.trim() ||
      !data.StoreNumber?.trim() ||
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
          storenumber: data.StoreNumber.trim(),
        }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success("Payment initiated successfully! Please enter your M-pesa PIN on your phone when prompted shortly");
        setTimeout(() => {
          router.push(
            `/ThankYouPage?data=${encodeURIComponent(
              JSON.stringify({ ...data, Amount: amount }) // overwrite the amount from QR with user input
            )}`
          );
        }, 3000);
      } else {
        toast.error(result?.message || "Something went wrong.");
      }
    } catch (error) {
      toast.error("Network error: Unable to initiate payment.");
    }
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
              <>M-POSTER: M-PESA PAYMENT PROMPT</>
            )}
          </h2>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 overflow-auto mx-2 sm:mx-0">
          <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.15)] p-4 mb-4 border border-gray-200">
            <div className="text-center">
            <p className="text-lg mb-4 text-center">
              {transactionType === 'Contact' ? (
                <>You are viewing the Contact Details for <strong>{data.FirstName}</strong>.</>
              ) : (
                <>You are about to perform a <strong style={{color: "#3CB371"}}>{transactionType}</strong> transaction to {data.businessName ? <strong style={{color: "#3CB371"}}>{data.businessName}</strong> : <strong style={{color: "#3CB371"}}>BLTA SOLUTIONS LTD</strong>}.</>
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
            {/* Update the phone number input field in the transaction details section */}
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
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="p-4 border-t border-gray-200 bg-white shadow-sm rounded-b-lg mx-2 sm:mx-0 mb-2 sm:mb-0">
          <div className="flex flex-col space-y-2">
            {transactionType === "PayBill" && (
              <Button
                className="font-bold w-full bg-green-900 text-white py-3 rounded-md shadow-md"
                style={{ backgroundColor: "#006400" }}
                onClick={handlePayBill}
                disabled={!!error || !!warning || phoneNumber.length !== 12 || !amount || isNaN(Number(amount)) || Number(amount) <= 0}
              >
                <HiOutlineCreditCard className="mr-2" />
                PAY
              </Button>
            )}

            {transactionType === "BuyGoods" && (
              <Button
                className="font-bold w-full bg-green-700 text-white py-3 rounded-md shadow-md"
                style={{ backgroundColor: "#006400" }}
                onClick={handlePayTill}
                disabled={!!error || !!warning || phoneNumber.length !== 12 || !amount || isNaN(Number(amount)) || Number(amount) <= 0}
              >
                <HiOutlineCreditCard className="mr-2" />
                PAY
              </Button>
            )}

            {transactionType === "SendMoney" && (
              <Button
                className="font-bold w-full bg-green-900 text-white py-3 rounded-md shadow-md"
                style={{ backgroundColor: "#006400" }}
                onClick={handleSendMoney}
                disabled={!!error || !!warning || phoneNumber.length !== 12 || !amount || isNaN(Number(amount)) || Number(amount) <= 0}
              >
                <HiOutlineCreditCard className="mr-2" />
                SEND
              </Button>
            )}

            {transactionType === "WithdrawMoney" && (
              <Button
                className="font-bold w-full bg-green-900 text-white py-3 rounded-md shadow-md"
                style={{ backgroundColor: "#006400" }}
                onClick={handleWithdraw}
                disabled={!!error || !!warning || phoneNumber.length !== 12 || !amount || isNaN(Number(amount)) || Number(amount) <= 0}
              >
                <HiOutlineCreditCard className="mr-2" />
                WITHDRAW
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

            <Button
              className="font-bold w-full bg-gray-700 bg-gray-800 text-white py-3 rounded-md shadow-md"
              onClick={() => router.push("ThankYouPage")}
            >
              <HiX className="mr-2" />
              Cancel
            </Button>
          </div>
        </div>
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