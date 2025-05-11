// src/utils/paymentStatusStore.ts
type StatusType = "Pending" | "Success" | "Cancelled" | "Failed";

const statusStore: Record<string, StatusType> = {};

export const setPaymentStatus = (key: string, status: StatusType) => {
  statusStore[key] = status;
};

export const getPaymentStatus = (key: string): StatusType => {
  return statusStore[key] || "Pending";
};
