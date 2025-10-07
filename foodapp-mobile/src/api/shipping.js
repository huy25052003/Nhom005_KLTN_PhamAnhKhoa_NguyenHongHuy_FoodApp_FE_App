import { api } from "./axios";

export async function getMyShipping() {
  try {
    const res = await api.get("/shipping/me");
    console.log("Get shipping response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Error fetching shipping:", error.response?.data || error.message);
    throw error;
  }
}

export async function upsertMyShipping(payload) {
  try {
    const res = await api.put("/shipping/me", payload, {
      headers: { "Content-Type": "application/json" },
    });
    console.log("Upsert shipping response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Error upserting shipping:", error.response?.data || error.message);
    throw error;
  }
}