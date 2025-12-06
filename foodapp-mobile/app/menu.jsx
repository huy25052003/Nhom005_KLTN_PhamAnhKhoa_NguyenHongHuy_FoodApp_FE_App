import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { getCategoriesPublic } from "../src/api/public";
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft, 
  ShoppingCart, 
  Pizza, 
  Coffee, 
  Salad, 
  Cookie, 
  IceCream, 
  Sandwich,
  ChefHat,
  Utensils,
  AlertCircle 
} from 'lucide-react-native';
import { useCart } from "../src/store/cart";

// Icon map cho từng loại danh mục
const getCategoryIcon = (categoryName) => {
  const name = categoryName?.toLowerCase() || "";
  if (name.includes("pizza") || name.includes("bánh")) return Pizza;
  if (name.includes("coffee") || name.includes("cà phê") || name.includes("nước")) return Coffee;
  if (name.includes("salad") || name.includes("rau")) return Salad;
  if (name.includes("cookie") || name.includes("bánh quy")) return Cookie;
  if (name.includes("ice") || name.includes("kem")) return IceCream;
  if (name.includes("sandwich") || name.includes("bánh mì")) return Sandwich;
  if (name.includes("món chính") || name.includes("cơm")) return ChefHat;
  return Utensils; // Default icon
};

export default function Menu() {
  const router = useRouter();
  const { count } = useCart();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stop = false;
    (async () => {
      setLoading(true);
      try {
        const cats = await getCategoriesPublic(100);
        if (!stop) {
          setCategories(Array.isArray(cats) ? cats : []);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, []);

  const renderCategory = (category) => {
    const IconComponent = getCategoryIcon(category.name);
    
    return (
      <TouchableOpacity
        key={category.id}
        style={styles.categoryCard}
        onPress={() => router.push(`/category?id=${category.id}`)}
      >
        {category.imageUrl ? (
          <View style={styles.categoryImageContainer}>
            <Image
              source={{ uri: category.imageUrl }}
              style={styles.categoryImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.categoryImageOverlay}
            />
          </View>
        ) : (
          <LinearGradient
            colors={['#4caf50', '#66bb6a']}
            style={styles.categoryImagePlaceholder}
          >
            <IconComponent color="#fff" size={40} strokeWidth={2} />
          </LinearGradient>
        )}
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName} numberOfLines={2}>{category.name}</Text>
          {category.description && (
            <Text style={styles.categoryDescription} numberOfLines={2}>
              {category.description}
            </Text>
          )}
        </View>
        <View style={styles.categoryArrow}>
          <ChevronLeft color="#4caf50" size={20} strokeWidth={2.5} style={{ transform: [{ rotate: '180deg' }] }} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
        <LinearGradient
          colors={['#4caf50', '#388e3c']}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft color="#fff" size={28} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thực đơn</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4caf50" />
          <Text style={styles.mutedText}>Đang tải danh mục...</Text>
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color="#fff" size={28} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thực đơn</Text>
        <TouchableOpacity onPress={() => router.push("/cart")} style={styles.cartButton}>
          <ShoppingCart color="#fff" size={24} strokeWidth={2} />
          {count > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{count}</Text>
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>
      
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Khám phá thực đơn</Text>
          <Text style={styles.introSubtitle}>
            Chọn danh mục để xem các món ăn ngon và bổ dưỡng
          </Text>
        </View>

        <View style={styles.categoryGrid}>
          {categories.length ? (
            categories.map(renderCategory)
          ) : (
            <View style={styles.emptyState}>
              <AlertCircle color="#999" size={48} strokeWidth={1.5} />
              <Text style={styles.emptyText}>Chưa có danh mục nào</Text>
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
    paddingTop: 48,
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
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#ff6b6b",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  mutedText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  scrollContent: {
    flex: 1,
  },
  intro: {
    padding: 20,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 12,
  },
  categoryCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  categoryImageContainer: {
    position: "relative",
  },
  categoryImage: {
    width: "100%",
    height: 140,
    backgroundColor: "#f0f0f0",
  },
  categoryImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  categoryImagePlaceholder: {
    width: "100%",
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryInfo: {
    padding: 14,
    paddingBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 4,
    lineHeight: 22,
  },
  categoryDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  categoryArrow: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "#e8f5e9",
    borderRadius: 20,
    padding: 6,
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
});
