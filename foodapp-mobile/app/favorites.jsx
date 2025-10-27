import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "expo-router";
import { useAuth } from "../src/store/auth";
import { useCart } from "../src/store/cart";
import { getFavorites, toggleFavorite } from "../src/api/favorites";
import { addToCart, getCart } from "../src/api/cart";

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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sản phẩm yêu thích</Text>
      </View>

      {!favorites.length ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có sản phẩm yêu thích.</Text>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate("home")}
          >
            <Text style={styles.homeButtonText}>Về trang chủ</Text>
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
                <Text style={styles.favoriteIcon}>❤️</Text>
              </TouchableOpacity>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {p.name}
                </Text>
                <Text style={styles.productPrice}>{formatVND(p.price)}</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleAddToCart(p);
                }}
              >
                <Text style={styles.addButtonText}>Thêm vào giỏ</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  homeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#007bff",
    borderRadius: 6,
  },
  homeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 16,
  },
  productCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: 160,
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteIcon: {
    fontSize: 24,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: "#007bff",
    fontWeight: "600",
  },
  addButton: {
    margin: 12,
    marginTop: 0,
    paddingVertical: 10,
    backgroundColor: "#007bff",
    borderRadius: 6,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
