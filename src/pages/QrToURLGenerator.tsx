import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";

const QrToURLGenerator = () => {
  const [transactionType, setTransactionType] = useState("PayBill");
  const [formData, setFormData] = useState({
    PaybillNumber: "",
    AccountNumber: "",
    TillNumber: "",
    AgentId: "",
    StoreNumber: "",
    RecepientPhoneNumber: "",
    Amount: "",
    PhoneNumber: "",

    // Contact Details
    Title: "",
    FirstName: "",
    LastName: "",
    CompanyName: "",
    Position: "",
    Email: "",
    Address: "",
    PostCode: "",
    City: "",
    Country: "",
  });

  const [qrData, setQrData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Add a loading state

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getQrData = async () => {
    setIsLoading(true); // Set loading to true before fetching
    let qrData = {};
    switch (transactionType) {
      case "PayBill":
        qrData = {
          TransactionType: "PayBill",
          PaybillNumber: formData.PaybillNumber,
          AccountNumber: formData.AccountNumber,
          Amount: formData.Amount,
          PhoneNumber: formData.PhoneNumber,
        };
        break;
      case "BuyGoods":
        qrData = {
          TransactionType: "BuyGoods",
          TillNumber: formData.TillNumber,
          Amount: formData.Amount,
          PhoneNumber: formData.PhoneNumber,
        };
        break;
      case "SendMoney":
        qrData = {
          TransactionType: "SendMoney",
          RecepientPhoneNumber: formData.RecepientPhoneNumber,
          Amount: formData.Amount,
          PhoneNumber: formData.PhoneNumber,
        };
        break;
      case "WithdrawMoney":
        qrData = {
          TransactionType: "WithdrawMoney",
          AgentId: formData.AgentId,
          StoreNumber: formData.StoreNumber,
          Amount: formData.Amount,
          PhoneNumber: formData.PhoneNumber,
        };
        break;
      case "Contact":
        qrData = {
          TransactionType: "Contact",
          Title: formData.Title,
          FirstName: formData.FirstName,
          LastName: formData.LastName,
          CompanyName: formData.CompanyName,
          Position: formData.Position,
          Email: formData.Email,
          Address: formData.Address,
          PostCode: formData.PostCode,
          City: formData.City,
          Country: formData.Country,
          PhoneNumber: formData.PhoneNumber,
        };
        break;
      default:
        qrData = {};
    }

    const encodedData = encodeURIComponent(JSON.stringify(qrData));
    const originalUrl = `http://e-biz-mpesa-payment-app.vercel.app/QrResultsPage?data=${encodedData}`;

    // Fetch the shortened URL from TinyURL API
    try {
      const response = await fetch(`https://api.tinyurl.com/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer QeiZ8ZP85UdMKoZxaDDo2k8xuquZNXT6vys45A1JImuP4emSxSi2Zz655QDJ',  // Replace with your actual TinyURL API key
        },
        body: JSON.stringify({
          url: originalUrl,
          domain: "tiny.one", // Specify the domain if needed
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.data || !data.data.tiny_url) {
        throw new Error("Invalid TinyURL API response");
      }

      const shortUrl = data.data.tiny_url; // Access the short URL correctly
      return shortUrl;
    } catch (error) {
      console.error("Error creating TinyURL:", error);
      alert("Error shortening URL. Please check the console for details."); // Alert the user.
      return originalUrl; // Fallback to original URL on error
    } finally {
      setIsLoading(false); // Set loading to false after fetch, regardless of success/failure
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const shortUrl = await getQrData();
      setQrData(shortUrl);
    };

    fetchData();
  }, [transactionType, formData]); // Corrected dependency array

  const downloadQrCode = () => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "QrCode.png";
      link.click();
    }
  };

  return (
    <Layout>
      <p className="text-xl text-center">Generate non Mpesa Qr Code for Payments or E-Business Card</p>
      <div className="w-full border-t-2 border-gray-300 my-4"></div>
      <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg mt-8">
        <h2 className="text-2xl font-bold text-center mb-4">Generate QR Code</h2>

        <label className="block mb-2 text-sm font-medium text-gray-900">Transaction Type</label>
        <select
          name="TransactionType"
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value)}
          className="w-full p-2 border rounded-lg mb-4"
        >
          <option value="PayBill">PayBill</option>
          <option value="BuyGoods">Buy Goods</option>
          <option value="SendMoney">Send Money</option>
          <option value="WithdrawMoney">Withdraw Money</option>
          <option value="Contact">Create Contact</option>
        </select>

        {transactionType === "PayBill" && (
          <>
            <input type="text" name="PaybillNumber" placeholder="Paybill Number" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="text" name="AccountNumber" placeholder="Account Number" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="number" name="Amount" placeholder="Amount" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="text" name="PhoneNumber" placeholder="PhoneNumber" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
          </>
        )}

        {transactionType === "BuyGoods" && (
          <>
            <input type="text" name="TillNumber" placeholder="Till Number" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="number" name="Amount" placeholder="Amount" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="text" name="PhoneNumber" placeholder="PhoneNumber" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
          </>
        )}

        {transactionType === "SendMoney" && (
          <>
            <input type="text" name="RecepientPhoneNumber" placeholder="Recepient Phone Number" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="number" name="Amount" placeholder="Amount" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="text" name="PhoneNumber" placeholder="PhoneNumber" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
          </>
        )}

        {transactionType === "WithdrawMoney" && (
          <>
            <input type="text" name="AgentId" placeholder="Agent ID" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="text" name="StoreNumber" placeholder="Store Number" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="number" name="Amount" placeholder="Amount" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="text" name="PhoneNumber" placeholder="PhoneNumber" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
          </>
        )}

        {transactionType === "Contact" && (
          <>
            <input type="text" name="Title" placeholder="Title (Mr./Mrs./Miss...)" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="text" name="FirstName" placeholder="First Name" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="text" name="LastName" placeholder="Last Name" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="text" name="CompanyName" placeholder="Company Name" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="text" name="Position" placeholder="Position" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="text" name="Email" placeholder="Email Address" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="text" name="Address" placeholder="Physical Address" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="text" name="PostCode" placeholder="Postal Code" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="text" name="City" placeholder="City of Residence" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="text" name="Country" placeholder="Country of Residence" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="text" name="PhoneNumber" placeholder="PhoneNumber" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
          </>
        )}

        <div className="flex flex-col items-center mt-4">
          {isLoading ? ( // Show loading indicator while fetching
            <p>Loading QR Code...</p>
          ) : qrData ? (
            <QRCodeCanvas value={qrData} size={180} />
          ) : (
            <p>No QR Code to display.</p> // Display a message if qrData is null
          )}

          <button onClick={downloadQrCode} disabled={isLoading} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg"> {/* Disable the button while loading */}
            {isLoading ? "Generating..." : "Download QR Code"} {/* Change button text while loading */}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default QrToURLGenerator;