import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { View } from "react-native";
import ChatbotWidget from "../src/components/ChatbotWidget";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1 }}>
        <Stack initialRouteName="index">
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: "Đăng nhập", headerShown: false }} />
          <Stack.Screen name="home" options={{ headerShown: false }} />
          <Stack.Screen name="cart" options={{ title: "Giỏ hàng" }} />
          <Stack.Screen name="category" options={{ title: "Danh mục" }} />
          <Stack.Screen name="product" options={{ title: "Sản phẩm" }} />
          <Stack.Screen name="register" options={{ title: "Đăng ký" }} />
          <Stack.Screen name="shippinginfo" options={{ title: "Thông tin giao hàng" }} />
          <Stack.Screen name="checkout" options={{ title: "Thanh toán" }} />
          <Stack.Screen name="order" options={{ title: "Đơn hàng" }} />
          <Stack.Screen name="paymentresult" options={{ title: "Kết quả thanh toán" }} />
          <Stack.Screen name="favorites" options={{ title: "Yêu thích"}} />
        </Stack>
        <ChatbotWidget />
      </View>
    </QueryClientProvider>
  );
}