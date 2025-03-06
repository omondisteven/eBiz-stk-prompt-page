import React, { useContext, useState } from "react";
import { Button } from "../ui/button";
import { AppContext, AppContextType } from "@/context/AppContext";
import { Input } from "../ui/input";
import { FiDelete } from "react-icons/fi";
import { TRANSACTION_TYPE } from "@/@types/TransactionType";

interface NumPadProps {
  className?: string;
  hideInput?: boolean;
  textColor?: string; // New prop for text color
}

const NumPad: React.FC<NumPadProps> = ({ className, hideInput = false, textColor = "#000000" }) => {
  const { data, setData } = useContext(AppContext) as AppContextType;
  const [expression, setExpression] = useState<string>("");

  const handleClick = (value: string) => {
    if (/[\+\-\×\÷]$/.test(expression) && /[\+\-\×\÷]/.test(value)) {
      return; // Prevent multiple consecutive operators
    }
    setExpression((prev) => prev + value);
  };

  const handleClear = () => {
    setExpression("");
  };

  const handleDeleteLast = () => {
    setExpression((prev) => prev.slice(0, -1));
  };

  const handleCalculate = () => {
    try {
      const sanitizedExpression = expression.replace(/×/g, "*").replace(/÷/g, "/");
      const result = eval(sanitizedExpression); // Evaluate safely
      setData({ ...data, amount: result.toString() });
      setExpression(result.toString());
    } catch (error) {
      setExpression("Error");
    }
  };

  return (
    <div className={`flex flex-col space-y-2 bg-gray-800 p-2 rounded-md border border-gray-700 ${className}`}>
      {/* Conditionally render the input box */}
      {!hideInput && (
        <Input
          value={expression}
          readOnly
          placeholder={`Enter Amount ${
            data.type === TRANSACTION_TYPE.AGENT ? "to withdraw" :
            data.type === TRANSACTION_TYPE.SEND_MONEY ? "to send" : "to pay"
          }`}
          className="font-display py-7 md:py-7 border-4 shadow-inner text-gray-900 text-xl md:text-4xl text-center w-full"
          style={{ color: textColor }} // Apply text color
        />
      )}
      <div className="w-full grid grid-cols-4 gap-1">
        {["1", "2", "3", "+"].map((item) => (
          <Button
            key={item}
            onClick={() => handleClick(item)}
            className="py-8 text-4xl font-bold bg-white hover:bg-gray-300 text-gray-900 border border-gray-800"
            style={{ color: textColor }} // Apply text color
          >
            {item}
          </Button>
        ))}
        {["4", "5", "6", "-"].map((item) => (
          <Button
            key={item}
            onClick={() => handleClick(item)}
            className="py-8 text-4xl font-bold bg-white hover:bg-gray-300 text-gray-900 border border-gray-800"
            style={{ color: textColor }} // Apply text color
          >
            {item}
          </Button>
        ))}
        {["7", "8", "9", "×"].map((item) => (
          <Button
            key={item}
            onClick={() => handleClick(item)}
            className="py-8 text-4xl font-bold bg-white hover:bg-gray-300 text-gray-900 border border-gray-800"
            style={{ color: textColor }} // Apply text color
          >
            {item}
          </Button>
        ))}
        {["CLR", "0", "Enter", "÷"].map((item) => (
          <Button
            key={item}
            onClick={() =>
              item === "CLR" ? handleClear() : 
              item === "Enter" ? handleCalculate() : 
              handleClick(item)
            }
            className="py-8 text-4xl font-bold bg-white hover:bg-gray-300 text-gray-900 border border-gray-800"
            style={{ color: textColor }} // Apply text color
          >
            {item}
          </Button>
        ))}
        <Button
          onClick={handleDeleteLast}
          className="col-span-4 py-8 text-4xl font-bold bg-white hover:bg-gray-300 text-gray-900 border border-gray-800"
          style={{ color: textColor }} // Apply text color
        >
          <FiDelete />
        </Button>
      </div>
    </div>
  );
};

export default NumPad;