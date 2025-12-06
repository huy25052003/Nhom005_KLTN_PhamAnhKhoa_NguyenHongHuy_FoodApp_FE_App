import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useNavigation } from "expo-router";
import { useAuth } from "../src/store/auth";
import { useCart } from "../src/store/cart";
import { getFavorites, toggleFavorite } from "../src/api/favorites";
import { addToCart, getCart } from "../src/api/cart";
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, ShoppingCart, Home, ChevronLeft } from 'lucide-react-native';

const formatVND = (n) => (n ?? 0).toLocaleString("vi-VN") + " đ";

export default function Favorites() {
  const { user } = useAuth();
  const { setCount } = useCart();
  const navigation = useNavigation();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const res = await getFavorites();
      setFavorites(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Error loading favorites:", error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigation.replace("login", { redirect: "favorites" });
      return;
    }
    loadFavorites();
  }, [user]);

  const handleToggleFavorite = async (productId) => {
    try {
      await toggleFavorite(productId);
      await loadFavorites();
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product.id, 1);
      const cart = await getCart();
      const items = cart?.items || cart?.cartItems || [];
      const totalQty = items.reduce((s, it) => s + (it?.quantity ?? 0), 0);
      setCount(totalQty);
      alert("Đã thêm vào giỏ hàng!");
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Thêm vào giỏ thất bại");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ff6b6b" />
      <LinearGradient
        colors={['#ff6b6b', '#ee5a6f']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft color="#fff" size={28} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.title}>Sản phẩm yêu thích</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {!favorites.length ? (
          <View style={styles.emptyContainer}>
            <Heart color="#ff6b6b" size={80} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Chưa có món yêu thích</Text>
            <Text style={styles.emptyText}>
              Hãy thêm các món ăn bạn yêu thích để dễ dàng tìm lại sau nhé!
            </Text>
            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => navigation.navigate("home")}
            >
              <Home color="#fff" size={20} strokeWidth={2} />
              <Text style={styles.homeButtonText}>Khám phá ngay</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {favorites.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.productCard}
                onPress={() => navigation.navigate("product", { id: p.id })}
              >
                <Image
                  source={{ uri: p.imageUrl || "https://via.placeholder.com/150" }}
                  style={styles.productImage}
                />
                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(p.id);
                  }}
                >
                  <Heart color="#ff5252" fill="#ff5252" size={22} strokeWidth={2} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {p.name}
                    </Text>
                    <Text style={styles.productPrice}>{formatVND(p.price)}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleAddToCart(p);
                  }}
                >
                  <ShoppingCart color="#fff" size={18} strokeWidth={2} />
                  <Text style={styles.addButtonText}>Thêm vào giỏ</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
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
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  emptyContainer: {
    marginTop: 80,
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  homeButton: {
    flexDirection: "row",
    backgroundColor: "#ff6b6b",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  homeButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    justifyContent: "space-between",
  },
  productCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  productImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#f0f0f0",
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
    color: "#333",
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ff6b6b",
  },
  addButton: {
    backgroundColor: "#4caf50",
    padding: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
