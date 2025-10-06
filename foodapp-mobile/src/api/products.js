import { api } from "./axios";

export async function getAllProducts() {
  const res = await api.get("api/products");
  return res.data;
}
export async function listProducts(params = {}) {
  const res = await api.get("api/products", { params });
  return res.data;
}
export async function getProduct(id) {
  const res = await api.get(`api/products/${id}`);
  return res.data;
}
export async function createProduct(payload) {
  const res = await api.post("api/products", payload);
  return res.data;
}
export async function updateProduct(id, payload) {
  const res = await api.put(`api/products/${id}`, payload);
  return res.data;
}
export async function deleteProduct(id) {
  await api.delete(`api/products/${id}`);
}
export async function tryGetCategories() {
  try {
    const res = await api.get("api/categories");
    return Array.isArray(res.data) ? res.data : [];
  } catch { return []; }
}