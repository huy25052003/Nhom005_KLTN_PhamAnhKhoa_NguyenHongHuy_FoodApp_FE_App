import { api } from "./axios";

export async function getRecommendations() {
  const res = await api.get("api/recommendations");
  return res.data;
}
