import { TRANSACTION_TYPE } from "./TransactionType";

export interface Data {
  name: string;
  logo: string;
  paybillNumber: string;
  accountNumber: string;
  tillNumber: string;
  storeNumber: string;
  agentNumber: string;
  amount: string;
  type: TRANSACTION_TYPE;
  code: string;
  bannerText: string;
  color: string;
  phoneNumber:string;
  hideAmount:boolean;

  // New fields for settings
  defaultPhoneNumber: string;
  defaultPaybillNumber: string;
  defaultAccountNumber: string;
  defaultAgentNumber: string;
  defaultTillNumber: string;
  defaultStoreNumber: string;
  autoOpenLinks: boolean;
  defaultCamera: "front" | "back";
  theme: "light" | "dark";
}

export type FormData = Partial<Data>;
