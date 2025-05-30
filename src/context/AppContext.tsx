// src/context/AppContext.ts
import { FormData } from "@/@types/Data";
import { TRANSACTION_TYPE } from "@/@types/TransactionType";
import useLocalStorage from "@/hooks/useLocalStorage";
import { PESAQR_DB } from "@/utils/constants";
import { createContext, useContext, useEffect, useState } from "react"; // Add useContext here
import colors from "tailwindcss/colors";

// Define the default data structure
const defaultData: FormData = {
  paybillNumber: "",
  accountNumber: "", 
  color: colors.green[600],
  hideAmount: false,
  type: TRANSACTION_TYPE.TILL_NUMBER,
  bannerText: "SCAN WITH M-PESA",

  // New fields for settings
  defaultPhoneNumber: "254",
  defaultPaybillNumber: "",
  defaultAccountNumber: "",
  defaultAgentNumber: "",
  defaultTillNumber: "",
  defaultStoreNumber: "",
  autoOpenLinks: true,
  defaultCamera: "back",
  theme: "light",
};

export interface AppContextType {
  data: FormData;
  setData: (data: Partial<FormData>) => void;
}

// export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [db, saveDb] = useLocalStorage<FormData>(PESAQR_DB, defaultData);
  const [data, setData] = useState<FormData>({ ...defaultData, ...db });

  // Load Data from DB
  useEffect(() => {
    setData((prev) => ({ ...prev, ...db, amount: undefined }));
    // eslint-disable-next-line
  }, []);

  // Save Updated Data
  useEffect(() => {
    if (data) {
      saveDb(data);
    }
    // eslint-disable-next-line
  }, [data]);

  // Update data function to allow partial updates
  const updateData = (newData: Partial<FormData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  // Function to store phone number after first transaction
  const storePhoneNumber = (phoneNumber: string) => {
    if (!data.defaultPhoneNumber || data.defaultPhoneNumber === "254") {
      updateData({ defaultPhoneNumber: phoneNumber });
    }
  };

  return (
    <AppContext.Provider value={{ data, setData: updateData, storePhoneNumber }}>
      {children}
    </AppContext.Provider>
  );
};

// Update the context type
export interface AppContextType {
  data: FormData;
  setData: (data: Partial<FormData>) => void;
  storePhoneNumber?: (phoneNumber: string) => void;
}

const defaultContextValue: AppContextType = {
  data: defaultData,
  setData: () => {},
  storePhoneNumber: () => {}
};

export const AppContext = createContext<AppContextType>(defaultContextValue);

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  return context; // No need for null check since we have default value
};