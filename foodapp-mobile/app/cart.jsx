import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCart, updateCartItem, removeCartItem, clearCart } from "../src/api/cart";
import { getActivePromotions, previewPromotion } from "../src/api/promotions";
import { getProfile } from "../src/api/user";
import { useAuth } from "../src/store/auth";
import { useCart } from "../src/store/cart";
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingCart, Lock, Trash2, ChevronLeft, Minus, Plus, CreditCard, Tag, Gift } from 'lucide-react-native';

const formatVND = (n) => (n ?? 0).toLocaleString("vi-VN") + " đ";

export default function Cart() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { setCount } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");

  console.log("Cart auth state:", { user }); // Debug trạng thái đăng nhập

  const { data: promotions = [] } = useQuery({
    queryKey: ["promotions", "active"],
    queryFn: getActivePromotions,
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !!user,
  });

  const { data: cart, isLoading, error } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: !!user,
    onError: (err) => {
      console.error("Error fetching cart:", err);
      Alert.alert("Lỗi", "Không tải được giỏ hàng. Vui lòng thử lại.");
    },
  });

  const updateCartMutation = useMutation({
    mutationFn: ({ itemId, quantity }) => updateCartItem(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      updateCartCount();
    },
    onError: (e) => Alert.alert("Lỗi", e?.response?.data?.message || e?.message || "Cập nhật giỏ hàng thất bại"),
  });

  const removeCartItemMutation = useMutation({
    mutationFn: (itemId) => removeCartItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      updateCartCount();
    },
    onError: (e) => Alert.alert("Lỗi", e?.response?.data?.message || e?.message || "Xóa sản phẩm thất bại"),
  });

  const clearCartMutation = useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setCount(0);
      Alert.alert("Thành công", "Đã xóa toàn bộ giỏ hàng");
    },
    onError: (e) => Alert.alert("Lỗi", e?.response?.data?.message || e?.message || "Xóa giỏ hàng thất bại"),
  });

  const updateCartCount = async () => {
    try {
      const updatedCart = await getCart();
      const items = updatedCart?.items || updatedCart?.cartItems || [];
      const totalQty = items.reduce((s, it) => s + (it?.quantity ?? 0), 0);
      setCount(totalQty);
    } catch (e) {
      console.error("Error updating cart count:", e);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError("Vui lòng nhập mã giảm giá");
      return;
    }
    try {
      const items = cart?.items || cart?.cartItems || [];
      const preview = await previewPromotion(promoCode, items);
      setAppliedPromo(preview);
      setPromoError("");
      Alert.alert("Thành công", `Đã áp dụng mã giảm giá: ${promoCode}`);
    } catch (e) {
      setPromoError(e?.response?.data?.message || "Mã giảm giá không hợp lệ");
      setAppliedPromo(null);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoError("");
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
          <Text style={styles.headerTitle}>Giỏ hàng</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <Lock color="#999" size={64} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Vui lòng đăng nhập</Text>
          <Text style={styles.mutedText}>Đăng nhập để xem giỏ hàng và đặt mua sản phẩm</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/login?redirect=cart")}
          >
            <Lock color="#fff" size={18} strokeWidth={2} />
            <Text style={styles.loginButtonText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
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
          <Text style={styles.headerTitle}>Giỏ hàng</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4caf50" />
          <Text style={styles.mutedText}>Đang tải giỏ hàng...</Text>
        </View>
      </View>
    );
  }

  const items = cart?.items || cart?.cartItems || [];

  if (error || !items.length) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
        <LinearGradient
          colors={['#4caf50', '#388e3c']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Giỏ hàng</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <ShoppingCart color="#999" size={64} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
          <Text style={styles.mutedText}>Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</Text>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => router.push("/home")}
          >
            <ShoppingCart color="#fff" size={18} strokeWidth={2} />
            <Text style={styles.continueButtonText}>Tiếp tục mua hàng</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const subtotal = items.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * (item.quantity ?? 0),
    0
  );
  
  // Ưu đãi thành viên (theo rank)
  const memberRank = profile?.memberRank || "ĐỒNG";
  const loyaltyDiscountPercent = memberRank === "ĐỒNG" ? 1 : memberRank === "BẠC" ? 3 : memberRank === "VÀNG" ? 5 : memberRank === "KIM CƯƠNG" ? 10 : 0;
  const loyaltyDiscount = Math.round(subtotal * loyaltyDiscountPercent / 100);
  
  const discount = appliedPromo?.discount || 0;
  const totalPrice = subtotal - loyaltyDiscount - discount;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <LinearGradient
        colors={['#4caf50', '#388e3c']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Giỏ hàng của tôi</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>
      
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <ShoppingCart color="#1a1a1a" size={20} strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>Sản phẩm đã chọn</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{items.length}</Text>
            </View>
          </View>
          {items.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <Image
                source={{ uri: item.product?.imageUrl || "https://via.placeholder.com/80" }}
                style={styles.itemImage}
              />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.product?.name || "Sản phẩm"}
                </Text>
                {item.product?.category?.name && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.product.category.name}</Text>
                  </View>
                )}
                <Text style={styles.itemPrice}>{formatVND(item.product?.price)}</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={[styles.qtyButton, (updateCartMutation.isPending || item.quantity <= 1) && styles.disabledQtyButton]}
                    onPress={() => updateCartMutation.mutate({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
                    disabled={updateCartMutation.isPending || item.quantity <= 1}
                  >
                    <Minus color="#4caf50" size={16} strokeWidth={2.5} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={[styles.qtyButton, updateCartMutation.isPending && styles.disabledQtyButton]}
                    onPress={() => updateCartMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                    disabled={updateCartMutation.isPending}
                  >
                    <Plus color="#4caf50" size={16} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.deleteButton, removeCartItemMutation.isPending && styles.disabledButton]}
                onPress={() => {
                  Alert.alert(
                    "Xác nhận",
                    "Bạn có chắc muốn xóa sản phẩm này?",
                    [
                      { text: "Hủy", style: "cancel" },
                      { text: "Xóa", style: "destructive", onPress: () => removeCartItemMutation.mutate(item.id) }
                    ]
                  );
                }}
                disabled={removeCartItemMutation.isPending}
              >
                <Trash2 color="#ff6b6b" size={20} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Ưu đãi hiện có */}
        {promotions.length > 0 && (
          <View style={styles.promotionSection}>
            <View style={styles.sectionTitleRow}>
              <Gift color="#ff6b6b" size={20} strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>Ưu đãi dành cho bạn</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promotionScroll}>
              {promotions.map((promo) => (
                <TouchableOpacity
                  key={promo.id}
                  style={styles.promoCard}
                  onPress={() => {
                    setPromoCode(promo.code);
                    setPromoError("");
                  }}
                >
                  <View style={styles.promoHeader}>
                    <Tag color="#ff6b6b" size={16} strokeWidth={2} />
                    <Text style={styles.promoCode}>{promo.code}</Text>
                  </View>
                  <Text style={styles.promoDescription} numberOfLines={2}>
                    {promo.description}
                  </Text>
                  <Text style={styles.promoDiscount}>
                    Giảm {promo.discountType === 'PERCENTAGE' 
                      ? `${promo.discountValue}%` 
                      : formatVND(promo.discountValue)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Nhập mã giảm giá */}
        <View style={styles.couponSection}>
          <View style={styles.sectionTitleRow}>
            <Tag color="#4caf50" size={20} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Mã giảm giá</Text>
          </View>
          {appliedPromo ? (
            <View style={styles.appliedPromoBox}>
              <View style={styles.appliedPromoLeft}>
                <Tag color="#4caf50" size={18} strokeWidth={2} />
                <View>
                  <Text style={styles.appliedPromoCode}>{promoCode}</Text>
                  <Text style={styles.appliedPromoDiscount}>-{formatVND(discount)}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleRemovePromo}>
                <Text style={styles.removePromoText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInputContainer}>
              <TextInput
                style={styles.couponInput}
                placeholder="Nhập mã giảm giá"
                value={promoCode}
                onChangeText={(text) => {
                  setPromoCode(text.toUpperCase());
                  setPromoError("");
                }}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.applyButton} onPress={handleApplyPromo}>
                <Text style={styles.applyButtonText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          )}
          {promoError ? <Text style={styles.errorText}>{promoError}</Text> : null}
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Tóm tắt đơn hàng</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng sản phẩm:</Text>
            <Text style={styles.summaryValue}>{items.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng số lượng:</Text>
            <Text style={styles.summaryValue}>
              {items.reduce((sum, item) => sum + (item.quantity ?? 0), 0)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính:</Text>
            <Text style={styles.summaryValue}>{formatVND(subtotal)}</Text>
          </View>
          {loyaltyDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>🏆 Ưu đãi thành viên {memberRank} ({loyaltyDiscountPercent}%):</Text>
              <Text style={styles.discountValue}>-{formatVND(loyaltyDiscount)}</Text>
            </View>
          )}
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giảm giá:</Text>
              <Text style={styles.discountValue}>-{formatVND(discount)}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng thanh toán</Text>
            <Text style={styles.totalPrice}>{formatVND(totalPrice)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.clearButton, clearCartMutation.isPending && styles.disabledButton]}
          onPress={() => {
            Alert.alert(
              "Xác nhận",
              "Bạn có chắc muốn xóa toàn bộ giỏ hàng?",
              [
                { text: "Hủy", style: "cancel" },
                { text: "Xóa", style: "destructive", onPress: () => clearCartMutation.mutate() }
              ]
            );
          }}
          disabled={clearCartMutation.isPending}
        >
          <Trash2 color="#fff" size={18} strokeWidth={2} />
          <Text style={styles.clearButtonText}>
            {clearCartMutation.isPending ? "Đang xóa..." : "Xóa giỏ hàng"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.checkoutButton]}
          onPress={() => router.push("/checkout")}
        >
          <CreditCard color="#fff" size={18} strokeWidth={2} />
          <Text style={styles.checkoutButtonText}>Thanh toán</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
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
  cartItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#e9ecef",
  },
  itemDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
    lineHeight: 22,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 12,
    color: "#1a73e8",
    fontWeight: "600",
  },
  itemPrice: {
    fontSize: 17,
    color: "#4caf50",
    fontWeight: "800",
    marginBottom: 8,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#4caf50",
    shadowColor: "#4caf50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledQtyButton: {
    backgroundColor: "#e9ecef",
    borderColor: "#ced4da",
    opacity: 0.5,
    shadowOpacity: 0,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginHorizontal: 14,
    minWidth: 28,
    textAlign: "center",
  },
  deleteButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  promotionSection: {
    margin: 16,
    marginTop: 0,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  promotionScroll: {
    marginTop: 12,
  },
  promoCard: {
    backgroundColor: "#fff5f5",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 200,
    borderWidth: 1,
    borderColor: "#ffcccc",
  },
  promoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  promoCode: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ff6b6b",
  },
  promoDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    lineHeight: 18,
  },
  promoDiscount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ff6b6b",
  },
  couponSection: {
    margin: 16,
    marginTop: 0,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  couponInputContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  couponInput: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  applyButton: {
    backgroundColor: "#4caf50",
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4caf50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  appliedPromoBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#4caf50",
  },
  appliedPromoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  appliedPromoCode: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2e7d32",
  },
  appliedPromoDiscount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4caf50",
  },
  removePromoText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ff6b6b",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 13,
    marginTop: 6,
    fontWeight: "500",
  },
  summarySection: {
    margin: 16,
    marginTop: 0,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
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
  divider: {
    height: 1,
    backgroundColor: "#e9ecef",
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
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
  footer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  clearButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    backgroundColor: "#ff6b6b",
    borderRadius: 12,
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  clearButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  checkoutButton: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    backgroundColor: "#4caf50",
    borderRadius: 12,
    shadowColor: "#4caf50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: "#9e9e9e",
    shadowOpacity: 0,
    elevation: 0,
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
  continueButton: {
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
  continueButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  mutedText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginVertical: 8,
    lineHeight: 24,
  },
});