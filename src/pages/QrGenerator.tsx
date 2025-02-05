import Layout from "@/components/Layout";
import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

const QrGenerator = () => {
  const [transactionType, setTransactionType] = useState("PayBill");
  const [formData, setFormData] = useState({
    PaybillNumber: "",
    AccountNumber: "",
    TillNumber: "",
    AgentId: "",
    StoreNumber: "",
    RecepientPhoneNumber: "",
    Amount: "",

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getQrData = () => {
    switch (transactionType) {
      case "PayBill":
        return JSON.stringify({
          TransactionType: "PayBill",
          PaybillNumber: formData.PaybillNumber,
          AccountNumber: formData.AccountNumber,
          Amount: formData.Amount,
        });
      case "BuyGoods":
        return JSON.stringify({
          TransactionType: "BuyGoods",
          TillNumber: formData.TillNumber,
          Amount: formData.Amount,
        });
      case "SendMoney":
        return JSON.stringify({
          TransactionType: "SendMoney",
          RecepientPhoneNumber: formData.RecepientPhoneNumber,
        });
      case "WithdrawMoney":
        return JSON.stringify({
          TransactionType: "WithdrawMoney",
          AgentId: formData.AgentId,
          StoreNumber: formData.StoreNumber,
        });
        case "Contact":
        return JSON.stringify({
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
        });
      default:
        return "";
    }
  };

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
      <div className="w-full border-t-2 border-gray-300 my-4"></div>  {/* Added Divider */}
      <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg mt-8">
        <h2 className="text-2xl font-bold text-center mb-4">Generate QR Code</h2>

        <label className="block mb-2 text-sm font-medium text-gray-900">
          Transaction Type
        </label>
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
          </>
        )}

        {transactionType === "BuyGoods" && (
          <>
            <input type="text" name="TillNumber" placeholder="Till Number" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="number" name="Amount" placeholder="Amount" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
          </>
        )}

        {transactionType === "SendMoney" && (
          <input type="text" name="RecepientPhoneNumber" placeholder="Recepient Phone Number" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
        )}

        {transactionType === "WithdrawMoney" && (
          <>
            <input type="text" name="AgentId" placeholder="Agent ID" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="text" name="StoreNumber" placeholder="Store Number" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
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
          </>
        )}

        <div className="flex flex-col items-center mt-4">
          <QRCodeCanvas value={getQrData()} size={180} />
          <button onClick={downloadQrCode} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg">
            Download QR Code
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default QrGenerator;
