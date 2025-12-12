import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getCategoryProducts, getCategoriesPublic, getProductsPublic } from "../src/api/public";
import { addToCart, getCart } from "../src/api/cart";
import { getFavorites, toggleFavorite } from "../src/api/favorites";
import { useAuth } from "../src/store/auth";
import { useCart } from "../src/store/cart";
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Heart, ShoppingCart, AlertCircle } from 'lucide-react-native';

const formatVND = (n) => Number(n || 0).toLocaleString("vi-VN") + " đ";

export default function Category() {
  const { id } = useLocalSearchParams();
  const [catName, setCatName] = useState("");
  const [items, setItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { setCount } = useCart();
  const router = useRouter();

  useEffect(() => {
    let stop = false;
    (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Xử lý "all" để lấy tất cả sản phẩm
        let products;
        if (id === "all") {
          products = await getProductsPublic({ limit: 100 }).catch(() => []);
        } else {
          products = await getCategoryProducts(id, 80).catch(() => []);
        }

        const [cats, favRes] = await Promise.all([
          getCategoriesPublic(100).catch(() => []),
          user ? getFavorites().catch(() => []) : Promise.resolve([]),
        ]);

        if (!stop) {
          setItems(Array.isArray(products) ? products : []);
          setFavorites(Array.isArray(favRes) ? favRes : []);
          
          if (id === "all") {
            setCatName("Tất cả món ăn");
          } else {
            const cat = (cats || []).find((c) => String(c.id) === String(id));
            setCatName(cat?.name || `Danh mục #${id}`);
          }
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [id, user]);

  async function onAdd(product) {
    if (!user) {
      router.push("/login?redirect=/category");
      return;
    }
    try {
      await addToCart(product.id, 1);
      const cart = await getCart();
      const items = cart?.items || cart?.cartItems || [];
      const totalQty = items.reduce((sum, item) => sum + (item?.quantity ?? 0), 0);
      setCount(totalQty);
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
    }
  }

  const handleToggleFavorite = async (productId) => {
    if (!user) {
      router.push("/login?redirect=/category");
      return;
    }
    try {
      await toggleFavorite(productId);
      const favRes = await getFavorites();
      setFavorites(Array.isArray(favRes) ? favRes : []);
    } catch (e) {
      console.error("Lỗi khi toggle favorite:", e);
    }
  };

  const isFavorite = (productId) => {
    return favorites.some(fav => fav.id === productId);
  };

  const renderProduct = (product) => (
    <TouchableOpacity
      key={product.id}
      style={styles.productCard}
      onPress={() => router.push(`/product?id=${product.id}`)}
    >
      <Image
        source={{ uri: product.image || product.imageUrl || "https://via.placeholder.com/150" }}
        style={styles.productImage}
      />
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={(e) => {
          e.stopPropagation();
          handleToggleFavorite(product.id);
        }}
      >
        <Heart 
          color={isFavorite(product.id) ? "#ff5252" : "#9e9e9e"} 
          fill={isFavorite(product.id) ? "#ff5252" : "transparent"}
          size={22} 
          strokeWidth={2} 
        />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>{formatVND(product.price)}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            onAdd(product);
          }}
        >
          <Text style={styles.actionText}>Thêm vào giỏ</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
        <LinearGradient
          colors={['#4caf50', '#388e3c']}
          style={styles.header}
        >
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Danh mục</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4caf50" />
          <Text style={styles.mutedText}>Đang tải sản phẩm...</Text>
        </View>
      </View>
    );
  }

  if (!id) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
        <LinearGradient
          colors={['#4caf50', '#388e3c']}
          style={styles.header}
        >
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Danh mục</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <AlertCircle color="#999" size={64} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Không tìm thấy danh mục</Text>
          <TouchableOpacity style={styles.continueButton} onPress={() => router.push("/home")}>
            <Text style={styles.continueButtonText}>Về trang chủ</Text>
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
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>{catName}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>
      
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.productGrid}>
          {items.length ? (
            items.map(renderProduct)
          ) : (
            <View style={styles.emptyState}>
              <AlertCircle color="#999" size={48} strokeWidth={1.5} />
              <Text style={styles.emptyText}>Chưa có sản phẩm trong danh mục này</Text>
            </View>
          )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  cartButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 24,
  },
  mutedText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  continueButton: {
    marginTop: 20,
    backgroundColor: "#4caf50",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
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
  scrollContent: {
    flex: 1,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 12,
  },
  productCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: 160,
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
    paddingBottom: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 15,
    color: "#4caf50",
    fontWeight: "700",
  },
  cardActions: {
    padding: 12,
    paddingTop: 0,
  },
  actionButton: {
    paddingVertical: 10,
    backgroundColor: "#4caf50",
    borderRadius: 10,
    alignItems: "center",
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
});