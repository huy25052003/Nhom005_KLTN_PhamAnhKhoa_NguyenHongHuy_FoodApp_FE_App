import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="home" options={{ title: "Trang chủ" }} />
        <Stack.Screen name="login" options={{ title: "Đăng nhập" }} />
        <Stack.Screen name="cart" options={{ title: "Giỏ hàng" }} />
        <Stack.Screen name="category" options={{ title: "Danh mục" }} />
        <Stack.Screen name="product" options={{ title: "Sản phẩm" }} />
        <Stack.Screen name="register" options={{ title: "Đăng ký" }} />
        {/* <Stack.Screen name="shippinginfo" options={{ title: "Thông tin giao hàng" }} /> */}
      </Stack>
    </QueryClientProvider>
  );
}