import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyOrders, cancelMyOrder } from "../src/api/order";
import { useAuth } from "../src/store/auth";

const formatVND = (n) => (n ?? 0).toLocaleString("vi-VN") + " đ";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusColor = (status) => {
  const statusColors = {
    PENDING: "#ffc107",
    CONFIRMED: "#17a2b8",
    PAID: "#28a745",
    PREPARING: "#fd7e14",
    DELIVERING: "#007bff",
    DONE: "#28a745",
    CANCELLED: "#dc3545",
    CANCELED: "#dc3545",
    FAILED: "#dc3545",
  };
  return statusColors[status?.toUpperCase()] || "#6c757d";
};

const getStatusText = (status) => {
  const statusTexts = {
    PENDING: "Đang chờ",
    CONFIRMED: "Đã xác nhận",
    PAID: "Đã thanh toán",
    PREPARING: "Đang chuẩn bị",
    DELIVERING: "Đang giao",
    DONE: "Hoàn thành",
    CANCELLED: "Đã hủy",
    CANCELED: "Đã hủy",
    FAILED: "Thất bại",
  };
  return statusTexts[status?.toUpperCase()] || status;
};

export default function Orders() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ["myOrders"],
    queryFn: getMyOrders,
    enabled: !!user,
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId) => cancelMyOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myOrders"] });
      Alert.alert("Thành công", "Đã hủy đơn hàng");
    },
    onError: (e) =>
      Alert.alert("Lỗi", e?.response?.data?.message || e?.message || "Hủy đơn hàng thất bại"),
  });

  const handleCancelOrder = (orderId) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn hủy đơn hàng này?",
      [
        { text: "Không", style: "cancel" },
        {
          text: "Có",
          style: "destructive",
          onPress: () => cancelOrderMutation.mutate(orderId),
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.mutedText}>Vui lòng đăng nhập để xem đơn hàng.</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/login?redirect=orders")}
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
        <Text style={styles.mutedText}>Đang tải đơn hàng...</Text>
      </View>
    );
  }

  if (error || !orders || !orders.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.mutedText}>Chưa có đơn hàng nào</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/home")}
        >
          <Text style={styles.backButtonText}>Tiếp tục mua hàng</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
        <View style={{ width: 60 }} />
      </View>

      {orders.map((order) => (
        <View key={order.id} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>Đơn hàng #{order.id}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status) },
              ]}
            >
              <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
            </View>
          </View>

          <Text style={styles.orderDate}>
            Ngày đặt: {formatDate(order.createdAt || order.orderDate)}
          </Text>

          {order.paymentMethod && (
            <Text style={styles.paymentMethod}>
              Thanh toán: {order.paymentMethod === "COD" ? "COD" : "Online"}
            </Text>
          )}

          <View style={styles.orderItems}>
            <Text style={styles.itemsTitle}>Sản phẩm:</Text>
            {(order.items || order.orderItems || []).map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <Text style={styles.itemName}>
                  {item.product?.name || item.name} × {item.quantity}
                </Text>
                <Text style={styles.itemPrice}>
                  {formatVND((item.product?.price || item.price || 0) * (item.quantity || 1))}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.orderFooter}>
            <Text style={styles.totalPrice}>
              Tổng cộng: {formatVND(order.totalAmount || order.total)}
            </Text>
            
            {(order.status === "PENDING" || order.status === "CONFIRMED") && (
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  cancelOrderMutation.isPending && styles.disabledButton,
                ]}
                onPress={() => handleCancelOrder(order.id)}
                disabled={cancelOrderMutation.isPending}
              >
                <Text style={styles.cancelButtonText}>
                  {cancelOrderMutation.isPending ? "Đang hủy..." : "Hủy đơn"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
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
  orderCard: {
    backgroundColor: "#fff",
    marginHorizontal: 8,
    marginVertical: 4,
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  orderDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  orderItems: {
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    color: "#007bff",
    fontWeight: "600",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  cancelButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
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