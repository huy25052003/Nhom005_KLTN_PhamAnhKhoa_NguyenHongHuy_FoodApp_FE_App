import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "./axios";

export function useLogin() {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/api/auth/login", payload, {
        headers: { "Content-Type": "application/json" },
        validateStatus: s => s >= 200 && s < 400,
      });
      const { data, headers, status } = res;
      const token =
        data?.token ||
        data?.accessToken ||
        data?.jwt ||
        (typeof headers?.authorization === "string"
          ? headers.authorization.replace(/^Bearer\s+/i, "")
          : null);
      const user = data?.user || data?.data?.user || data?.profile || null;
      return { token, user, _raw: { status, data, headers } };
    },
  });
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get("/api/auth/me");
      return data;
    },
    retry: 0,
  });
}
