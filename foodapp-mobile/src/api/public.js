import { api } from "./axios";

export async function getFeaturedProducts(limit = 8) {
  const res = await api.get("/api/products");
  const list = Array.isArray(res.data) ? res.data : [];
  return list.slice(0, limit);
}

export async function getCategoriesPublic(limit = 6) {
  const res = await api.get("/api/categories");
  const list = Array.isArray(res.data) ? res.data : [];
  return list.slice(0, limit);
}

export async function getProductsPublic(params = {}) {
  const res = await api.get("/api/products/search", { params });
  return res.data?.items ?? res.data ?? [];
}

export async function getCategoryProducts(categoryId, limit = 40) {
  return getProductsPublic({ categoryId, limit });
}