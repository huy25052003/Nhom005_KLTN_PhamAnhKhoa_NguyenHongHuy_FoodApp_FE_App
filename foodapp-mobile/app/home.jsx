import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation } from "expo-router";
import { useAuth } from "../src/store/auth";
import { useCart } from "../src/store/cart";
import { getFeaturedProducts, getCategoriesPublic } from "../src/api/public";
import { addToCart, getCart } from "../src/api/cart";
import { useMe } from "../src/api/hooks";

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

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          getFeaturedProducts(8),
          getCategoriesPublic(6),
        ]);
        setProducts(Array.isArray(prodRes) ? prodRes : []);
        setCategories(Array.isArray(catRes) ? catRes : []);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {me?.username || (typeof user === "string" ? `Xin chào, ${user}!` : user?.username ? `Xin chào, ${user.username}!` : "Xin chào, Khách!")}
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity onPress={handleShippingInfo} style={styles.shippingButton}>
            <Text style={styles.shippingText}>Thông tin giao hàng</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Kế hoạch bữa ăn hàng tuần cho lối sống lành mạnh</Text>
        <Text style={styles.heroSubtitle}>Trải nghiệm bữa ăn sạch tươi ngon, giàu dinh dưỡng — lên plan theo mục tiêu của bạn.</Text>
        <View style={styles.heroActions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("order")}
          >
            <Text style={styles.buttonText}>Đặt ngay</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostButton}>
            <Text style={styles.ghostButtonText}>Tư vấn</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.heroUsps}>
          <Text style={styles.uspItem}>• Giao tận nơi mỗi ngày</Text>
          <Text style={styles.uspItem}>• Thực đơn đa dạng 100+ món</Text>
          <Text style={styles.uspItem}>• Tuỳ chỉnh theo mục tiêu (giảm cân / tăng cơ / eat clean)</Text>
        </View>
      </View>

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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#333" },
  logoutButton: { padding: 8, backgroundColor: "#dc3545", borderRadius: 6 },
  logoutText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  shippingButton: { padding: 8, backgroundColor: "#0a7", borderRadius: 6 },
  shippingText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  hero: { padding: 16, backgroundColor: "#fff" },
  heroTitle: { fontSize: 24, fontWeight: "700", color: "#333", marginBottom: 12 },
  heroSubtitle: { fontSize: 16, color: "#666", marginBottom: 16 },
  heroActions: { flexDirection: "row", marginBottom: 16 },
  primaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#007bff",
    borderRadius: 6,
    marginRight: 12,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  ghostButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "#007bff",
    borderRadius: 6,
  },
  ghostButtonText: { color: "#007bff", fontWeight: "600", fontSize: 16 },
  heroUsps: { paddingTop: 8 },
  uspItem: { fontSize: 14, color: "#666", marginBottom: 8 },
  section: { padding: 16 },
  sectionAlt: { backgroundColor: "#f8f8f8" },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#333", marginBottom: 12 },
  howtoGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  howtoItem: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  howtoStep: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  howtoStepText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  howtoText: { fontSize: 14, color: "#333", textAlign: "center" },
  grid4: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  grid6: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  planCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#007bff",
    color: "#fff",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontSize: 12,
  },
  planName: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 4 },
  planDesc: { fontSize: 14, color: "#666", marginBottom: 8 },
  planPrice: { fontSize: 14, color: "#007bff", marginBottom: 8 },
  planButton: { padding: 10, backgroundColor: "#007bff", borderRadius: 6, alignItems: "center" },
  planButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  categoryCard: {
    width: "32%",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryName: { fontSize: 14, fontWeight: "600", color: "#333" },
  productCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: { width: "100%", height: 180, borderRadius: 8, marginBottom: 8 },
  productInfo: { marginBottom: 8 },
  productName: { fontSize: 14, fontWeight: "600", color: "#333" },
  productPrice: { fontSize: 14, color: "#007bff" },
  cardActions: { flexDirection: "row", justifyContent: "space-between" },
  actionButton: {
    flex: 1,
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 6,
    alignItems: "center",
    marginRight: 6,
  },
  actionText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  ghostButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#007bff",
    borderRadius: 6,
    alignItems: "center",
  },
  ghostButtonText: { color: "#007bff", fontWeight: "600", fontSize: 14 },
  grid3: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  ecoCard: {
    width: "32%",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ecoText: { fontSize: 14, fontWeight: "600", color: "#333", textAlign: "center" },
  logoRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  logoBox: {
    width: "18%",
    height: 60,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaButton: { padding: 12, backgroundColor: "#007bff", borderRadius: 6, alignItems: "center" },
  ctaText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  mutedText: { fontSize: 14, color: "#666", textAlign: "center", width: "100%" },
});