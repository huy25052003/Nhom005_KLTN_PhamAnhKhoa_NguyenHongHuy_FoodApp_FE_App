import { api } from "./axios";

function decodeFromToken() {
  try {
    const token = SecureStore.getItemAsync("access_token");
    if (!token) return null;
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return { username: json.sub || json.username || null };
  } catch {
    return null;
  }
}

export async function getMe() {
  try { return (await api.get("/api/users/me")).data; } catch {}
  try { return (await api.get("/api/auth/me")).data; } catch {}
  return decodeFromToken();
}

export async function getProfile() {
  const res = await api.get("/api/users/me/profile"); 
  return res.data;
}

export async function updateProfile(payload) {
  try {
    console.log("Calling PATCH /api/users/me/profile with payload:", payload);
    const res = await api.patch("/api/users/me/profile", payload);
    console.log("PATCH response:", res.data);
    return res.data;
  } catch (patchError) {
    console.log("PATCH failed, trying PUT instead:", patchError.response?.status);
    // Try PUT if PATCH fails
    try {
      const res = await api.put("/api/users/me/profile", payload);
      console.log("PUT response:", res.data);
      return res.data;
    } catch (putError) {
      console.error("Both PATCH and PUT failed:", {
        patch: patchError.response?.data,
        put: putError.response?.data
      });
      throw putError;
    }
  }
}