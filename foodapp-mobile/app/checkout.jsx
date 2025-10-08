import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCart } from "../src/api/cart";
import { getMyShipping } from "../src/api/shipping";
import { createOrder, placeOrderFromCart } from "../src/api/order";
import { createPaymentLink } from "../src/api/payment";
import { useAuth } from "../src/store/auth";
import { useCart } from "../src/store/cart";

const formatVND = (n) => (n ?? 0).toLocaleString("vi-VN") + " đ";

export default function Checkout() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { setCount } = useCart();
  
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [placing, setPlacing] = useState(false);

  // Lấy thông tin giỏ hàng
  const { data: cart, isLoading: cartLoading, error: cartError } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: !!user,
  });

  // Lấy thông tin shipping
  const { data: shipping, isLoading: shippingLoading } = useQuery({
    queryKey: ["shipping"],
    queryFn: getMyShipping,
    enabled: !!user,
  });

  const items = cart?.items || cart?.cartItems || [];
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * (item.quantity ?? 0),
    0
  );

  const isShippingValid = shipping && shipping.phone && shipping.addressLine;

  // Hàm đặt hàng
  const placeOrder = async () => {
    if (!items.length) {
      Alert.alert("Lỗi", "Giỏ hàng trống");
      return;
    }

    if (!isShippingValid) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập thông tin giao hàng trước khi đặt.",
        [
          {
            text: "Nhập thông tin",
            onPress: () => router.push("/shippinginfo?redirect=checkout"),
          },
          { text: "Hủy", style: "cancel" },
        ]
      );
      return;
    }

    setPlacing(true);
    try {
      // Tạo đơn hàng từ cart (giống như BE mong đợi)
      const order = await placeOrderFromCart(cart);
      
      if (!order?.id) {
        throw new Error("Không tạo được đơn hàng");
      }

      if (paymentMethod === "COD") {
        Alert.alert(
          "Thành công",
          "Đặt hàng thành công! Bạn sẽ thanh toán khi nhận hàng.",
          [
            {
              text: "OK",
              onPress: () => {
                setCount(0);
                router.push("/home");
              },
            },
          ]
        );
        return;
      }

      // PayOS
      if (paymentMethod === "PAYOS") {
        const paymentUrl = await createPaymentLink(order.id);
        if (!paymentUrl) {
          throw new Error("Không nhận được payment URL từ PayOS");
        }

        // Chuyển đến trang thanh toán với orderId
        router.push({
          pathname: "/paymentresult",
          params: {
            orderId: order.id,
            paymentUrl: paymentUrl,
          },
        });
      }
    } catch (error) {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || error?.message || "Đặt hàng thất bại"
      );
    } finally {
      setPlacing(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.mutedText}>Vui lòng đăng nhập để thanh toán.</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/login?redirect=checkout")}
        >
          <Text style={styles.loginButtonText}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cartLoading || shippingLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.mutedText}>Đang tải...</Text>
      </View>
    );
  }

  if (cartError || !items.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.mutedText}>Giỏ hàng trống</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/cart")}
        >
          <Text style={styles.backButtonText}>Quay lại giỏ hàng</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Đơn hàng */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Đơn hàng</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.orderItem}>
            <Text style={styles.itemName}>
              {item.product?.name || "Sản phẩm"} × {item.quantity}
            </Text>
            <Text style={styles.itemPrice}>
              {formatVND((item.product?.price || 0) * (item.quantity || 0))}
            </Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalPrice}>{formatVND(totalPrice)}</Text>
        </View>
      </View>

      {/* Thông tin giao hàng */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
        {!isShippingValid ? (
          <View>
            <Text style={styles.mutedText}>Chưa có thông tin giao hàng.</Text>
            <TouchableOpacity
              style={styles.shippingButton}
              onPress={() => router.push("/shippinginfo?redirect=checkout")}
            >
              <Text style={styles.shippingButtonText}>Nhập thông tin giao hàng</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.shippingInfo}>
              <Text style={styles.label}>Điện thoại: </Text>
              {shipping.phone}
            </Text>
            <Text style={styles.shippingInfo}>
              <Text style={styles.label}>Địa chỉ: </Text>
              {shipping.addressLine}
            </Text>
            {shipping.city && (
              <Text style={styles.shippingInfo}>
                <Text style={styles.label}>Tỉnh/Thành: </Text>
                {shipping.city}
              </Text>
            )}
            <TouchableOpacity
              style={styles.editShippingButton}
              onPress={() => navigation.navigate("shippinginfo", { redirect: "checkout" })}
            >
              <Text style={styles.editShippingButtonText}>Sửa thông tin giao hàng</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Phương thức thanh toán */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
        
        <TouchableOpacity
          style={styles.paymentOption}
          onPress={() => setPaymentMethod("COD")}
        >
          <View style={styles.radioButton}>
            {paymentMethod === "COD" && <View style={styles.radioSelected} />}
          </View>
          <Text style={styles.paymentText}>COD (Thanh toán khi nhận hàng)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.paymentOption}
          onPress={() => setPaymentMethod("PAYOS")}
        >
          <View style={styles.radioButton}>
            {paymentMethod === "PAYOS" && <View style={styles.radioSelected} />}
          </View>
          <Text style={styles.paymentText}>PayOS (Thanh toán online)</Text>
        </TouchableOpacity>
      </View>

      {/* Nút đặt hàng */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            (!items.length || placing || !isShippingValid) && styles.disabledButton,
          ]}
          onPress={placeOrder}
          disabled={!items.length || placing || !isShippingValid}
        >
          <Text style={styles.placeOrderButtonText}>
            {placing
              ? "Đang xử lý..."
              : paymentMethod === "COD"
              ? "Đặt hàng (COD)"
              : "Thanh toán PayOS"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007bff",
  },
  section: {
    backgroundColor: "#fff",
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemName: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  itemPrice: {
    fontSize: 16,
    color: "#007bff",
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#007bff",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#007bff",
  },
  shippingInfo: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
    lineHeight: 24,
  },
  label: {
    fontWeight: "600",
  },
  shippingButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  shippingButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  editShippingButton: {
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  editShippingButtonText: {
    color: "#6c757d",
    fontWeight: "600",
    fontSize: 14,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#007bff",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007bff",
  },
  paymentText: {
    fontSize: 16,
    color: "#333",
  },
  placeOrderButton: {
    backgroundColor: "#28a745",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  placeOrderButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  disabledButton: {
    backgroundColor: "#6c757d",
  },
  loginButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  mutedText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
  },
});