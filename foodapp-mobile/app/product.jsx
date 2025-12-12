import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProduct } from "../src/api/products";
import { addToCart, getCart } from "../src/api/cart";
import { listReviews, createReview, deleteReview, getAvgRating } from "../src/api/reviews";
import { useAuth } from "../src/store/auth";
import { useCart } from "../src/store/cart";

const formatVND = (n) => (n ?? 0).toLocaleString("vi-VN") + " đ";

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return { username: json.sub, roles: json.roles || json.authorities || [] };
  } catch {
    return null;
  }
}

function Stars({ value = 0 }) {
  const full = Math.round(Number(value) || 0);
  return (
    <Text style={styles.stars} title={`${value}/5`}>
      {"★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full)}
    </Text>
  );
}

export default function Product() {
  const { id } = useLocalSearchParams();
  const pid = Number(id);
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { user, token } = useAuth();
  const { setCount } = useCart();
  const me = React.useMemo(() => (token ? decodeJwt(token) : null), [token]);

  console.log("Auth state:", { user, token, me });

  const { data: product, isLoading: loadingProduct, error: errProduct } = useQuery({
    queryKey: ["product", pid],
    queryFn: () => getProduct(pid),
    onError: (err) => {
      console.error("Error fetching product:", err);
      Alert.alert("Lỗi tải sản phẩm", err?.message || "Không tải được dữ liệu sản phẩm.");
    },
  });

  const { data: reviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: ["reviews", pid],
    queryFn: () => listReviews(pid),
    onSuccess: (data) => console.log("Reviews data:", data), // Log dữ liệu để debug
  });

  const { data: avgRating = 0 } = useQuery({
    queryKey: ["reviews-avg", pid],
    queryFn: () => getAvgRating(pid),
  });

  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const addToCartMutation = useMutation({
    mutationFn: () => addToCart(pid, qty),
    onSuccess: async () => {
      const cart = await getCart();
      const items = cart?.items || cart?.cartItems || [];
      const totalQty = items.reduce((s, it) => s + (it?.quantity ?? 0), 0);
      setCount(totalQty);
      Alert.alert("Thành công", "Đã thêm vào giỏ hàng");
    },
    onError: (e) => {
      console.error("Add to cart error:", e?.response?.data || e?.message);
      Alert.alert("Lỗi", e?.response?.data?.message || e?.message || "Thêm vào giỏ thất bại");
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: () => createReview(pid, { rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", pid] });
      queryClient.invalidateQueries({ queryKey: ["reviews-avg", pid] });
      setComment("");
      setRating(5);
      Alert.alert("Thành công", "Đánh giá đã được gửi");
    },
    onError: (e) => Alert.alert("Lỗi", e?.response?.data?.message || e?.message || "Gửi đánh giá thất bại"),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId) => deleteReview(pid, reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", pid] });
      queryClient.invalidateQueries({ queryKey: ["reviews-avg", pid] });
      Alert.alert("Thành công", "Đánh giá đã được xóa");
    },
    onError: (e) => Alert.alert("Lỗi", e?.response?.data?.message || e?.message || "Xóa đánh giá thất bại"),
  });

  const handleAddToCart = () => {
    if (!user) {
      navigation.navigate("login", { redirect: "product", id: pid });
      return;
    }
    addToCartMutation.mutate();
  };

  const handleSubmitReview = () => {
    createReviewMutation.mutate();
  };

  const canDeleteReview = (r) => me && (me.username === r.user?.username || me.roles.includes("ADMIN"));

  if (loadingProduct || loadingReviews) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.mutedText}>Đang tải...</Text>
      </View>
    );
  }

  if (errProduct || !product) {
    console.log("Product data:", product);
    console.log("Product error:", errProduct);
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.mutedText}>Không tìm thấy sản phẩm.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("home")}
        >
          <Text style={styles.backButtonText}>Quay lại trang chủ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: product.imageUrl || "https://via.placeholder.com/300" }}
        style={styles.productImage}
      />
      <View style={styles.section}>
        <Text style={styles.productName}>{product.name}</Text>
        <View style={styles.ratingRow}>
          <Stars value={avgRating} />
          <Text style={styles.ratingText}>({reviews.length} đánh giá)</Text>
        </View>
        <Text style={styles.productPrice}>{formatVND(product.price)}</Text>
        
        {/* Thông tin dinh dưỡng */}
        {product.calories > 0 && (
          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionTitle}>Thông tin dinh dưỡng <Text style={styles.nutritionSubtitle}>(/phần)</Text></Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, {color: '#ea580c'}]}>{product.calories}</Text>
                <Text style={styles.nutritionLabel}>Kcal</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, {color: '#3b82f6'}]}>{product.protein || 0}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, {color: '#eab308'}]}>{product.carbs || 0}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, {color: '#8b5cf6'}]}>{product.fat || 0}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
          </View>
        )}
        
        <Text style={styles.productDesc}>{product.description || "Không có mô tả."}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Số lượng</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => setQty(Math.max(1, qty - 1))}
          >
            <Text style={styles.qtyButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{qty}</Text>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => setQty(qty + 1)}
          >
            <Text style={styles.qtyButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.addButton, addToCartMutation.isPending && styles.disabledButton]}
          onPress={handleAddToCart}
          disabled={addToCartMutation.isPending}
        >
          <Text style={styles.addButtonText}>
            {addToCartMutation.isPending ? "Đang thêm..." : "Thêm vào giỏ hàng"}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Đánh giá</Text>
        {reviews.length === 0 ? (
          <Text style={styles.mutedText}>Chưa có đánh giá nào.</Text>
        ) : (
          reviews.map((r) => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewUser}>{r.userName || r.user?.username || "Khách"}</Text>
                <Stars value={r.rating} />
              </View>
              {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
              {canDeleteReview(r) && (
                <TouchableOpacity
                  style={[styles.deleteButton, deleteReviewMutation.isPending && styles.disabledButton]}
                  onPress={() => deleteReviewMutation.mutate(r.id)}
                  disabled={deleteReviewMutation.isPending}
                >
                  <Text style={styles.deleteButtonText}>Xóa</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Viết đánh giá</Text>
        <View style={styles.reviewForm}>
          <Text style={styles.label}>Điểm (1–5)</Text>
          <View style={styles.ratingSelect}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.ratingOption, rating === n && styles.ratingSelected]}
                onPress={() => setRating(n)}
              >
                <Text style={[styles.ratingOptionText, rating === n && styles.ratingOptionTextSelected]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Nhận xét</Text>
          <TextInput
            style={styles.commentInput}
            multiline
            numberOfLines={4}
            placeholder="Cảm nhận của bạn về sản phẩm…"
            value={comment}
            onChangeText={setComment}
          />
          <TouchableOpacity
            style={[styles.submitButton, createReviewMutation.isPending && styles.disabledButton]}
            onPress={handleSubmitReview}
            disabled={createReviewMutation.isPending}
          >
            <Text style={styles.submitButtonText}>
              {createReviewMutation.isPending ? "Đang gửi..." : "Gửi đánh giá"}
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
  productImage: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
    borderRadius: 8,
  },
  productName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stars: {
    fontSize: 18,
    color: "#f1c40f",
  },
  ratingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "600",
    color: "#007bff",
    marginBottom: 8,
  },
  productDesc: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
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
  addButton: {
    padding: 12,
    backgroundColor: "#007bff",
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: "#6c757d",
  },
  reviewCard: {
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  reviewComment: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
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
  reviewForm: {
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  ratingSelect: {
    flexDirection: "row",
    marginBottom: 12,
  },
  ratingOption: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    minWidth: 40,
    alignItems: "center",
  },
  ratingSelected: {
    backgroundColor: "#007bff",
    borderColor: "#007bff",
  },
  ratingOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  ratingOptionTextSelected: {
    color: "#fff",
  },
  commentInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 12,
    fontSize: 14,
    color: "#333",
  },
  submitButton: {
    padding: 12,
    backgroundColor: "#007bff",
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  backButton: {
    padding: 12,
    backgroundColor: "#007bff",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  backButtonText: {
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
  nutritionCard: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  nutritionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 12,
  },
  nutritionSubtitle: {
    fontSize: 11,
    fontWeight: "400",
    color: "#868e96",
  },
  nutritionGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  nutritionItem: {
    alignItems: "center",
    flex: 1,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 11,
    color: "#868e96",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});