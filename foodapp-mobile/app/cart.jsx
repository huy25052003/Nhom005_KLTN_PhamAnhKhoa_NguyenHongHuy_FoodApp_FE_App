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
import { getCart, updateCartItem, removeCartItem, clearCart, checkout } from "../src/api/cart";
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

  const checkoutMutation = useMutation({
    mutationFn: checkout,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setCount(0);
      Alert.alert("Thành công", `Đơn hàng #${data.orderId || "N/A"} đã được tạo`, [
        { text: "OK", onPress: () => router.push("/home") },
      ]);
    },
    onError: (e) => Alert.alert("Lỗi", e?.response?.data?.message || e?.message || "Thanh toán thất bại"),
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

  if (error || !cart || !cart.items?.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.mutedText}>Giỏ hàng trống</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/home")}
        >
          <Text style={styles.backButtonText}>Quay lại trang chủ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalPrice = cart.items.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * (item.quantity ?? 0),
    0
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sản phẩm trong giỏ</Text>
        {cart.items.map((item) => (
          <View key={item.id} style={styles.cartItem}>
            <Image
              source={{ uri: item.product?.imageUrl || "https://via.placeholder.com/80" }}
              style={styles.itemImage}
            />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.product?.name || "Sản phẩm"}</Text>
              <Text style={styles.itemPrice}>{formatVND(item.product?.price)}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={[styles.qtyButton, updateCartMutation.isPending && styles.disabledButton]}
                  onPress={() => updateCartMutation.mutate({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
                  disabled={updateCartMutation.isPending}
                >
                  <Text style={styles.qtyButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={[styles.qtyButton, updateCartMutation.isPending && styles.disabledButton]}
                  onPress={() => updateCartMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                  disabled={updateCartMutation.isPending}
                >
                  <Text style={styles.qtyButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.deleteButton, removeCartItemMutation.isPending && styles.disabledButton]}
              onPress={() => removeCartItemMutation.mutate(item.id)}
              disabled={removeCartItemMutation.isPending}
            >
              <Text style={styles.deleteButtonText}>Xóa</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.totalText}>Tổng cộng: {formatVND(totalPrice)}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.clearButton, clearCartMutation.isPending && styles.disabledButton]}
            onPress={() => clearCartMutation.mutate()}
            disabled={clearCartMutation.isPending}
          >
            <Text style={styles.clearButtonText}>
              {clearCartMutation.isPending ? "Đang xóa..." : "Xóa giỏ hàng"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkoutButton, checkoutMutation.isPending && styles.disabledButton]}
            onPress={() => router.push("/checkout")}
            disabled={checkoutMutation.isPending}
          >
            <Text style={styles.checkoutButtonText}>
              Thanh toán
            </Text>
          </TouchableOpacity>
        </View>
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
    padding: 16,
    backgroundColor: "#fff",
    marginBottom: 8,
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
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: "#007bff",
    marginBottom: 8,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
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
    width: 40,
    textAlign: "center",
  },
  deleteButton: {
    padding: 8,
    backgroundColor: "#dc3545",
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
    textAlign: "right",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  clearButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#dc3545",
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
  },
  clearButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  checkoutButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#28a745",
    borderRadius: 8,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: "#6c757d",
  },
  loginButton: {
    padding: 12,
    backgroundColor: "#007bff",
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
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginVertical: 12,
  },
});