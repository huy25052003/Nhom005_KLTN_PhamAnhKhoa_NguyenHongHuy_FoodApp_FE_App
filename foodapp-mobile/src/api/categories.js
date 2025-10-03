import { api } from "./axios";

export async function getCategories() {
  const res = await api.get("/categories");
  return res.data;
}
export async function getCategory(id) {
  const res = await api.get(`/categories/${id}`);
  return res.data;
}
export async function createCategory(payload) {
  const res = await api.post("/categories", payload);
  return res.data;
}
export async function updateCategory(id, payload) {
  const res = await api.put(`/categories/${id}`, payload);
  return res.data;
}
export async function deleteCategory(id) {
  await api.delete(`/categories/${id}`);
}