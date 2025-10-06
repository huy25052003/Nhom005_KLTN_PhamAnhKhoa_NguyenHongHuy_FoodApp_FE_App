import { api } from "./axios";

export async function listReviews(productId) {
  const { data } = await api.get(`/api/products/${productId}/reviews`);
  return data;
}

export async function createReview(productId, { rating, comment }) {
  try {
    const { data } = await api.post(
      `/api/products/${productId}/reviews`,
      { rating, comment },
      { headers: { "Content-Type": "application/json", "Accept": "application/json" } }
    );
    console.log("Create review response:", data);
    return data;
  } catch (error) {
    console.error("Error creating review:", error.response?.data || error.message);
    throw error;
  }
}

export async function deleteReview(productId, reviewId) {
  try {
    await api.delete(`/api/products/${productId}/reviews/${reviewId}`);
    console.log("Deleted review:", reviewId);
  } catch (error) {
    console.error("Error deleting review:", error.response?.data || error.message);
    throw error;
  }
}

export async function getAvgRating(productId) {
  const { data } = await api.get(`/api/products/${productId}/reviews/avg`);
  return data.avgRating || 0;
}