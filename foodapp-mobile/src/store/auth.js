import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export const useAuth = create((set) => ({
  user: null,
  token: null,
  setAuth: async (user, token) => {
    await SecureStore.setItemAsync("access_token", token);
    set({ user, token });
  },
  clear: async () => {
    await SecureStore.deleteItemAsync("access_token");
    set({ user: null, token: null });
  },
  hydrate: async () => {
    const t = await SecureStore.getItemAsync("access_token");
    set({ token: t ?? null });
  },
}));
