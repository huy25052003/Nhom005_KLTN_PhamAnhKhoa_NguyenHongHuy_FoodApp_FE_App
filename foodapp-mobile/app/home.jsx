import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "../src/store/auth";
import { getFeaturedProducts, getCategoriesPublic } from "../src/api/public";
import { useNavigation } from "expo-router";

export default function Home() {
  const { user, clear } = useAuth();
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          getFeaturedProducts(6), // Lấy 6 sản phẩm nổi bật
          getCategoriesPublic(4), // Lấy 4 danh mục
        ]);
        setProducts(prodRes);
        setCategories(catRes);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const renderProduct = (product) => (
    <TouchableOpacity
      key={product.id}
      style={styles.productCard}
      onPress={() => navigation.navigate("product", { id: product.id })}
    >
      <Image
        source={{ uri: product.image || "https://via.placeholder.com/150" }}
        style={styles.productImage}
      />
      <Text style={styles.productName}>{product.name}</Text>
      <Text style={styles.productPrice}>{product.price.toLocaleString("vi-VN")} VNĐ</Text>
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

  const handleLogout = () => {
    clear(); // Xóa trạng thái xác thực
    navigation.replace("login"); // Chuyển hướng về trang đăng nhập
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Xin chào, {user?.username || "Khách"}!</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Khám phá thực đơn</Text>
        <Text style={styles.sectionSubtitle}>Thực phẩm lành mạnh, giao hàng nhanh chóng!</Text>
      </View>

      {/* Featured Products */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sản phẩm nổi bật</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productList}>
          {products.map(renderProduct)}
        </ScrollView>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danh mục</Text>
        <View style={styles.categoryList}>
          {categories.map(renderCategory)}
        </View>
      </View>

      {/* Call to Action */}
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
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  },
  logoutButton: {
    padding: 8,
    backgroundColor: "#dc3545",
    borderRadius: 8,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  productList: {
    flexDirection: "row",
    paddingVertical: 8,
  },
  productCard: {
    width: 150,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  productPrice: {
    fontSize: 12,
    color: "#007bff",
  },
  categoryList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryCard: {
    flex: 1,
    minWidth: "45%",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
  },
  ctaButton: {
    padding: 12,
    backgroundColor: "#007bff",
    borderRadius: 8,
    alignItems: "center",
  },
  ctaText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});