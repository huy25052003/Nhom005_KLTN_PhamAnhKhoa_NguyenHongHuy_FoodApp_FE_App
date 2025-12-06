import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar } from "react-native";
import { useNavigation } from "expo-router";
import { useAuth } from "../src/store/auth";
import { useCart } from "../src/store/cart";
import { getCategoriesPublic } from "../src/api/public";
import { addToCart, getCart } from "../src/api/cart";
import { useMe } from "../src/api/hooks";
import { getFavorites, toggleFavorite } from "../src/api/favorites";
import { getRecommendations } from "../src/api/recommendations";
import { getProfile } from "../src/api/user";
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, LogOut, ShoppingCart, Utensils, Truck, Salad, Dumbbell, Home as HomeIcon, User, MessageCircle } from 'lucide-react-native';
import AdminChatWidget from "../src/components/AdminChatWidget";

const samplePlans = [
  { name: "Gói FIT 3 Trưa - Tối", desc: "Best seller", price: 650000, badge: "Best seller" },
  { name: "Gói FULL 3 bữa/ngày", desc: "Giữ cân healthy", price: 825000 },
  { name: "Gói SLIM Không tinh bột", desc: "Gấp đôi rau", price: 600000 },
  { name: "Gói MEAT Tăng cơ", desc: "Thêm 1.5x thịt", price: 950000 },
];

const formatVND = (n) => (n ?? 0).toLocaleString("vi-VN") + " đ";

export default function Home() {
  const { user, clear } = useAuth();
  const { count, setCount } = useCart();
  const navigation = useNavigation();
  const { data: me } = useMe();
  const [recommended, setRecommended] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [isAdminChatOpen, setIsAdminChatOpen] = useState(false);
  const [appState, setAppState] = useState("LOADING"); // LOADING | NO_PROFILE | HAS_PROFILE | EMPTY

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [catRes, favRes] = await Promise.all([
          getCategoriesPublic(6),
          user ? getFavorites().catch(() => []) : Promise.resolve([]),
        ]);
        setCategories(Array.isArray(catRes) ? catRes : []);
        setFavorites(Array.isArray(favRes) ? favRes : []);

        // Check profile and get recommendations if user is logged in
        if (user) {
          try {
            const userProfile = await getProfile().catch(() => null);
            if (!userProfile || !userProfile.heightCm || !userProfile.weightKg) {
              setAppState("NO_PROFILE");
            } else {
              const recs = await getRecommendations();
              if (recs && recs.length > 0) {
                setRecommended(recs);
                setAppState("HAS_PROFILE");
              } else {
                setAppState("EMPTY");
              }
            }
          } catch (e) {
            console.error("Lỗi khi lấy recommendations:", e);
            setAppState("NO_PROFILE");
          }
        } else {
          setAppState("NO_PROFILE");
        }
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
        <ActivityIndicator size="large" color="#4caf50" />
      </View>
    );
  }

  console.log("User state in Home:", user, "Me state:", me);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#4caf50', '#388e3c']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerGreeting}>Home</Text>
              <Text style={styles.headerTitle}>HK AppFood</Text>
            </View>
            <TouchableOpacity 
              onPress={() => navigation.navigate("cart")} 
              style={styles.cartButton}
            >
              <ShoppingCart color="#fff" size={26} strokeWidth={2} />
              {/* Badge số lượng sản phẩm */}
              {count > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
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
                <Utensils color="#fff" size={20} strokeWidth={2} />
                <Text style={styles.buttonText}>Đặt ngay</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.heroFeatures}>
              <View style={styles.featureItem}>
                <Truck color="#4caf50" size={24} strokeWidth={2} />
                <Text style={styles.featureText}>Giao tận nơi</Text>
              </View>
              <View style={styles.featureItem}>
                <Salad color="#4caf50" size={24} strokeWidth={2} />
                <Text style={styles.featureText}>100+ món</Text>
              </View>
              <View style={styles.featureItem}>
                <Dumbbell color="#4caf50" size={24} strokeWidth={2} />
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
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>🥗 Dành riêng cho bạn</Text>
            <Text style={styles.sectionSubtitle}>
              {appState === "HAS_PROFILE" 
                ? "Thực đơn được tính toán dựa trên chỉ số cơ thể (TDEE) của bạn." 
                : "Khám phá thực đơn healthy chuẩn khoa học."}
            </Text>
          </View>
          {appState === "NO_PROFILE" && user && (
            <TouchableOpacity 
              style={styles.updateProfileButton}
              onPress={() => navigation.navigate("editprofile")}
            >
              <Text style={styles.updateProfileText}>Cập nhật →</Text>
            </TouchableOpacity>
          )}
        </View>

        {appState === "HAS_PROFILE" && recommended.length > 0 ? (
          <View style={styles.productGrid}>
            {recommended.map((product) => (
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
                  <Heart 
                    color={isFavorite(product.id) ? "#ff5252" : "#9e9e9e"} 
                    fill={isFavorite(product.id) ? "#ff5252" : "transparent"}
                    size={22} 
                    strokeWidth={2} 
                  />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <View style={styles.productInfo}>
                    <View style={styles.productNameRow}>
                      <Text style={styles.productName}>{product.name}</Text>
                      {product.calories && (
                        <View style={styles.caloriesBadge}>
                          <Text style={styles.caloriesText}>{product.calories} kcal</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.productPrice}>{formatVND(product.price)}</Text>
                  </View>
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
            ))}
          </View>
        ) : appState === "NO_PROFILE" && user ? (
          <View style={styles.noProfileCard}>
            <Text style={styles.noProfileIcon}>📊</Text>
            <Text style={styles.noProfileTitle}>Bạn chưa cập nhật thông tin sức khỏe?</Text>
            <Text style={styles.noProfileDesc}>Hãy cho chúng tôi biết Chiều cao, Cân nặng để tính toán Calo phù hợp nhất.</Text>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => navigation.navigate("editprofile")}
            >
              <Text style={styles.buttonText}>Đi đến Hồ sơ cá nhân</Text>
            </TouchableOpacity>
          </View>
        ) : !user ? (
          <View style={styles.noProfileCard}>
            <Text style={styles.noProfileIcon}>🔐</Text>
            <Text style={styles.noProfileTitle}>Đăng nhập để xem gợi ý</Text>
            <Text style={styles.noProfileDesc}>Đăng nhập để nhận được thực đơn phù hợp với cơ thể bạn.</Text>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => navigation.navigate("login")}
            >
              <Text style={styles.buttonText}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {!!categories.length && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh mục nổi bật</Text>
          <View style={styles.grid6}>
            {categories.map(renderCategory)}
          </View>
        </View>
      )}

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
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <HomeIcon color="#ff6b6b" size={24} strokeWidth={2} fill="#ff6b6b" />
          <Text style={[styles.navText, styles.navTextActive]}>Trang chủ</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setIsAdminChatOpen(true)}
        >
          <MessageCircle color="#9e9e9e" size={24} strokeWidth={2} />
          <Text style={styles.navText}>Tư vấn</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("menu")}>
          <Utensils color="#9e9e9e" size={24} strokeWidth={2} />
          <Text style={styles.navText}>Thực đơn</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("profile")}>
          <User color="#9e9e9e" size={24} strokeWidth={2} />
          <Text style={styles.navText}>Hồ sơ</Text>
        </TouchableOpacity>
      </View>

      {/* Admin Chat Widget */}
      {isAdminChatOpen && <AdminChatWidget onClose={() => setIsAdminChatOpen(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8f9fa" },
  
  // Bottom Navigation
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  navText: {
    fontSize: 12,
    color: "#9e9e9e",
    fontWeight: "500",
  },
  navTextActive: {
    color: "#ff6b6b",
    fontWeight: "700",
  },
  offersIconContainer: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  offersIcon: {
    fontSize: 24,
  },
  
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
    color: "#4caf50",
  },
  cartButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#ff5252",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
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
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: "#4caf50",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#4caf50",
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    lineHeight: 18,
  },
  updateProfileButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#4caf50",
    borderRadius: 8,
  },
  updateProfileText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  caloriesBadge: {
    backgroundColor: "#dcfce7",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginLeft: 4,
  },
  caloriesText: {
    color: "#166534",
    fontSize: 10,
    fontWeight: "700",
  },
  noProfileCard: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#bbf7d0",
    borderStyle: "dashed",
  },
  noProfileIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noProfileTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },
  noProfileDesc: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
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
    backgroundColor: "#4caf50",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#4caf50",
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
  planPrice: { fontSize: 16, color: "#4caf50", marginBottom: 12, fontWeight: "700" },
  planButton: {
    padding: 12,
    backgroundColor: "#4caf50",
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
    color: "#4caf50",
    fontWeight: "700",
  },
  cardActions: { padding: 12, paddingTop: 0 },
  actionButton: {
    paddingVertical: 10,
    backgroundColor: "#4caf50",
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
    backgroundColor: "#4caf50",
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#4caf50",
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