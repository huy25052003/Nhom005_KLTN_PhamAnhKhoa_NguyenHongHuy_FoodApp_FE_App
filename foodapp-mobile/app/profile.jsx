import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../src/store/auth";
import { useMe } from "../src/api/hooks";
import { LinearGradient } from 'expo-linear-gradient';
import { User, MapPin, Lock, Heart, ShoppingBag, LogOut, ChevronRight, Settings } from 'lucide-react-native';

export default function Profile() {
  const { user, clear } = useAuth();
  const { data: me } = useMe();

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

        {/* Cài đặt */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Khác</Text>
          <View style={styles.menuContainer}>
            <MenuItem 
              icon={Settings} 
              title="Cài đặt" 
              onPress={() => {}}
              color="#607d8b"
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
