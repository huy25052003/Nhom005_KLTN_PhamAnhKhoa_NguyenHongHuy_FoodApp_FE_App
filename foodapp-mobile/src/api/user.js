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
  try { return (await api.get("users/me")).data; } catch {}
  try { return (await api.get("auth/me")).data; } catch {}
  return decodeFromToken();
}

export async function getProfile() {
  const res = await api.get("users/me/profile"); 
  return res.data;
}

export async function updateProfile(payload) {
  const res = await api.patch("users/me/profile", payload);
  return res.data;
}