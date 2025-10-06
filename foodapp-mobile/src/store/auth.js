import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { getMe } from "../api/usres";

export const useAuth = create((set) => ({
  user: null,
  token: null,
  setAuth: async (user, token) => {
    if (token && !user) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        user = { username: payload.sub || payload.username || null };
      } catch (e) {
        console.error("Error decoding user from token:", e);
        const meData = await getMe();
        user = meData?.username ? { username: meData.username } : null;
      }
    }
    try {
      if (token) {
        await SecureStore.setItemAsync("access_token", token);
        await SecureStore.setItemAsync("user", JSON.stringify(user || null));
      } else {
        await SecureStore.deleteItemAsync("access_token");
        await SecureStore.deleteItemAsync("user");
      }
      set({ user, token });
      console.log("Set auth state:", { user, token });
    } catch (e) {
      console.error("Error saving to SecureStore:", e);
    }
  },
  clear: async () => {
    try {
      await SecureStore.deleteItemAsync("access_token");
      await SecureStore.deleteItemAsync("user");
      set({ user: null, token: null });
      console.log("Cleared auth state");
    } catch (e) {
      console.error("Error during clear:", e);
    }
  },
  hydrate: async () => {
    try {
      const t = await SecureStore.getItemAsync("access_token");
      const u = await SecureStore.getItemAsync("user");
      const user = u ? JSON.parse(u) : null;
      if (t && !user) {
        const meData = await getMe();
        user = meData?.username ? { username: meData.username } : null;
      }
      set({ user, token: t ?? null });
      console.log("Hydrated auth state:", { user, token: t ?? null });
    } catch (e) {
      console.error("Error hydrating auth:", e);
    }
  },
}));