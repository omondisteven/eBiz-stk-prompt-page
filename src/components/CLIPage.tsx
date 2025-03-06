import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";

const CLIPage = () => {
  const [output, setOutput] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [currentStep, setCurrentStep] = useState<"menu" | "paybill" | "buygoods" | "sendmoney" | "withdraw">("menu");
  const [paybillData, setPaybillData] = useState({ paybillNumber: "", accountNumber: "", amount: "", phoneNumber: "" });
  const [buyGoodsData, setBuyGoodsData] = useState({ tillNumber: "", amount: "", phoneNumber: "" });
  const [sendMoneyData, setSendMoneyData] = useState({ receivingPhoneNumber: "", amount: "", sendingPhoneNumber: "" });
  const [withdrawData, setWithdrawData] = useState({ agentNumber: "", storeNumber: "", amount: "", phoneNumber: "" });

  const outputContainerRef = useRef<HTMLDivElement>(null);

  // Initialize the CLI with the main menu
  useEffect(() => {
    setOutput([
      "--- Main Menu ---",
      "1] Pay Bill",
      "2] Buy Goods",
      "3] Send Money",
      "4] Withdraw Money",
      "Select an option:",
    ]);
  }, []);

  // Scroll to the bottom of the output container whenever new content is added
  useEffect(() => {
    if (outputContainerRef.current) {
      outputContainerRef.current.scrollTop = outputContainerRef.current.scrollHeight;
    }
  }, [output]);

  const handleCommand = async (command: string) => {
    const newOutput = [...output, `> ${command}`];
    setOutput(newOutput);

    switch (currentStep) {
      case "menu":
        if (command === "1") {
          setCurrentStep("paybill");
          setOutput([...newOutput, "--- Pay Bill ---", "Enter Paybill Number:"]);
        } else if (command === "2") {
          setCurrentStep("buygoods");
          setOutput([...newOutput, "--- Buy Goods ---", "Enter Till Number:"]);
        } else if (command === "3") {
          setCurrentStep("sendmoney");
          setOutput([...newOutput, "--- Send Money ---", "Enter Receiving Phone Number (starting with 254):"]);
        } else if (command === "4") {
          setCurrentStep("withdraw");
          setOutput([...newOutput, "--- Withdraw Money ---", "Enter Agent Number:"]);
        } else {
          setOutput([...newOutput, "❌ Invalid choice. Please select a valid option."]);
        }
        break;

      case "paybill":
        if (!paybillData.paybillNumber) {
          setPaybillData({ ...paybillData, paybillNumber: command });
          setOutput([...newOutput, "Enter Account Number:"]);
        } else if (!paybillData.accountNumber) {
          setPaybillData({ ...paybillData, accountNumber: command });
          setOutput([...newOutput, "Enter Amount:"]);
        } else if (!paybillData.amount) {
          setPaybillData({ ...paybillData, amount: command });
          setOutput([...newOutput, "Enter Phone Number (starting with 254):"]);
        } else if (!paybillData.phoneNumber) {
          setPaybillData({ ...paybillData, phoneNumber: command });
          setOutput([
            ...newOutput,
            "--- Payment Summary ---",
            `Paybill Number: ${paybillData.paybillNumber}`,
            `Account Number: ${paybillData.accountNumber}`,
            `Amount: ${paybillData.amount}`,
            `Phone Number: ${command}`,
            "Proceed with payment? (Y/N):",
          ]);
        } else if (command.toLowerCase() === "y") {
          try {
            const response = await fetch("/api/stk_api/paybill_stk_api", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phone: paybillData.phoneNumber.trim(),
                amount: paybillData.amount.trim(),
                accountnumber: paybillData.accountNumber.trim(),
              }),
            });

            const result = await response.json();
            if (response.ok) {
              setOutput([...newOutput, "✅ Payment initiated successfully! Enter your M-Pesa PIN on your phone."]);
            } else {
              setOutput([...newOutput, `❌ Payment failed: ${result?.message || "Something went wrong."}`]);
            }
          } catch (error) {
            setOutput([...newOutput, "❌ Network error: Unable to initiate payment."]);
          }
          setCurrentStep("menu");
          setPaybillData({ paybillNumber: "", accountNumber: "", amount: "", phoneNumber: "" });
        } else {
          setOutput([...newOutput, "❌ Payment cancelled."]);
          setCurrentStep("menu");
          setPaybillData({ paybillNumber: "", accountNumber: "", amount: "", phoneNumber: "" });
        }
        break;

      case "buygoods":
        if (!buyGoodsData.tillNumber) {
          setBuyGoodsData({ ...buyGoodsData, tillNumber: command });
          setOutput([...newOutput, "Enter Amount:"]);
        } else if (!buyGoodsData.amount) {
          setBuyGoodsData({ ...buyGoodsData, amount: command });
          setOutput([...newOutput, "Enter Phone Number (starting with 254):"]);
        } else if (!buyGoodsData.phoneNumber) {
          setBuyGoodsData({ ...buyGoodsData, phoneNumber: command });
          setOutput([
            ...newOutput,
            "--- Purchase Summary ---",
            `Till Number: ${buyGoodsData.tillNumber}`,
            `Amount: ${buyGoodsData.amount}`,
            `Phone Number: ${command}`,
            "Proceed with payment? (Y/N):",
          ]);
        } else if (command.toLowerCase() === "y") {
          try {
            const response = await fetch("/api/stk_api/till_stk_api", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phone: buyGoodsData.phoneNumber.trim(),
                amount: buyGoodsData.amount.trim(),
                tillNumber: buyGoodsData.tillNumber.trim(),
              }),
            });

            const result = await response.json();
            if (response.ok) {
              setOutput([...newOutput, "✅ Payment initiated successfully! Enter your M-Pesa PIN on your phone."]);
            } else {
              setOutput([...newOutput, `❌ Payment failed: ${result?.message || "Something went wrong."}`]);
            }
          } catch (error) {
            setOutput([...newOutput, "❌ Network error: Unable to initiate payment."]);
          }
          setCurrentStep("menu");
          setBuyGoodsData({ tillNumber: "", amount: "", phoneNumber: "" });
        } else {
          setOutput([...newOutput, "❌ Payment cancelled."]);
          setCurrentStep("menu");
          setBuyGoodsData({ tillNumber: "", amount: "", phoneNumber: "" });
        }
        break;

      case "sendmoney":
        if (!sendMoneyData.receivingPhoneNumber) {
          setSendMoneyData({ ...sendMoneyData, receivingPhoneNumber: command });
          setOutput([...newOutput, "Enter Amount:"]);
        } else if (!sendMoneyData.amount) {
          setSendMoneyData({ ...sendMoneyData, amount: command });
          setOutput([...newOutput, "Enter Your Phone Number (starting with 254):"]);
        } else if (!sendMoneyData.sendingPhoneNumber) {
          setSendMoneyData({ ...sendMoneyData, sendingPhoneNumber: command });
          setOutput([
            ...newOutput,
            "--- Transfer Summary ---",
            `Receiving Phone Number: ${sendMoneyData.receivingPhoneNumber}`,
            `Amount: ${sendMoneyData.amount}`,
            `Sending Phone Number: ${command}`,
            "Proceed with transaction? (Y/N):",
          ]);
        } else if (command.toLowerCase() === "y") {
          try {
            const response = await fetch("/api/stk_api/sendmoney_stk_api", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phone: sendMoneyData.sendingPhoneNumber.trim(),
                amount: sendMoneyData.amount.trim(),
                recepientPhone: sendMoneyData.receivingPhoneNumber.trim(),
              }),
            });

            const result = await response.json();
            if (response.ok) {
              setOutput([...newOutput, "✅ Money sent successfully! Enter your M-Pesa PIN on your phone."]);
            } else {
              setOutput([...newOutput, `❌ Transaction failed: ${result?.message || "Something went wrong."}`]);
            }
          } catch (error) {
            setOutput([...newOutput, "❌ Network error: Unable to process transaction."]);
          }
          setCurrentStep("menu");
          setSendMoneyData({ receivingPhoneNumber: "", amount: "", sendingPhoneNumber: "" });
        } else {
          setOutput([...newOutput, "❌ Transaction cancelled."]);
          setCurrentStep("menu");
          setSendMoneyData({ receivingPhoneNumber: "", amount: "", sendingPhoneNumber: "" });
        }
        break;

      case "withdraw":
        if (!withdrawData.agentNumber) {
          setWithdrawData({ ...withdrawData, agentNumber: command });
          setOutput([...newOutput, "Enter Store Number:"]);
        } else if (!withdrawData.storeNumber) {
          setWithdrawData({ ...withdrawData, storeNumber: command });
          setOutput([...newOutput, "Enter Amount:"]);
        } else if (!withdrawData.amount) {
          setWithdrawData({ ...withdrawData, amount: command });
          setOutput([...newOutput, "Enter Phone Number (starting with 254):"]);
        } else if (!withdrawData.phoneNumber) {
          setWithdrawData({ ...withdrawData, phoneNumber: command });
          setOutput([
            ...newOutput,
            "--- Withdrawal Summary ---",
            `Agent Number: ${withdrawData.agentNumber}`,
            `Store Number: ${withdrawData.storeNumber}`,
            `Amount: ${withdrawData.amount}`,
            `Phone Number: ${command}`,
            "Proceed with withdrawal? (Y/N):",
          ]);
        } else if (command.toLowerCase() === "y") {
          try {
            const response = await fetch("/api/stk_api/agent_stk_api", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phone: withdrawData.phoneNumber.trim(),
                amount: withdrawData.amount.trim(),
                agentNumber: withdrawData.agentNumber.trim(),
                storeNumber: withdrawData.storeNumber.trim(),
              }),
            });

            const result = await response.json();
            if (response.ok) {
              setOutput([...newOutput, "✅ Withdrawal initiated successfully! Enter your M-Pesa PIN on your phone."]);
            } else {
              setOutput([...newOutput, `❌ Withdrawal failed: ${result?.message || "Something went wrong."}`]);
            }
          } catch (error) {
            setOutput([...newOutput, "❌ Network error: Unable to process withdrawal."]);
          }
          setCurrentStep("menu");
          setWithdrawData({ agentNumber: "", storeNumber: "", amount: "", phoneNumber: "" });
        } else {
          setOutput([...newOutput, "❌ Withdrawal cancelled."]);
          setCurrentStep("menu");
          setWithdrawData({ agentNumber: "", storeNumber: "", amount: "", phoneNumber: "" });
        }
        break;

      default:
        setOutput([...newOutput, "❌ Invalid step. Returning to main menu."]);
        setCurrentStep("menu");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (input.trim() === "") {
        // Return to main menu if input is empty
        setCurrentStep("menu");
        setOutput([
          ...output,
          "> [Return]",
          "--- Main Menu ---",
          "1] Pay Bill",
          "2] Buy Goods",
          "3] Send Money",
          "4] Withdraw Money",
          "Select an option:",
        ]);
      } else {
        handleCommand(input);
      }
      setInput("");
    } else if (e.key === "Escape") {
      // Return to main menu on Escape key
      setCurrentStep("menu");
      setOutput([
        ...output,
        "> [ESC]",
        "--- Main Menu ---",
        "1] Pay Bill",
        "2] Buy Goods",
        "3] Send Money",
        "4] Withdraw Money",
        "Select an option:",
      ]);
      setInput("");
    }
  };

  return (
    <Layout>
      <div className="bg-black text-white p-4 rounded-lg font-mono h-96 overflow-y-auto" ref={outputContainerRef}>
        <div className="mb-4">
          {output.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>
        <div className="flex items-center">
          <span className="text-green-400">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none text-white outline-none ml-2 flex-1"
            autoFocus
          />
        </div>
      </div>
    </Layout>
  );
};

export default CLIPage;