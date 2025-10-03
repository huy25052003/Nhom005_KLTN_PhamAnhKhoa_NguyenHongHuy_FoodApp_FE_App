import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const baseURL = Constants.expoConfig?.extra?.apiBaseUrl;
console.log("API baseURL =", baseURL);

export const api = axios.create({ baseURL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
