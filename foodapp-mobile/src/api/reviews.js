import { api } from "./axios";

export async function listReviews(productId) {
  const res = await api.get(`api/products/${productId}/reviews`);
  return res.data;
}

export async function createReview(productId, { rating, comment }) {
  const res = await api.post(`api/products/${productId}/reviews`, { rating, comment });
  return res.data; 
}

export async function deleteReview(productId, reviewId) {
  const res = await api.delete(`/products/${productId}/reviews/${reviewId}`);
  return res.data;
}

export async function getAvgRating(productId) {
  const res = await api.get(`api/products/${productId}/reviews/avg`);
  return res.data?.avgRating ?? 0;
}