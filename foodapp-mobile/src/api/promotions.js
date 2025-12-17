import { api } from "./axios";

export async function getActivePromotions() {
  const res = await api.get("/api/promotions/active");
  return res.data;
}

export async function previewPromotion(code, items) {
  const res = await api.post("/api/promotions/preview", { code, items });
  return res.data;
}
