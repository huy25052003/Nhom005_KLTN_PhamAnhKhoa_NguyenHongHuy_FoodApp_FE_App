import React from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const client = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={client}>
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Đăng nhập" }} />
        <Stack.Screen name="home"  options={{ title: "Trang chính" }} />
        <Stack.Screen name="category" options={{ title: "Danh mục" }} />
        <Stack.Screen name="product" options={{ title: "Chi tiết sản phẩm" }} />
        <Stack.Screen name="cart" options={{ title: "Giỏ hàng" }} />
      </Stack>
    </QueryClientProvider>
  );
}
