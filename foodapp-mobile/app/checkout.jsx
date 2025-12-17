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
  Linking,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getCart, clearCart } from "../src/api/cart";
import { getMyShipping } from "../src/api/shipping";
import { getProfile } from "../src/api/user";
import { placeOrder } from "../src/api/order";
import { createPaymentLink } from "../src/api/payment";
import { useAuth } from "../src/store/auth";
import { useCart } from "../src/store/cart";
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ShoppingCart, 
  MapPin, 
  Wallet, 
  Lock, 
  AlertCircle,
  Edit,
  Phone,
  Home,
  MapPinned,
  FileText,
  ChevronLeft,
  Check,
  Loader,
  CreditCard
} from 'lucide-react-native';

const formatVND = (n) => (n ?? 0).toLocaleString("vi-VN") + " đ";

export default function Checkout() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { setCount } = useCart();
  
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");

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

  // Lấy thông tin profile để tính ưu đãi thành viên
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !!user,
  });

  const items = cart?.items || cart?.cartItems || [];
  
  const subtotal = items.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * (item.quantity ?? 0),
    0
  );
  
  // Ưu đãi thành viên
  const memberRank = profile?.memberRank || "ĐỒNG";
  const loyaltyDiscountPercent = memberRank === "ĐỒNG" ? 1 : memberRank === "BẠC" ? 3 : memberRank === "VÀNG" ? 5 : memberRank === "KIM CƯƠNG" ? 10 : 0;
  const loyaltyDiscount = Math.round(subtotal * loyaltyDiscountPercent / 100);
  
  const totalPrice = subtotal - loyaltyDiscount;

  const isShippingValid = shipping && shipping.phone && shipping.addressLine;

  // Hàm đặt hàng - Bước 1: Hiển thị xác nhận
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
            onPress: () => router.push("/editprofile"),
          },
          { text: "Hủy", style: "cancel" },
        ]
      );
      return;
    }

    // Hiển thị xác nhận thanh toán
    const paymentMethodText = paymentMethod === "COD" ? "COD (Thanh toán khi nhận hàng)" : "PayOS (Thanh toán online)";
    Alert.alert(
      "Xác nhận đặt hàng",
      `Phương thức: ${paymentMethodText}\nTổng tiền: ${formatVND(totalPrice)}\n\nBạn có chắc muốn đặt hàng?`,
      [
        {
          text: "Hủy",
          style: "cancel",
          onPress: () => {
            // Quay về giỏ hàng
            router.push("/cart");
          }
        },
        {
          text: "Thanh toán",
          onPress: () => handleConfirmOrder(),
        },
      ]
    );
  };

  // Hàm đặt hàng - Bước 2: Xử lý sau khi xác nhận
  const handleConfirmOrder = async () => {
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
        paymentMethod: paymentMethod
      };

      console.log("Đang tạo đơn hàng với payload:", requestPayload);
      const order = await placeOrder(requestPayload);
      console.log("Đơn hàng đã tạo:", order);

      if (!order?.id) {
        throw new Error("Không tạo được đơn hàng.");
      }

      if (paymentMethod === "COD") {
        // Đặt hàng thành công với COD - Về home ngay
        try {
          await clearCart();
          setCount(0);
        } catch (e) {
          console.warn("Không thể clear cart:", e);
        }
        
        Alert.alert(
          "Thành công",
          `Đặt hàng thành công! Mã đơn: ${order.id}\nBạn sẽ thanh toán khi nhận hàng.`,
          [
            {
              text: "OK",
              onPress: () => router.replace("/home"),
            },
          ]
        );
      } else if (paymentMethod === "PAYOS") {
        // Thanh toán online với PayOS - Mở trong WebView trong app
        try {
          const payUrl = await createPaymentLink(order.id);
          if (!payUrl) throw new Error("Lỗi cổng thanh toán");
          
          // Chuyển đến màn hình PayOS WebView trong app
          router.replace(`/payoswebview?orderId=${order.id}&paymentUrl=${encodeURIComponent(payUrl)}`);
        } catch (paymentError) {
          Alert.alert(
            "Lỗi thanh toán",
            paymentError?.message || "Không thể tạo link thanh toán"
          );
        }
      }

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
        <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
        <LinearGradient
          colors={['#4caf50', '#388e3c']}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft color="#fff" size={28} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thanh toán</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <Lock color="#999" size={64} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Vui lòng đăng nhập</Text>
          <Text style={styles.mutedText}>Đăng nhập để thanh toán đơn hàng</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/login?redirect=checkout")}
          >
            <Lock color="#fff" size={18} strokeWidth={2} />
            <Text style={styles.loginButtonText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (cartLoading || shippingLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
        <LinearGradient
          colors={['#4caf50', '#388e3c']}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft color="#fff" size={28} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thanh toán</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4caf50" />
          <Text style={styles.mutedText}>Đang tải thông tin...</Text>
        </View>
      </View>
    );
  }

  if (cartError || !items.length) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
        <LinearGradient
          colors={['#4caf50', '#388e3c']}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft color="#fff" size={28} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thanh toán</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <ShoppingCart color="#999" size={64} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
          <Text style={styles.mutedText}>Vui lòng thêm sản phẩm vào giỏ hàng</Text>
          <TouchableOpacity
            style={styles.backToCartButton}
            onPress={() => router.push("/cart")}
          >
            <ShoppingCart color="#fff" size={18} strokeWidth={2} />
            <Text style={styles.backToCartButtonText}>Quay lại giỏ hàng</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <LinearGradient
        colors={['#4caf50', '#388e3c']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Xác nhận thanh toán</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Đơn hàng */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <ShoppingCart color="#1a1a1a" size={20} strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>Giỏ hàng của bạn</Text>
            </View>
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
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính:</Text>
            <Text style={styles.summaryValue}>{formatVND(subtotal)}</Text>
          </View>
          {loyaltyDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>🏆 Ưu đãi {memberRank} ({loyaltyDiscountPercent}%):</Text>
              <Text style={styles.discountValue}>-{formatVND(loyaltyDiscount)}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalPrice}>{formatVND(totalPrice)}</Text>
          </View>
        </View>

        {/* Thông tin giao hàng */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MapPin color="#1a1a1a" size={20} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
          </View>
          {shippingLoading && !shipping && <Text style={styles.mutedText}>Đang tải...</Text>}
          {!isShippingValid && !shippingLoading ? (
            <View style={styles.shippingEmptyState}>
              <AlertCircle color="#4caf50" size={48} strokeWidth={1.5} />
              <Text style={styles.warningText}>Chưa có thông tin giao hàng</Text>
              <TouchableOpacity
                style={styles.shippingButton}
                onPress={() => router.push("/editprofile")}
              >
                <FileText color="#fff" size={18} strokeWidth={2} />
                <Text style={styles.shippingButtonText}>Nhập thông tin giao hàng</Text>
              </TouchableOpacity>
            </View>
          ) : isShippingValid ? (
            <View style={styles.shippingCard}>
              <View style={styles.shippingRow}>
                <View style={styles.shippingLabelRow}>
                  <Phone color="#666" size={16} strokeWidth={2} />
                  <Text style={styles.shippingLabel}>Điện thoại:</Text>
                </View>
                <Text style={styles.shippingValue}>{shipping.phone}</Text>
              </View>
              <View style={styles.shippingRow}>
                <View style={styles.shippingLabelRow}>
                  <Home color="#666" size={16} strokeWidth={2} />
                  <Text style={styles.shippingLabel}>Địa chỉ:</Text>
                </View>
                <Text style={styles.shippingValue}>{shipping.addressLine}</Text>
              </View>
              {shipping.city ? (
                <View style={styles.shippingRow}>
                  <View style={styles.shippingLabelRow}>
                    <MapPinned color="#666" size={16} strokeWidth={2} />
                    <Text style={styles.shippingLabel}>Tỉnh/Thành:</Text>
                  </View>
                  <Text style={styles.shippingValue}>{shipping.city}</Text>
                </View>
              ) : null}
              {shipping.note ? (
                <View style={styles.shippingRow}>
                  <View style={styles.shippingLabelRow}>
                    <FileText color="#666" size={16} strokeWidth={2} />
                    <Text style={styles.shippingLabel}>Ghi chú:</Text>
                  </View>
                  <Text style={styles.shippingValue}>{shipping.note}</Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={styles.editShippingButton}
                onPress={() => router.push("/editprofile")}
              >
                <Edit color="#4caf50" size={16} strokeWidth={2} />
                <Text style={styles.editShippingButtonText}>Sửa thông tin</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Phương thức thanh toán */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Wallet color="#1a1a1a" size={20} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          </View>
          
          {/* COD Option */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "COD" && styles.paymentOptionSelected
            ]}
            onPress={() => setPaymentMethod("COD")}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.radioButton}>
                {paymentMethod === "COD" && <View style={styles.radioSelected} />}
              </View>
              <View>
                <Text style={styles.paymentTitle}>Thanh toán khi nhận hàng (COD)</Text>
                <Text style={styles.paymentSubtitle}>Thanh toán tiền mặt cho shipper</Text>
              </View>
            </View>
            {paymentMethod === "COD" && <Check color="#4caf50" size={24} strokeWidth={2.5} />}
          </TouchableOpacity>

          {/* PayOS Option */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "PAYOS" && styles.paymentOptionSelected,
              { marginTop: 12 }
            ]}
            onPress={() => setPaymentMethod("PAYOS")}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.radioButton}>
                {paymentMethod === "PAYOS" && <View style={styles.radioSelected} />}
              </View>
              <View>
                <Text style={styles.paymentTitle}>Thanh toán Online (PayOS)</Text>
                <Text style={styles.paymentSubtitle}>Quét mã QR ngân hàng / Ví điện tử</Text>
              </View>
            </View>
            {paymentMethod === "PAYOS" && <Check color="#4caf50" size={24} strokeWidth={2.5} />}
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
            {placing ? (
              <Loader color="#fff" size={20} strokeWidth={2.5} />
            ) : (
              <Check color="#fff" size={20} strokeWidth={2.5} />
            )}
            <Text style={styles.placeOrderButtonText}>
              {placing ? "Đang xử lý..." : `Đặt hàng${paymentMethod === "PAYOS" ? " (PayOS)" : " (COD)"}`}
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
    gap: 12,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#333",
    marginTop: 16,
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
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  badge: {
    backgroundColor: "#4caf50",
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
    color: "#4caf50",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#e9ecef",
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "600",
  },
  discountValue: {
    fontSize: 15,
    color: "#ff6b6b",
    fontWeight: "700",
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
    color: "#4caf50",
  },
  shippingEmptyState: {
    alignItems: "center",
    paddingVertical: 20,
  },
  warningText: {
    fontSize: 15,
    color: "#666",
    marginTop: 12,
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
  shippingLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  shippingLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  shippingValue: {
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "500",
    lineHeight: 22,
  },
  shippingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4caf50",
    padding: 14,
    borderRadius: 12,
    shadowColor: "#4caf50",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: "#4caf50",
  },
  editShippingButtonText: {
    color: "#4caf50",
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
    backgroundColor: "#e8f5e9",
    borderColor: "#4caf50",
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
    borderColor: "#4caf50",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4caf50",
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
  placeOrderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4caf50",
    padding: 18,
    borderRadius: 12,
    shadowColor: "#4caf50",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4caf50",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: "#4caf50",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4caf50",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: "#4caf50",
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