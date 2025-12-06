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
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="home" options={{ headerShown: false }} />
          <Stack.Screen 
            name="cart" 
            options={{ 
              title: "Giỏ hàng",
              headerStyle: { backgroundColor: "#4caf50" },
              headerTintColor: "#fff",
              headerTitleStyle: { fontWeight: "700", fontSize: 18 }
            }} 
          />
          <Stack.Screen 
            name="category" 
            options={{ 
              title: "Danh mục",
              headerStyle: { backgroundColor: "#4caf50" },
              headerTintColor: "#fff",
              headerTitleStyle: { fontWeight: "700", fontSize: 18 }
            }} 
          />
          <Stack.Screen 
            name="product" 
            options={{ 
              title: "Sản phẩm",
              headerStyle: { backgroundColor: "#4caf50" },
              headerTintColor: "#fff",
              headerTitleStyle: { fontWeight: "700", fontSize: 18 }
            }} 
          />
          <Stack.Screen 
            name="register" 
            options={{ 
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="forgotpassword" 
            options={{ 
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="loginsms" 
            options={{ 
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="changepassword" 
            options={{ 
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="shippinginfo" 
            options={{ 
              title: "Thông tin giao hàng",
              headerStyle: { backgroundColor: "#4caf50" },
              headerTintColor: "#fff",
              headerTitleStyle: { fontWeight: "700", fontSize: 18 }
            }} 
          />
          <Stack.Screen 
            name="checkout" 
            options={{ 
              title: "Thanh toán",
              headerStyle: { backgroundColor: "#4caf50" },
              headerTintColor: "#fff",
              headerTitleStyle: { fontWeight: "700", fontSize: 18 }
            }} 
          />
          <Stack.Screen 
            name="order" 
            options={{ 
              title: "Đơn hàng",
              headerStyle: { backgroundColor: "#4caf50" },
              headerTintColor: "#fff",
              headerTitleStyle: { fontWeight: "700", fontSize: 18 }
            }} 
          />
          <Stack.Screen 
            name="paymentresult" 
            options={{ 
              title: "Kết quả thanh toán",
              headerStyle: { backgroundColor: "#4caf50" },
              headerTintColor: "#fff",
              headerTitleStyle: { fontWeight: "700", fontSize: 18 }
            }} 
          />
          <Stack.Screen 
            name="favorites" 
            options={{ 
              headerShown: false
            }} 
          />
        </Stack>
        <ChatbotWidget />
      </View>
    </QueryClientProvider>
  );
}