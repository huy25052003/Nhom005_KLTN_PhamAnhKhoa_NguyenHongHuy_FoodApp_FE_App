import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getCategoryProducts, getCategoriesPublic } from "../src/api/public";
import { addToCart, getCart } from "../src/api/cart";
import { useAuth } from "../src/store/auth";
import { useCart } from "../src/store/cart";

const formatVND = (n) => Number(n || 0).toLocaleString("vi-VN") + " VNĐ";

export default function Category() {
  const { id } = useLocalSearchParams(); // Lấy categoryId từ tham số tìm kiếm
  const [catName, setCatName] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
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
        const [cats, products] = await Promise.all([
          getCategoriesPublic(100).catch(() => []),
          getCategoryProducts(id, 80),
        ]);
        if (!stop) {
          setItems(Array.isArray(products) ? products : []);
          const cat = (cats || []).find((c) => String(c.id) === String(id));
          setCatName(cat?.name || `Danh mục #${id}`);
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
  }, [id]);

  async function onAdd(product) {
    if (!token) {
      router.push("/login?redirect=/cart");
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
      <Text style={styles.productName}>{product.name}</Text>
      <Text style={styles.productPrice}>{formatVND(product.price)}</Text>
      <TouchableOpacity style={styles.addButton} onPress={() => onAdd(product)}>
        <Text style={styles.addButtonText}>Thêm vào giỏ</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.detailButton}
        onPress={() => router.push(`/product?id=${product.id}`)}
      >
        <Text style={styles.detailButtonText}>Xem chi tiết</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (!id) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Không tìm thấy danh mục.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{catName}</Text>
        <TouchableOpacity onPress={() => router.push("/home")} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Về trang chủ</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.productList}>
        {items.length ? (
          items.map(renderProduct)
        ) : (
          <Text style={styles.emptyText}>Chưa có sản phẩm trong danh mục này.</Text>
        )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
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
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007bff",
  },
  productList: {
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  productCard: {
    width: "47%",
    marginBottom: 12,
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
    height: 120,
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
    marginVertical: 4,
  },
  addButton: {
    padding: 8,
    backgroundColor: "#007bff",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  detailButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#007bff",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  detailButtonText: {
    color: "#007bff",
    fontWeight: "600",
    fontSize: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
  },
});