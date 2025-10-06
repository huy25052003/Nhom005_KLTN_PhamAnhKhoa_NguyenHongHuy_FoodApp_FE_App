import { api } from "./axios";

export async function getCart() {
  try {
    const res = await api.get("/api/cart");
    console.log("Get cart response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Error fetching cart:", error.response?.data || error.message);
    throw error;
  }
}

export const getMyCart = getCart;

export async function addToCart(productId, quantity = 1) {
  try {
    const res = await api.post("/api/cart/items", null, {
      params: { productId, quantity },
    });
    console.log("Add to cart response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Error adding to cart:", error.response?.data || error.message);
    throw error;
  }
}

export async function updateCartItem(itemId, quantity) {
  try {
    const res = await api.put(`/api/cart/items/${itemId}`, null, {
      params: { quantity },
    });
    console.log("Update cart item response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Error updating cart item:", error.response?.data || error.message);
    throw error;
  }
}

export async function removeCartItem(itemId) {
  try {
    await api.delete(`/api/cart/items/${itemId}`);
    console.log("Removed cart item:", itemId);
  } catch (error) {
    console.error("Error removing cart item:", error.response?.data || error.message);
    throw error;
  }
}

export async function clearCart() {
  try {
    await api.delete("/api/cart");
    console.log("Cleared cart");
  } catch (error) {
    console.error("Error clearing cart:", error.response?.data || error.message);
    throw error;
  }
}

export async function checkout() {
  try {
    const res = await api.post("/api/checkout");
    console.log("Checkout response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Error during checkout:", error.response?.data || error.message);
    throw error;
  }
}