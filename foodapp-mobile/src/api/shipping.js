import { api } from "./axios";

export async function getMyShipping() {
  try {
    const res = await api.get("api/shipping/me");
    console.log("Get shipping response:", res.data);
    return res.data;
  } catch (error) {
    // Return null instead of throwing for 403/404 errors
    if (error.response?.status === 403 || error.response?.status === 404) {
      console.log("No shipping data available (403/404), returning null");
      return null;
    }
    console.error("Error fetching shipping:", error.response?.data || error.message);
    throw error;
  }
}

export async function upsertMyShipping(payload) {
  try {
    const res = await api.put("api/shipping/me", payload, {
      headers: { "Content-Type": "application/json" },
    });
    console.log("Upsert shipping response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Error upserting shipping:", error.response?.data || error.message);
    throw error;
  }
}