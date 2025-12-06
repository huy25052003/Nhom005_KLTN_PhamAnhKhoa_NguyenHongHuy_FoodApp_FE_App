import React, { useState, useCallback } from "react";
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  Alert, RefreshControl, StatusBar, Linking, Platform 
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { useAuth } from "../../src/store/auth";
import { getShipperOrders, pickUpOrder, completeOrder } from "../../src/api/shipper";
import { LogOut, MapPin, Phone, Package, Navigation, User } from "lucide-react-native";

export default function ShipperDashboard() {
  const [activeTab, setActiveTab] = useState("NEW"); // NEW: Chờ nhận | MY: Đang giao
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const setAuth = useAuth((s) => s.setAuth);

  // 1. Load dữ liệu từ API
  const fetchData = async () => {
    setLoading(true);
    try {
      // NEW -> Lấy CONFIRMED (đã xác nhận/nấu xong)
      // MY -> Lấy DELIVERING (đang giao)
      const status = activeTab === "NEW" ? "CONFIRMED" : "DELIVERING";
      const data = await getShipperOrders(status);
      
      // Lọc lại client-side cho chắc chắn
      const filtered = (Array.isArray(data) ? data : []).filter(o => o.status === status);
      setOrders(filtered.reverse()); // Đảo ngược để thấy đơn mới nhất
    } catch (e) {
      console.log("Shipper fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [activeTab])
  );

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đồng ý", onPress: () => { setAuth(null, null); router.replace("/login"); } }
    ]);
  };

  // 2. Chức năng Gọi điện
  const handleCall = (phone) => {
    if (!phone) return Alert.alert("Lỗi", "Không có số điện thoại khách hàng");
    let p = phone.replace(/[^\d+]/g, ''); 
    Linking.openURL(`tel:${p}`);
  };

  // 3. Chức năng Mở Bản đồ
  const handleMap = (address) => {
    if (!address || address === "Đến cửa hàng lấy thông tin") {
      return Alert.alert("Lỗi", "Không có địa chỉ giao hàng cụ thể");
    }
    const query = encodeURIComponent(address);
    const scheme = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
    });
    const webUrl = `http://googleusercontent.com/maps.google.com/maps?q=${query}`;

    Linking.canOpenURL(scheme).then(supported => {
      if (supported) return Linking.openURL(scheme);
      return Linking.openURL(webUrl);
    }).catch(() => Linking.openURL(webUrl));
  };

  // 4. Xử lý Hành động (Nhận đơn / Hoàn tất)
  const onAction = async (item) => {
    try {
      if (activeTab === "NEW") {
        await pickUpOrder(item.id);
        Alert.alert("Thành công", "Đã nhận đơn hàng! Chuyển sang tab Đang giao.");
        setActiveTab("MY");
      } else {
        Alert.alert("Xác nhận", "Đã giao hàng và nhận tiền thành công?", [
          { text: "Chưa", style: "cancel" },
          { 
            text: "Đã giao xong", 
            onPress: async () => {
              await completeOrder(item.id);
              fetchData(); // Reload lại danh sách
            }
          }
        ]);
      }
    } catch (e) {
      Alert.alert("Lỗi", "Thao tác thất bại. Vui lòng thử lại.");
    }
  };

  const renderItem = ({ item }) => {
    // Lấy thông tin hiển thị an toàn
    const shipInfo = item.shipping || {};
    const customerName = item.user?.username || "Khách hàng";
    const phone = shipInfo.phone || item.user?.phone || "";
    
    // Xử lý địa chỉ: Ưu tiên dùng addressLine đầy đủ
    let address = shipInfo.addressLine || "";
    if (shipInfo.city && !address.includes(shipInfo.city)) {
        address += `, ${shipInfo.city}`;
    }
    if (!address) address = "Đến cửa hàng lấy thông tin";

    return (
      <View style={styles.card}>
        {/* Header Card */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>Đơn #{item.id}</Text>
            <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
          </View>
          <View style={{alignItems: 'flex-end'}}>
            <Text style={styles.priceText}>{(item.total || 0).toLocaleString('vi-VN')} đ</Text>
            <Text style={styles.paymentMethod}>{item.paymentMethod || "COD"}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Thông tin Giao hàng */}
        <View style={styles.cardBody}>
          <View style={styles.row}>
            <User size={18} color="#666" style={{marginTop: 2}} />
            <Text style={styles.customerName}>{customerName}</Text>
          </View>

          <View style={styles.row}>
            <MapPin size={18} color="#e65100" style={{marginTop: 2}} />
            <Text style={styles.addressText}>{address}</Text>
          </View>

          <View style={styles.row}>
            <Package size={18} color="#666" style={{marginTop: 2}} />
            <Text style={styles.itemsText}>
              {item.items?.map(i => `${i.product?.name} (x${i.quantity})`).join(", ")}
            </Text>
          </View>
        </View>

        {/* Các nút gọi điện / chỉ đường (chỉ hiện khi đang giao) */}
        {activeTab === "MY" && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => handleCall(phone)}>
              <Phone size={20} color="#fff" />
              <Text style={styles.iconBtnText}>Gọi điện</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#2196f3' }]} onPress={() => handleMap(address)}>
              <Navigation size={20} color="#fff" />
              <Text style={styles.iconBtnText}>Chỉ đường</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Nút hành động chính */}
        <TouchableOpacity 
          style={[
            styles.mainBtn, 
            activeTab === "NEW" ? styles.btnGreen : styles.btnOrange
          ]}
          onPress={() => onAction(item)}
        >
          <Text style={styles.mainBtnText}>
            {activeTab === "NEW" ? "NHẬN ĐƠN NÀY" : "XÁC NHẬN HOÀN TẤT"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ef6c00" />
      
      {/* App Bar */}
      <View style={styles.appBar}>
        <Text style={styles.appTitle}>Tài Xế FoodApp 🛵</Text>
        <TouchableOpacity onPress={handleLogout}>
          <LogOut color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "NEW" && styles.activeTab]} 
          onPress={() => setActiveTab("NEW")}
        >
          <Text style={[styles.tabText, activeTab === "NEW" && styles.activeTabText]}>
            Chờ nhận ({activeTab === "NEW" ? orders.length : "?"})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === "MY" && styles.activeTab]} 
          onPress={() => setActiveTab("MY")}
        >
          <Text style={[styles.tabText, activeTab === "MY" && styles.activeTabText]}>
            Đang giao ({activeTab === "MY" ? orders.length : "?"})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách đơn */}
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} colors={["#ef6c00"]} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyView}>
              <Package size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                {activeTab === "NEW" ? "Hiện không có đơn nào cần giao" : "Bạn chưa nhận đơn nào"}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  appBar: {
    backgroundColor: "#ef6c00",
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
  },
  appTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  
  tabsContainer: { flexDirection: "row", backgroundColor: "#fff", elevation: 2 },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 3, borderBottomColor: "transparent" },
  activeTab: { borderBottomColor: "#ef6c00" },
  tabText: { fontSize: 15, fontWeight: "600", color: "#888" },
  activeTabText: { color: "#ef6c00" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width:0, height:2 }
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  orderId: { fontSize: 16, fontWeight: "700", color: "#333" },
  timeText: { fontSize: 13, color: "#888", marginTop: 2 },
  priceText: { fontSize: 18, fontWeight: "700", color: "#2e7d32" },
  paymentMethod: { fontSize: 12, color: "#ef6c00", fontWeight: "600", textAlign: "right" },
  
  divider: { height: 1, backgroundColor: "#eee", marginBottom: 12 },
  
  cardBody: { marginBottom: 12 },
  row: { flexDirection: "row", marginBottom: 8, alignItems: 'flex-start' },
  customerName: { fontSize: 15, fontWeight: "600", color: "#333", marginLeft: 10, flex: 1 },
  addressText: { fontSize: 16, fontWeight: "500", color: "#333", marginLeft: 10, flex: 1, lineHeight: 22 },
  itemsText: { fontSize: 14, color: "#666", marginLeft: 10, flex: 1, fontStyle: 'italic' },

  actionRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  iconBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#4caf50",
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 6
  },
  iconBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  mainBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4
  },
  btnGreen: { backgroundColor: "#2e7d32" },
  btnOrange: { backgroundColor: "#ef6c00" },
  mainBtnText: { color: "#fff", fontSize: 16, fontWeight: "800", textTransform: "uppercase" },

  emptyView: { alignItems: "center", marginTop: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: "#888" }
});