import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../src/store/auth";
import { useQuery } from "@tanstack/react-query";
import { getProfile, getMe } from "../src/api/user";
import { getMyShipping } from "../src/api/shipping";
import { LinearGradient } from 'expo-linear-gradient';
import { User, MapPin, Lock, Heart, ShoppingBag, LogOut, ChevronRight, Edit, Award, Activity } from 'lucide-react-native';

export default function Profile() {
  const { user, token, clear } = useAuth();
  
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: !!token,
  });

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !!token,
  });

  const { data: shippingData } = useQuery({
    queryKey: ["shipping"],
    queryFn: getMyShipping,
    enabled: !!token,
  });

  // Calculate membership info
  const membershipInfo = useMemo(() => {
    const points = me?.points || 0;
    let rank = "Đồng";
    let icon = "🌱";
    let discount = "1%";
    
    if (points >= 2000) {
      rank = "Kim Cương";
      icon = "💎";
      discount = "10%";
    } else if (points >= 500) {
      rank = "Vàng";
      icon = "🥇";
      discount = "5%";
    } else if (points >= 100) {
      rank = "Bạc";
      icon = "🥈";
      discount = "3%";
    }
    
    return { rank, icon, discount, points };
  }, [me?.points]);

  // Calculate TDEE
  const estimatedTDEE = useMemo(() => {
    if (!profileData?.heightCm || !profileData?.weightKg) return 0;

    const h = Number(profileData.heightCm);
    const w = Number(profileData.weightKg);
    let age = 25;
    
    if (profileData.birthDate) {
      age = new Date().getFullYear() - new Date(profileData.birthDate).getFullYear();
    }
    
    let bmr = (10 * w) + (6.25 * h) - (5 * age);
    bmr += (profileData.gender === "MALE" ? 5 : -161);

    const multipliers = { "SEDENTARY": 1.2, "LIGHT": 1.375, "MODERATE": 1.55, "ACTIVE": 1.725 };
    const maintenance = Math.round(bmr * (multipliers[profileData.activityLevel] || 1.2));

    if (profileData.goal === "LOSE") return Math.max(1200, maintenance - 500);
    if (profileData.goal === "GAIN") return maintenance + 500;
    return maintenance;
  }, [profileData]);

  const handleLogout = () => {
    clear();
    router.replace("/login");
  };

  const MenuItem = ({ icon: Icon, title, onPress, color = "#4caf50" }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIcon, { backgroundColor: color + '20' }]}>
          <Icon color={color} size={22} strokeWidth={2} />
        </View>
        <Text style={styles.menuText}>{title}</Text>
      </View>
      <ChevronRight color="#9e9e9e" size={20} strokeWidth={2} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      {/* Header với Avatar */}
      <LinearGradient colors={['#4caf50', '#388e3c']} style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <User color="#fff" size={48} strokeWidth={2} />
          </View>
        </View>
        <Text style={styles.userName}>{me?.username || user?.username || "Người dùng"}</Text>
        <Text style={styles.userEmail}>{me?.email || user?.email || "user@foodapp.vn"}</Text>
      </LinearGradient>

      {/* Danh sách menu */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Thông tin cá nhân */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <View style={styles.menuContainer}>
            <MenuItem 
              icon={User} 
              title="Chỉnh sửa hồ sơ" 
              onPress={() => router.push("/editprofile")}
              color="#4caf50"
            />
            <MenuItem 
              icon={Lock} 
              title="Đổi mật khẩu" 
              onPress={() => router.push("/changepassword")}
              color="#ff9800"
            />
          </View>
        </View>

        {/* Đơn hàng & Yêu thích */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mua sắm</Text>
          <View style={styles.menuContainer}>
            <MenuItem 
              icon={ShoppingBag} 
              title="Đơn hàng của tôi" 
              onPress={() => router.push("/order")}
              color="#9c27b0"
            />
            <MenuItem 
              icon={Heart} 
              title="Món yêu thích" 
              onPress={() => router.push("/favorites")}
              color="#f44336"
            />
          </View>
        </View>

        {/* Nút đăng xuất */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut color="#f44336" size={22} strokeWidth={2} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#e8f5e9",
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#f44336",
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f44336",
  },
});
