import Layout from "@/components/Layout";
import { useState, useRef, useEffect } from "react";
import QRCode from "react-qr-code";
import QrSvg from "@wojtekmaj/react-qr-svg";

const QrToURLGenerator = () => {
  const [transactionType, setTransactionType] = useState("PayBill");
  const qrSvgRef = useRef<SVGSVGElement>(null);
  const [qrColor, setQrColor] = useState("#000000");
    
      useEffect(() => {
        if (qrSvgRef.current) {
          const paths = qrSvgRef.current.querySelectorAll("path");
          paths.forEach(path => {
            path.setAttribute("fill", qrColor);
          });
        }
      }, [qrColor]);
  const [formData, setFormData] = useState({
    TransactionType: "",
    PaybillNumber: "",
    AccountNumber: "",
    TillNumber: "",
    AgentId: "",
    StoreNumber: "",
    RecepientPhoneNumber: "",
    Amount: "",
    PhoneNumber: "254",
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
    Photo: "",
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false); // State to control QR code visibility

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const compressImage = (file: File) => {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const maxSize = 100;

          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.5));
        };
      };
    });
  };

  const handlePhoneNumberChange = (e: { target: { value: string; }; }) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters
    
    if (!value.startsWith("254")) {
      value = "254" + value;
    }
    
    setFormData({ ...formData, PhoneNumber: value });
  };
  
  const handlePhoneNumberBlur = () => {
    const { PhoneNumber } = formData;
    
    if (!PhoneNumber.startsWith("254")) {
      alert("Warning: Phone number should start with 254");
      return;
    }
    
    if (PhoneNumber.length !== 12) {
      alert("Error: Phone number must be exactly 12 digits");
      return;
    }
    
    if (PhoneNumber.charAt(3) === "0") {
      alert("Error: The next digit after '254' should not be zero");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressedBase64 = await compressImage(file);
      const base64String = compressedBase64.replace(/^data:image\/(png|jpeg);base64,/, "");

      setPhotoPreview(compressedBase64);
      setFormData((prev) => ({ ...prev, Photo: base64String }));
    }
  };

  const getQrData = async () => {
    setIsLoading(true);
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
          Photo: formData.Photo,
        };
        break;
      default:
        qrData = {};
    }

    const encodedData = encodeURIComponent(JSON.stringify(qrData));
    const originalUrl = `http://e-biz-mpesa-payment-app.vercel.app/QrResultsPage?data=${encodedData}`;

    try {
      const response = await fetch(`https://api.tinyurl.com/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer QeiZ8ZP85UdMKoZxaDDo2k8xuquZNXT6vys45A1JImuP4emSxSi2Zz655QDJ',
        },
        body: JSON.stringify({
          url: originalUrl,
          domain: "tiny.one",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.data || !data.data.tiny_url) {
        throw new Error("Invalid TinyURL API response");
      }

      const shortUrl = data.data.tiny_url;
      return shortUrl;
    } catch (error) {
      console.error("Error creating TinyURL:", error);
      alert("Error shortening URL. Please check the console for details.");
      return originalUrl;
    } finally {
      setIsLoading(false);
    }
  };

  const getRequiredFields = () => {
    switch (transactionType) {
      case "PayBill":
        return ["PaybillNumber", "AccountNumber", "Amount"];
      case "BuyGoods":
        return ["TillNumber", "Amount", "PhoneNumber"];
      case "SendMoney":
        return ["RecepientPhoneNumber", "Amount"];
      case "WithdrawMoney":
        return ["AgentId", "StoreNumber", "Amount"];  
            
      default:
        return [];
    }
  };
  
  const isFormValid = () => {
    if (formData.TransactionType === "Contact") {
      return true; // Always valid when TransactionType is 'Contact'
    }
  
    const requiredFields = getRequiredFields() as (keyof typeof formData)[];
    return requiredFields.every(field => formData[field].trim() !== "");
  };
    

  const handleScanQRCode = async () => {
    const shortUrl = await getQrData();
    setQrData(shortUrl);
    setShowQRCode(true); // Show QR code after generation
  };

  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQrCode = () => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector("svg");

      if (svg) {
        const width = svg.clientWidth;
        const height = svg.clientHeight;

        if (!width || !height) {
          console.error("SVG dimensions not available. Using fallback.");
          return alert("Error downloading QR Code. Please try again.");
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = width;
        canvas.height = height;

        ctx?.fillStyle && (ctx.fillStyle = "white");
        ctx?.fillRect(0, 0, canvas.width, canvas.height);

        const img = new Image();
        const svgString = new XMLSerializer().serializeToString(svg);
        const svgBase64 = btoa(unescape(encodeURIComponent(svgString)));
        const imgSrc = `data:image/svg+xml;base64,${svgBase64}`;

        img.onload = () => {
          ctx?.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = pngUrl;
          link.download = "QrCode.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        img.onerror = () => {
          console.error("Error loading SVG image.");
          alert("Error downloading QR Code. Please try again.");
        };

        img.src = imgSrc;
      } else {
        console.error("SVG element not found.");
        alert("Error downloading QR Code. Please try again.");
      }
    } else {
      console.error("QR Code container ref not attached.");
      alert("Error downloading QR Code. Please try again.");
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
            <input type="text" name="PhoneNumber" placeholder="Phone Number" value={formData.PhoneNumber} onChange={handlePhoneNumberChange} onBlur={handlePhoneNumberBlur} className="w-full p-2 border rounded-lg mb-2" />
          </>
        )}

        {transactionType === "BuyGoods" && (
          <>
            <input type="text" name="TillNumber" placeholder="Till Number" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="number" name="Amount" placeholder="Amount" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="text" name="PhoneNumber" placeholder="Phone Number" value={formData.PhoneNumber} onChange={handlePhoneNumberChange} onBlur={handlePhoneNumberBlur} className="w-full p-2 border rounded-lg mb-2" />
          </>
        )}

        {transactionType === "SendMoney" && (
          <>
            <input type="text" name="RecepientPhoneNumber" placeholder="Recepient Phone Number" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="number" name="Amount" placeholder="Amount" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="text" name="PhoneNumber" placeholder="Phone Number" value={formData.PhoneNumber} onChange={handlePhoneNumberChange} onBlur={handlePhoneNumberBlur} className="w-full p-2 border rounded-lg mb-2" />
          </>
        )}

        {transactionType === "WithdrawMoney" && (
          <>
            <input type="text" name="AgentId" placeholder="Agent ID" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="text" name="StoreNumber" placeholder="Store Number" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="number" name="Amount" placeholder="Amount" onChange={handleChange} className="w-full p-2 border rounded-lg mb-2" />
            <input type="text" name="PhoneNumber" placeholder="Phone Number" value={formData.PhoneNumber} onChange={handlePhoneNumberChange} onBlur={handlePhoneNumberBlur} className="w-full p-2 border rounded-lg mb-2" />
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photo</label>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="w-full p-2 border rounded-lg mb-2" />

            {photoPreview && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Preview:</p>
                <img src={photoPreview} alt="Uploaded" className="w-32 h-32 object-cover rounded-md mt-1" />
              </div>
            )}
          </>
        )}

        {/* Generate QR Code Button */}
        <button
          onClick={handleScanQRCode}
          disabled={!isFormValid() || isLoading}
          className={`w-full mt-4 px-4 py-2 rounded-lg 
            ${isFormValid() ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`}
        >
          {isLoading ? "Generating..." : "Generate QR Code"}
        </button>

        {/* QR Code Display */}
        <div className="flex flex-col items-center mt-4" ref={qrRef}>
          {showQRCode && qrData && <QRCode value={qrData} size={180} level="H" />}
          {showQRCode && qrData && (            
            <button
              onClick={downloadQrCode}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Download QR Code
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default QrToURLGenerator;