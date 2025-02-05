import { FormData } from "@/@types/Data";
import { TRANSACTION_TYPE } from "@/@types/TransactionType";
import useLocalStorage from "@/hooks/useLocalStorage";
import { PESAQR_DB } from "@/utils/constants";
import { createContext, useEffect, useState } from "react";
import colors from "tailwindcss/colors";

// Define the default data structure
const defaultData: FormData = {
  paybillNumber: "",
  accountNumber: "",
  // amount: 0,
  color: colors.green[600], // Ensuring consistency with previous color setting
  hideAmount: false,
  type: TRANSACTION_TYPE.TILL_NUMBER, // Retaining the transaction type
  bannerText: "SCAN WITH M-PESA", // Ensuring all required fields are set
};

export interface AppContextType {
  data: FormData;
  setData: (data: FormData) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

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

  return (
    <AppContext.Provider value={{ data, setData }}>
      {children}
    </AppContext.Provider>
  );
};
