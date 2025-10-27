import React from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCart, updateCartItem, removeCartItem, clearCart } from "../src/api/cart";
import { useAuth } from "../src/store/auth";
import { useCart } from "../src/store/cart";

const formatVND = (n) => (n ?? 0).toLocaleString("vi-VN") + " đ";

export default function Cart() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { setCount } = useCart();

  console.log("Cart auth state:", { user }); // Debug trạng thái đăng nhập

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

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.mutedText}>Vui lòng đăng nhập để xem giỏ hàng.</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/login?redirect=cart")}
        >
          <Text style={styles.loginButtonText}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.mutedText}>Đang tải giỏ hàng...</Text>
      </View>
    );
  }

  const items = cart?.items || cart?.cartItems || [];

  if (error || !items.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
        <Text style={styles.mutedText}>Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</Text>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.push("/home")}
        >
          <Text style={styles.continueButtonText}>Tiếp tục mua hàng</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalPrice = items.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * (item.quantity ?? 0),
    0
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
        <View style={{ width: 70 }} />
      </View>
      
      <ScrollView style={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sản phẩm ({items.length})</Text>
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
                  <Text style={styles.categoryText}>{item.product.category.name}</Text>
                )}
                <Text style={styles.itemPrice}>{formatVND(item.product?.price)}</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={[styles.qtyButton, (updateCartMutation.isPending || item.quantity <= 1) && styles.disabledQtyButton]}
                    onPress={() => updateCartMutation.mutate({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
                    disabled={updateCartMutation.isPending || item.quantity <= 1}
                  >
                    <Text style={styles.qtyButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={[styles.qtyButton, updateCartMutation.isPending && styles.disabledQtyButton]}
                    onPress={() => updateCartMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                    disabled={updateCartMutation.isPending}
                  >
                    <Text style={styles.qtyButtonText}>+</Text>
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
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
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
          <Text style={styles.clearButtonText}>
            {clearCartMutation.isPending ? "Đang xóa..." : "Xóa giỏ hàng"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.checkoutButton]}
          onPress={() => router.push("/checkout")}
        >
          <Text style={styles.checkoutButtonText}>Thanh toán</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    padding: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
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
  scrollContent: {
    flex: 1,
  },
  section: {
    padding: 16,
    backgroundColor: "#fff",
    marginTop: 8,
    marginHorizontal: 8,
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
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#e9ecef",
  },
  itemDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    lineHeight: 22,
  },
  categoryText: {
    fontSize: 13,
    color: "#6c757d",
    marginBottom: 6,
  },
  itemPrice: {
    fontSize: 16,
    color: "#007bff",
    fontWeight: "600",
    marginBottom: 8,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  disabledQtyButton: {
    backgroundColor: "#e9ecef",
    borderColor: "#ced4da",
    opacity: 0.6,
  },
  qtyButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginHorizontal: 16,
    minWidth: 32,
    textAlign: "center",
  },
  deleteButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 24,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: "700",
    color: "#007bff",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  clearButton: {
    flex: 1,
    padding: 14,
    backgroundColor: "#dc3545",
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#dc3545",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  clearButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  checkoutButton: {
    flex: 1,
    padding: 14,
    backgroundColor: "#28a745",
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#28a745",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  checkoutButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: "#6c757d",
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 32,
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
  continueButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#007bff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButtonText: {
    color: "#fff",
    fontWeight: "600",
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