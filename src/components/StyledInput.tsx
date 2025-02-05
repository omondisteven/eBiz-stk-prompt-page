import React from "react";
import { NumericFormat } from "react-number-format";
import { Input } from "@/components/ui/input";

interface StyledInputProps {
  label: string;
  value: string | number | undefined;
  placeholder: string;
  onValueChange: (value: string) => void;
}

const StyledInput: React.FC<StyledInputProps> = ({ label, value, placeholder, onValueChange }) => {
  return (
    <div className="mb-4">
      <p className="text-xl text-center font-semibold mb-1">{label}</p>
      <NumericFormat
        onValueChange={(values) => {
          if (values.floatValue && values.floatValue.toString().length <= 12) {
            onValueChange(values.value);
          }
        }}
        inputMode="numeric"
        value={value}
        customInput={Input}
        allowNegative={false}
        allowLeadingZeros={true}
        placeholder={placeholder}
        className="w-full text-center text-xl py-2 border-2 border-gray-300 rounded-lg focus:border-green-500"
      />
    </div>
  );
};

export default StyledInput;
