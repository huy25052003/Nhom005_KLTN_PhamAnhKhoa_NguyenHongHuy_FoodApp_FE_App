import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getCart, clearCart } from "../src/api/cart";
import { getMyShipping } from "../src/api/shipping";
import { placeOrder } from "../src/api/order";
import { createPaymentLink } from "../src/api/payment";
import { useAuth } from "../src/store/auth";
import { useCart } from "../src/store/cart";
import { LinearGradient } from 'expo-linear-gradient';

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
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#ff9800" />
        <LinearGradient
          colors={['#ff9800', '#f57c00']}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thanh toán</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔒</Text>
          <Text style={styles.emptyTitle}>Vui lòng đăng nhập</Text>
          <Text style={styles.mutedText}>Đăng nhập để thanh toán đơn hàng</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/login?redirect=checkout")}
          >
            <Text style={styles.loginButtonText}>🔑 Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (cartLoading || shippingLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#ff9800" />
        <LinearGradient
          colors={['#ff9800', '#f57c00']}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thanh toán</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff9800" />
          <Text style={styles.mutedText}>Đang tải thông tin...</Text>
        </View>
      </View>
    );
  }

  if (cartError || !items.length) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#ff9800" />
        <LinearGradient
          colors={['#ff9800', '#f57c00']}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thanh toán</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
          <Text style={styles.mutedText}>Vui lòng thêm sản phẩm vào giỏ hàng</Text>
          <TouchableOpacity
            style={styles.backToCartButton}
            onPress={() => router.push("/cart")}
          >
            <Text style={styles.backToCartButtonText}>🛍️ Quay lại giỏ hàng</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ff9800" />
      <LinearGradient
        colors={['#ff9800', '#f57c00']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Xác nhận thanh toán</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Đơn hàng */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🛍️ Giỏ hàng của bạn</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{items.length}</Text>
            </View>
          </View>
          {cartLoading && <Text style={styles.mutedText}>Đang cập nhật...</Text>}
          {items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.product?.name || "Sản phẩm"}
                </Text>
                <Text style={styles.itemQty}>x{item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>
                {formatVND((item.product?.price || 0) * (item.quantity || 0))}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalPrice}>{formatVND(totalPrice)}</Text>
          </View>
        </View>

        {/* Thông tin giao hàng */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Thông tin giao hàng</Text>
          {shippingLoading && !shipping && <Text style={styles.mutedText}>Đang tải...</Text>}
          {!isShippingValid && !shippingLoading ? (
            <View style={styles.shippingEmptyState}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>Chưa có thông tin giao hàng</Text>
              <TouchableOpacity
                style={styles.shippingButton}
                onPress={() => router.push("/shippinginfo?redirect=checkout")}
              >
                <Text style={styles.shippingButtonText}>📝 Nhập thông tin giao hàng</Text>
              </TouchableOpacity>
            </View>
          ) : isShippingValid ? (
            <View style={styles.shippingCard}>
              <View style={styles.shippingRow}>
                <Text style={styles.shippingLabel}>📞 Điện thoại:</Text>
                <Text style={styles.shippingValue}>{shipping.phone}</Text>
              </View>
              <View style={styles.shippingRow}>
                <Text style={styles.shippingLabel}>🏠 Địa chỉ:</Text>
                <Text style={styles.shippingValue}>{shipping.addressLine}</Text>
              </View>
              {shipping.city ? (
                <View style={styles.shippingRow}>
                  <Text style={styles.shippingLabel}>🌆 Tỉnh/Thành:</Text>
                  <Text style={styles.shippingValue}>{shipping.city}</Text>
                </View>
              ) : null}
              {shipping.note ? (
                <View style={styles.shippingRow}>
                  <Text style={styles.shippingLabel}>📝 Ghi chú:</Text>
                  <Text style={styles.shippingValue}>{shipping.note}</Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={styles.editShippingButton}
                onPress={() => router.push("/shippinginfo?redirect=checkout")}
              >
                <Text style={styles.editShippingButtonText}>✏️ Sửa thông tin</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Phương thức thanh toán */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Phương thức thanh toán</Text>
          
          <TouchableOpacity
            style={[styles.paymentOption, method === "COD" && styles.paymentOptionSelected]}
            onPress={() => setMethod("COD")}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.radioButton}>
                {method === "COD" && <View style={styles.radioSelected} />}
              </View>
              <View>
                <Text style={styles.paymentTitle}>💵 COD</Text>
                <Text style={styles.paymentSubtitle}>Thanh toán khi nhận hàng</Text>
              </View>
            </View>
            {method === "COD" && <Text style={styles.checkIcon}>✓</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, method === "PAYOS" && styles.paymentOptionSelected]}
            onPress={() => setMethod("PAYOS")}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.radioButton}>
                {method === "PAYOS" && <View style={styles.radioSelected} />}
              </View>
              <View>
                <Text style={styles.paymentTitle}>💳 PayOS</Text>
                <Text style={styles.paymentSubtitle}>Thanh toán online ngay</Text>
              </View>
            </View>
            {method === "PAYOS" && <Text style={styles.checkIcon}>✓</Text>}
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
                ? "⏳ Đang xử lý..."
                : method === "COD"
                ? "✅ Đặt hàng (COD)"
                : "💳 Tiếp tục với PayOS"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.footerNote}>
            Bằng việc đặt hàng, bạn đồng ý với điều khoản sử dụng
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#333",
    marginBottom: 12,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  badge: {
    backgroundColor: "#ff9800",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  orderItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  itemName: {
    fontSize: 15,
    color: "#333",
    flex: 1,
    fontWeight: "600",
    lineHeight: 22,
  },
  itemQty: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
    marginLeft: 8,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemPrice: {
    fontSize: 16,
    color: "#ff9800",
    fontWeight: "700",
  },
  divider: {
    height: 2,
    backgroundColor: "#e9ecef",
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ff9800",
  },
  shippingEmptyState: {
    alignItems: "center",
    paddingVertical: 20,
  },
  warningIcon: {
    fontSize: 50,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 15,
    color: "#666",
    marginBottom: 16,
    fontWeight: "600",
  },
  shippingCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  shippingRow: {
    marginBottom: 12,
  },
  shippingLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
    marginBottom: 4,
  },
  shippingValue: {
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "500",
    lineHeight: 22,
  },
  shippingButton: {
    backgroundColor: "#ff9800",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#ff9800",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shippingButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  editShippingButton: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: "#ff9800",
  },
  editShippingButtonText: {
    color: "#ff9800",
    fontWeight: "700",
    fontSize: 14,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  paymentOptionSelected: {
    backgroundColor: "#fff5e6",
    borderColor: "#ff9800",
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ff9800",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ff9800",
  },
  paymentTitle: {
    fontSize: 16,
    color: "#1a1a1a",
    fontWeight: "700",
    marginBottom: 2,
  },
  paymentSubtitle: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  checkIcon: {
    fontSize: 24,
    color: "#ff9800",
    fontWeight: "700",
  },
  placeOrderButton: {
    backgroundColor: "#ff9800",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#ff9800",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  placeOrderButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
  },
  disabledButton: {
    backgroundColor: "#9e9e9e",
    shadowOpacity: 0,
    elevation: 0,
  },
  footerNote: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 18,
  },
  loginButton: {
    backgroundColor: "#ff9800",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#ff9800",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  backToCartButton: {
    backgroundColor: "#ff9800",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#ff9800",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  backToCartButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  mutedText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginVertical: 8,
    lineHeight: 22,
  },
});