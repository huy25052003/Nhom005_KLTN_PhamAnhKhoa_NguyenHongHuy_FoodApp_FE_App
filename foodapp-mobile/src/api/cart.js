import { api } from "./axios";

export async function getCart() {
  const res = await api.get("/cart");
  return res.data;
}
export const getMyCart = getCart;

export async function addToCart(productId, quantity = 1) {
  const res = await api.post("/cart/items", null, { params: { productId, quantity } });
  return res.data;
}
export async function updateCartItem(itemId, quantity) {
  const res = await api.put(`/cart/items/${itemId}`, null, { params: { quantity } });
  return res.data;
}
export async function removeCartItem(itemId) {
  await api.delete(`/cart/items/${itemId}`);
}
export async function clearCart() {
  await api.delete("/cart");
}