import { api } from './axios';

// Toggle favorite (add/remove)
export async function toggleFavorite(productId) {
  console.log('Calling toggleFavorite with productId:', productId);
  console.log('Request URL:', `/api/favorites/${productId}/toggle`);
  const res = await api.post(`/api/favorites/${productId}/toggle`);
  console.log('toggleFavorite response:', res.data);
  return res.data;
}

// Get favorite status for a product
export async function getFavoriteStat(productId) {
  const res = await api.get(`/api/favorites/${productId}`);
  return res.data;
}

// Get all user's favorites
export async function getFavorites(page = 0, size = 100) {
  console.log('Calling getFavorites with page:', page, 'size:', size);
  const res = await api.get(`/api/favorites/my`, { params: { page, size } });
  console.log('getFavorites response:', res.data);
  return res.data?.content || res.data || [];
}

// Alias for backwards compatibility
export const getMyFavorites = getFavorites;
