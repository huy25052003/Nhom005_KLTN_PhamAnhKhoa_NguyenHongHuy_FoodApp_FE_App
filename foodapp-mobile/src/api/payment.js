import { api } from "./axios";

export async function createPaymentLink(orderId) {
  if (!orderId) throw new Error("Thiếu orderId");
  const res = await api.post(`payments/create/${orderId}`);
  return typeof res.data === "string"
    ? res.data
    : (res.data?.url || res.data?.paymentUrl);
}

export async function createPayOSLink(orderId) {
  return createPaymentLink(orderId);
}