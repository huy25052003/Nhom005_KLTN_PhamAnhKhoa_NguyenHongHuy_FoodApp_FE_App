import { api } from "./axios";

export async function getOrders(page = 0, size = 5) {
  const res = await api.get("/orders", { params: { page, size } });
  return res.data;
}

export async function updateOrderStatus(id, status) {
  const res = await api.put(`/orders/${id}/status`, null, { params: { status } });
  return res.data;
}

export async function cancelOrder(id) {
  const res = await api.put(`/orders/${id}/cancel`);
  return res.data;
}

export async function getOrder(id) {
  const res = await api.get(`/orders/${id}`);
  return res.data;
}

export async function placeOrder(items) {
  const res = await api.post("/orders", items);
  return res.data;
}

export async function placeOrderFromCart(cart) {
  const items = (cart?.items || cart?.cartItems || []).map((ci) => ({
    product: { id: ci.product?.id ?? ci.productId },
    quantity: ci.quantity ?? 1,
  }));
  const res = await api.post("/orders", items);
  return res.data;
}

export async function getMyOrders() {
  const { data } = await api.get("orders/my");
  return data;
}

export async function cancelMyOrder(id) {
  const { data } = await api.put(`orders/${id}/cancel`);
  return data; 
}

export async function createOrder(payload) {
  const res = await api.post("orders", payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
}

export function cartToOrderPayload(cart, extra = {}) {
  const items = (cart?.items || cart?.cartItems || []).map((it) => ({
    product: { id: it?.product?.id ?? it?.productId ?? it?.id },
    quantity: it?.quantity ?? 1,
    price: it?.product?.price ?? it?.price ?? 0,
  }));
  return { items, ...extra };
}

export async function createCodOrderFromCart(cart, note) {
  const payload = cartToOrderPayload(cart, { paymentMethod: "COD", note });
  return createOrder(payload);
}

export async function createOrderForPayOS(cart, note) {
  const payload = cartToOrderPayload(cart, { paymentMethod: "PAYOS", note });
  return createOrder(payload);
}

export async function getOrderById(id) {
  const res = await api.get(`orders/${id}`);
  return res.data;
}