import api from "./axios";

export async function getActivePromotions() {
  const res = await api.get("/promotions/active");
  return res.data;
}

export async function previewPromotion(code, items) {
  const res = await api.post("/promotions/preview", { code, items });
  return res.data;
}
