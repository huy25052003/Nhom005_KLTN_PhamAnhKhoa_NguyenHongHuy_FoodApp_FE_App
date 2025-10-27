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
import { useQuery } from "@tanstack/react-query";
import { getCart, clearCart } from "../src/api/cart";
import { getMyShipping } from "../src/api/shipping";
import { placeOrder } from "../src/api/order";
import { createPaymentLink } from "../src/api/payment";
import { useAuth } from "../src/store/auth";
import { useCart } from "../src/store/cart";

const formatVND = (n) => (n ?? 0).toLocaleString("vi-VN") + " đ";

export default function Checkout() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { setCount } = useCart();
  
  const [method, setMethod] = useState("COD");
  const [placing, setPlacing] = useState(false);
  const [promoCode, setPromoCode] = useState("");

  // Lấy thông tin giỏ hàng
  const { data: cart, isLoading: cartLoading, error: cartError, refetch: refetchCart } = useQuery({
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

  // Kiểm tra method từ params
  useEffect(() => {
    const m = (params?.method || "").toUpperCase();
    if (m === "PAYOS") setMethod("PAYOS");
    if (m === "COD") setMethod("COD");
  }, [params]);

  const items = cart?.items || cart?.cartItems || [];
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * (item.quantity ?? 0),
    0
  );

  const isShippingValid = shipping && shipping.phone && shipping.addressLine;

  // Hàm đặt hàng
  const handlePlaceOrder = async () => {
    if (!items.length) {
      Alert.alert("Lỗi", "Giỏ hàng trống.");
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
      // Tạo payload giống như web
      const orderItemsPayload = items.map(it => ({
        product: { id: it.product?.id },
        quantity: it.quantity,
      }));

      const shippingInfoPayload = {
        phone: shipping.phone,
        addressLine: shipping.addressLine,
        city: shipping.city || "",
        note: shipping.note || ""
      };

      const requestPayload = {
        items: orderItemsPayload,
        shippingInfo: shippingInfoPayload,
        paymentMethod: method,
        promoCode: promoCode.trim() || null
      };

      console.log("Đang tạo đơn hàng với payload:", requestPayload);
      const order = await placeOrder(requestPayload);
      console.log("Đơn hàng đã tạo:", order);

      if (!order?.id) {
        throw new Error("Không tạo được đơn hàng.");
      }

      // Kiểm tra paymentMethod (so sánh không phân biệt hoa thường)
      const orderPaymentMethod = (order.paymentMethod || "").toUpperCase();
      const selectedMethod = method.toUpperCase();

      if (selectedMethod === "COD" || orderPaymentMethod === "COD") {
        Alert.alert(
          "Thành công",
          `Đặt hàng thành công! Mã đơn: ${order.id}\nBạn sẽ thanh toán khi nhận hàng.`,
          [
            {
              text: "OK",
              onPress: async () => {
                try {
                  await clearCart();
                  setCount(0);
                } catch (e) {
                  console.warn("Không thể clear cart:", e);
                }
                router.replace("/home");
              },
            },
          ]
        );
        return;
      }

      // PayOS
      if (selectedMethod === "PAYOS" || orderPaymentMethod === "PAYOS") {
        console.log("Đang tạo payment link cho đơn:", order.id);
        const paymentUrl = await createPaymentLink(order.id);
        console.log("Payment URL nhận được:", paymentUrl);

        if (!paymentUrl) {
          throw new Error("Không nhận được payment URL từ PayOS.");
        }

        // Chuyển đến trang thanh toán với orderId và paymentUrl
        router.replace({
          pathname: "/paymentresult",
          params: {
            orderId: String(order.id),
            paymentUrl: paymentUrl,
          },
        });
        return;
      }

      // Trường hợp không xác định được phương thức
      throw new Error("Phương thức thanh toán không hợp lệ.");

    } catch (error) {
      console.error("Lỗi đặt hàng:", error);
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
          <Text style={styles.backButtonText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Đơn hàng */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Giỏ hàng của bạn</Text>
        {cartLoading && <Text style={styles.mutedText}>Đang cập nhật giỏ hàng...</Text>}
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
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalPrice}>{formatVND(totalPrice)}</Text>
        </View>
      </View>

      {/* Thông tin giao hàng */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
        {shippingLoading && !shipping && <Text style={styles.mutedText}>Đang tải thông tin...</Text>}
        {!isShippingValid && !shippingLoading ? (
          <View>
            <Text style={styles.mutedText}>Chưa có thông tin giao hàng.</Text>
            <TouchableOpacity
              style={styles.shippingButton}
              onPress={() => router.push("/shippinginfo?redirect=checkout")}
            >
              <Text style={styles.shippingButtonText}>Nhập thông tin giao hàng</Text>
            </TouchableOpacity>
          </View>
        ) : isShippingValid ? (
          <View>
            <Text style={styles.shippingInfo}>
              <Text style={styles.label}>Điện thoại: </Text>
              {shipping.phone}
            </Text>
            <Text style={styles.shippingInfo}>
              <Text style={styles.label}>Địa chỉ: </Text>
              {shipping.addressLine}
            </Text>
            {shipping.city ? (
              <Text style={styles.shippingInfo}>
                <Text style={styles.label}>Tỉnh/Thành: </Text>
                {shipping.city}
              </Text>
            ) : null}
            {shipping.note ? (
              <Text style={styles.shippingInfo}>
                <Text style={styles.label}>Ghi chú: </Text>
                {shipping.note}
              </Text>
            ) : null}
            <TouchableOpacity
              style={styles.editShippingButton}
              onPress={() => router.push("/shippinginfo?redirect=checkout")}
            >
              <Text style={styles.editShippingButtonText}>Sửa thông tin giao hàng</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* Phương thức thanh toán */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
        
        <TouchableOpacity
          style={styles.paymentOption}
          onPress={() => setMethod("COD")}
        >
          <View style={styles.radioButton}>
            {method === "COD" && <View style={styles.radioSelected} />}
          </View>
          <Text style={styles.paymentText}>COD (Thanh toán khi nhận hàng)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.paymentOption}
          onPress={() => setMethod("PAYOS")}
        >
          <View style={styles.radioButton}>
            {method === "PAYOS" && <View style={styles.radioSelected} />}
          </View>
          <Text style={styles.paymentText}>PayOS (Thanh toán online)</Text>
        </TouchableOpacity>
      </View>

      {/* Nút đặt hàng */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            (!items.length || placing || !isShippingValid || cartLoading || shippingLoading) && styles.disabledButton,
          ]}
          onPress={handlePlaceOrder}
          disabled={!items.length || placing || !isShippingValid || cartLoading || shippingLoading}
        >
          <Text style={styles.placeOrderButtonText}>
            {placing
              ? "Đang xử lý..."
              : method === "COD"
              ? "Đặt hàng (COD)"
              : "Tiếp tục với PayOS"}
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 8,
    marginHorizontal: 8,
    padding: 16,
    borderRadius: 8,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemName: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    lineHeight: 22,
  },
  itemPrice: {
    fontSize: 16,
    color: "#007bff",
    fontWeight: "600",
    marginLeft: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    marginTop: 12,
    borderTopWidth: 2,
    borderTopColor: "#007bff",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: "#007bff",
  },
  shippingInfo: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
    lineHeight: 24,
  },
  label: {
    fontWeight: "600",
    color: "#555",
  },
  shippingButton: {
    backgroundColor: "#007bff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#007bff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  shippingButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  editShippingButton: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
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
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#007bff",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#007bff",
  },
  paymentText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  placeOrderButton: {
    backgroundColor: "#28a745",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#28a745",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  placeOrderButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  disabledButton: {
    backgroundColor: "#6c757d",
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#007bff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  mutedText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 22,
  },
});