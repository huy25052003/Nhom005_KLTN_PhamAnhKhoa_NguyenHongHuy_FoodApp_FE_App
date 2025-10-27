import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar } from "react-native";
import { useNavigation } from "expo-router";
import { useAuth } from "../src/store/auth";
import { useCart } from "../src/store/cart";
import { getFeaturedProducts, getCategoriesPublic } from "../src/api/public";
import { addToCart, getCart } from "../src/api/cart";
import { useMe } from "../src/api/hooks";
import { getFavorites, toggleFavorite } from "../src/api/favorites";
import { LinearGradient } from 'expo-linear-gradient';

const samplePlans = [
  { name: "Gói FIT 3 Trưa - Tối", desc: "Best seller", price: 650000, badge: "Best seller" },
  { name: "Gói FULL 3 bữa/ngày", desc: "Giữ cân healthy", price: 825000 },
  { name: "Gói SLIM Không tinh bột", desc: "Gấp đôi rau", price: 600000 },
  { name: "Gói MEAT Tăng cơ", desc: "Thêm 1.5x thịt", price: 950000 },
];

const formatVND = (n) => (n ?? 0).toLocaleString("vi-VN") + " đ";

export default function Home() {
  const { user, clear } = useAuth();
  const { setCount } = useCart();
  const navigation = useNavigation();
  const { data: me } = useMe();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [prodRes, catRes, favRes] = await Promise.all([
          getFeaturedProducts(8),
          getCategoriesPublic(6),
          user ? getFavorites().catch(() => []) : Promise.resolve([]),
        ]);
        setProducts(Array.isArray(prodRes) ? prodRes : []);
        setCategories(Array.isArray(catRes) ? catRes : []);
        setFavorites(Array.isArray(favRes) ? favRes : []);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleAddToCart = async (product) => {
    if (!user) {
      navigation.navigate("login", { redirect: "cart" });
      return;
    }
    try {
      await addToCart(product.id, 1);
      const cart = await getCart();
      const items = cart?.items || cart?.cartItems || [];
      const totalQty = items.reduce((s, it) => s + (it?.quantity ?? 0), 0);
      setCount(totalQty);
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Thêm vào giỏ thất bại");
    }
  };

  const handleToggleFavorite = async (productId) => {
    if (!user) {
      navigation.navigate("login", { redirect: "home" });
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

  const handleLogout = () => {
    clear();
    navigation.replace("login");
  };

  const handleShippingInfo = () => {
    navigation.navigate("shippinginfo");
  };

  const renderProduct = (product) => (
    <TouchableOpacity
      key={product.id}
      style={styles.productCard}
      onPress={() => navigation.navigate("product", { id: product.id })}
    >
      <Image
        source={{ uri: product.imageUrl || "https://via.placeholder.com/150" }}
        style={styles.productImage}
      />
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={(e) => {
          e.stopPropagation();
          handleToggleFavorite(product.id);
        }}
      >
        <Text style={styles.favoriteIcon}>
          {isFavorite(product.id) ? "❤️" : "🤍"}
        </Text>
      </TouchableOpacity>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>{formatVND(product.price)}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleAddToCart(product)}
        >
          <Text style={styles.actionText}>Thêm vào giỏ</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = (category) => (
    <TouchableOpacity
      key={category.id}
      style={styles.categoryCard}
      onPress={() => navigation.navigate("category", { id: category.id })}
    >
      <Text style={styles.categoryName}>{category.name}</Text>
    </TouchableOpacity>
  );

  const renderPlan = (plan, index) => (
    <View key={index} style={styles.planCard}>
      {plan.badge && <Text style={styles.badge}>{plan.badge}</Text>}
      <Text style={styles.planName}>{plan.name}</Text>
      <Text style={styles.planDesc}>{plan.desc}</Text>
      <Text style={styles.planPrice}>{formatVND(plan.price)}</Text>
      <TouchableOpacity style={styles.planButton}>
        <Text style={styles.planButtonText}>Chọn gói</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  console.log("User state in Home:", user, "Me state:", me);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a73e8" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#1a73e8', '#0d47a1']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerGreeting}>Xin chào!</Text>
              <Text style={styles.headerTitle}>
                {me?.username || user?.username || "Khách"}
              </Text>
            </View>
            <View style={styles.headerActions}>
              {user ? (
                <>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate("favorites")} 
                    style={styles.headerIconButton}
                  >
                    <Text style={styles.headerIcon}>❤️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleLogout} 
                    style={styles.headerIconButton}
                  >
                    <Text style={styles.headerIcon}>🚪</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  onPress={() => navigation.navigate("login")} 
                  style={styles.headerLoginButton}
                >
                  <Text style={styles.headerLoginText}>Đăng nhập</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                onPress={() => navigation.navigate("cart")} 
                style={styles.headerIconButton}
              >
                <Text style={styles.headerIcon}>🛒</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Hero Section with Gradient */}
        <LinearGradient
          colors={['#fff5f5', '#ffffff']}
          style={styles.hero}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Kế hoạch bữa ăn lành mạnh</Text>
            <Text style={styles.heroSubtitle}>
              Thực đơn đa dạng, dinh dưỡng cân đối — theo mục tiêu của bạn
            </Text>
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate("order")}
              >
                <Text style={styles.buttonText}>🍽️ Đặt ngay</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.heroFeatures}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🚚</Text>
                <Text style={styles.featureText}>Giao tận nơi</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🥗</Text>
                <Text style={styles.featureText}>100+ món</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>💪</Text>
                <Text style={styles.featureText}>Eat clean</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cách đặt hàng</Text>
        <View style={styles.howtoGrid}>
          {[
            { step: 1, text: "Chọn gói ăn phù hợp" },
            { step: 2, text: "FoodApp nấu nguyên liệu tươi" },
            { step: 3, text: "Giao tận nơi mỗi ngày" },
            { step: 4, text: "Hâm nóng & thưởng thức" },
          ].map((item, index) => (
            <View key={index} style={styles.howtoItem}>
              <View style={styles.howtoStep}>
                <Text style={styles.howtoStepText}>{item.step}</Text>
              </View>
              <Text style={styles.howtoText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.section, styles.sectionAlt]}>
        <Text style={styles.sectionTitle}>Sản phẩm tiêu biểu</Text>
        <View style={styles.grid4}>
          {samplePlans.map(renderPlan)}
        </View>
      </View>

      {!!categories.length && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh mục nổi bật</Text>
          <View style={styles.grid6}>
            {categories.map(renderCategory)}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Món được yêu thích</Text>
        <View style={styles.grid4}>
          {products.length ? (
            products.map(renderProduct)
          ) : (
            <Text style={styles.mutedText}>Chưa có dữ liệu sản phẩm.</Text>
          )}
        </View>
      </View>

      <View style={[styles.section, styles.sectionAlt]}>
        <View style={styles.grid3}>
          <View style={styles.ecoCard}>
            <Text style={styles.ecoText}>Túi nylon sinh học tự hủy</Text>
          </View>
          <View style={styles.ecoCard}>
            <Text style={styles.ecoText}>Tái sử dụng hộp, hoàn tiền</Text>
          </View>
          <View style={styles.ecoCard}>
            <Text style={styles.ecoText}>Hạn chế muỗng nĩa dùng 1 lần</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Đối tác & Khách hàng</Text>
        <View style={styles.logoRow}>
          {Array.from({ length: 10 }).map((_, i) => (
            <View key={i} style={styles.logoBox} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate("cart")}
        >
          <Text style={styles.ctaText}>Xem giỏ hàng</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8f9fa" },
  
  // New Header Styles
  header: {
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerGreeting: {
    fontSize: 14,
    color: "#e3f2fd",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginTop: 4,
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerIcon: {
    fontSize: 20,
  },
  headerLoginButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  headerLoginText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a73e8",
  },
  
  // Hero Section
  hero: {
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
  },
  heroContent: {
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  heroActions: {
    width: "100%",
    marginBottom: 24,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: "#1a73e8",
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#1a73e8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  heroFeatures: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  featureItem: {
    alignItems: "center",
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  
  // Sections
  section: { paddingHorizontal: 20, paddingVertical: 16 },
  sectionAlt: { backgroundColor: "#ffffff", marginVertical: 8, borderRadius: 16, marginHorizontal: 12 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  
  // How-to Grid
  howtoGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  howtoItem: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  howtoStep: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1a73e8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#1a73e8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  howtoStepText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  howtoText: { fontSize: 13, color: "#444", textAlign: "center", fontWeight: "600" },
  
  // Grids
  grid4: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  grid6: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  grid3: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  
  // Plan Cards
  planCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#ff6b6b",
    color: "#fff",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: "700",
  },
  planName: { fontSize: 15, fontWeight: "700", color: "#1a1a1a", marginBottom: 6 },
  planDesc: { fontSize: 13, color: "#666", marginBottom: 12 },
  planPrice: { fontSize: 16, color: "#1a73e8", marginBottom: 12, fontWeight: "700" },
  planButton: {
    padding: 12,
    backgroundColor: "#1a73e8",
    borderRadius: 10,
    alignItems: "center",
  },
  planButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  
  // Category Cards
  categoryCard: {
    width: "31%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryName: { fontSize: 13, fontWeight: "700", color: "#1a1a1a", textAlign: "center" },
  
  // Product Cards
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
    top: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteIcon: { fontSize: 20 },
  productInfo: { padding: 12, paddingBottom: 8 },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 15,
    color: "#1a73e8",
    fontWeight: "700",
  },
  cardActions: { padding: 12, paddingTop: 0 },
  actionButton: {
    paddingVertical: 10,
    backgroundColor: "#1a73e8",
    borderRadius: 10,
    alignItems: "center",
  },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  
  // Eco Cards
  ecoCard: {
    width: "31%",
    backgroundColor: "#e8f5e9",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#a5d6a7",
  },
  ecoText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2e7d32",
    textAlign: "center",
    lineHeight: 16,
  },
  
  // Logo Row
  logoRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  logoBox: {
    width: "18%",
    height: 60,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  
  // CTA Button
  ctaButton: {
    paddingVertical: 16,
    backgroundColor: "#1a73e8",
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#1a73e8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  
  // Misc
  mutedText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    width: "100%",
    paddingVertical: 20,
  },
});