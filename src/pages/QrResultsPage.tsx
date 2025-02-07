import Layout from "@/components/Layout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { HiOutlineCreditCard } from "react-icons/hi";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

const QrResultsPage = () => {
  const router = useRouter();
  const [transactionType, setTransactionType] = useState("");
  const [data, setData] = useState<any>({});
  const [phoneNumber, setPhoneNumber] = useState(""); // State for phone number input

  useEffect(() => {
    if (router.query.data) {
      const parsedData = JSON.parse(decodeURIComponent(router.query.data as string));
      setTransactionType(parsedData.TransactionType);
      setData(parsedData);
    }
  }, [router.query]);

  // ******PAYMENT METHODS******
  const handlePayBill = async () => {
    if (
      !phoneNumber.trim() ||
      !data.PaybillNumber?.trim() ||
      !data.AccountNumber?.trim() ||
      !data.Amount ||
      isNaN(Number(data.Amount)) || Number(data.Amount) <= 0
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
          amount: data.Amount.toString(),
          accountnumber: data.AccountNumber.trim(),
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
      !data.TillNumber?.trim() ||
      !data.Amount ||
      isNaN(Number(data.Amount)) || Number(data.Amount) <= 0
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
          amount: data.Amount.toString(),
          accountnumber: data.TillNumber.trim(),
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
      !phoneNumber.trim() ||
      !data.RecepientPhoneNumber?.trim() ||
      !data.Amount ||
      isNaN(Number(data.Amount)) || Number(data.Amount) <= 0
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
          amount: data.Amount.toString(),
          recepientPhoneNumber: data.RecepientPhoneNumber.trim(),
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
      !data.AgentId?.trim() ||
      !data.StoreNumber?.trim() ||
      !data.Amount ||
      isNaN(Number(data.Amount)) || Number(data.Amount) <= 0
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
          amount: data.Amount.toString(),
          accountnumber: data.StoreNumber.trim(),
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

  // Save Contact Functionality
  const handleSaveContact = () => {
    if (transactionType !== "Contact") return;

    const vCard = `BEGIN:VCARD\nVERSION:3.0\nFN:${data.FirstName} ${data.LastName}\nORG:${data.CompanyName}\nTITLE:${data.Position}\nEMAIL:${data.Email}\nTEL:${data.PhoneNumber}\nADR:${data.Address}, ${data.City}, ${data.PostCode}, ${data.Country}\nEND:VCARD`;
    const blob = new Blob([vCard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // Open "Add New Contact" on mobile
        const contact = {
            name: `${data.FirstName} ${data.LastName}`,
            email: data.Email,
            phoneNumbers: [{ number: data.PhoneNumber, label: "mobile" }],
            addresses: [{ street: data.Address, city: data.City, country: data.Country }],
            company: data.CompanyName,
            jobTitle: data.Position
        };
        try {
            if (navigator.contacts && navigator.contacts.create) {
                navigator.contacts.create(contact).then(() => {
                    toast.success("Contact saved to phonebook!");
                }).catch(() => {
                    toast.error("Failed to save contact.");
                });
            } else {
                window.location.href = url;
            }
        } catch (error) {
            window.location.href = url;
        }
    } else {
        // Desktop: Save as VCF file
        const link = document.createElement("a");
        link.href = url;
        link.download = `${data.FirstName}_${data.LastName}.vcf`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Contact saved as VCF file!");
    }
};

  return (
    <Layout>
      <h2 className="text-2xl font-bold text-center mb-4 flex items-center justify-center">
        M-PESA TRANSACTION DETAILS
      </h2>

      <div className="w-full border-t-2 border-gray-300 my-4"></div>

      <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg mt-8">
      <p className="text-xl text-center">
        {transactionType === 'Contact' ? (
          <>You are viewing the Contact Details for <strong>{data.FirstName}</strong>.</>
        ) : (
          <>You are about to perform a <strong>{transactionType}</strong> transaction. Please confirm or cancel.</>
        )}
      </p>

        <br />
        {transactionType === "PayBill" && (
          <>
            <p>Paybill Number: {data.PaybillNumber}</p>
            <p>Account Number: {data.AccountNumber}</p>
            <p>Amount: {data.Amount}</p>
          </>
        )}

        {transactionType === "BuyGoods" && (
          <>
            <p>Till Number: {data.TillNumber}</p>
            <p>Amount: {data.Amount}</p>
          </>
        )}

        {transactionType === "SendMoney" && (
          <>
            <p>Recipient Phone Number: {data.RecepientPhoneNumber}</p>
            <p>Amount: {data.Amount}</p>
          </>
        )}

        {transactionType === "WithdrawMoney" && (
          <>
            <p>Agent ID: {data.AgentId}</p>
            <p>Store Number: {data.StoreNumber}</p>
            <p>Amount: {data.Amount}</p>
          </>
        )}

        {transactionType === "Contact" && (
          <>
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

        {/* Phone Number Input and Payment Button */}
        {transactionType && (
          <div className="mt-4">
            {transactionType !== "Contact" && (
              <>
              <label className="block text-sm font-medium">Payers Phone Number</label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter Phone Number"
              />
              </>              
            )}
            
            <br />

            <div className="flex justify-between items-center mt-4 space-x-4">
              <div>
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

              {/* CANCEL BUTTON */}
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-700"
                onClick={() => router.push("./")}
              >
                CANCEL
              </button>

              {/* SAVE CONTACT BUTTON */}
              {transactionType === "Contact" && (
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-700"
                  onClick={handleSaveContact}
                >
                  Save Contact
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default QrResultsPage;