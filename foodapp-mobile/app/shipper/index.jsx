import React, { useState, useCallback, useEffect, useRef } from "react";
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  Alert, RefreshControl, StatusBar, Linking, Platform 
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { useAuth } from "../../src/store/auth"; 
import { getShipperOrders, completeOrder } from "../../src/api/shipper";
import { LogOut, MapPin, Phone, Package, User, Navigation } from "lucide-react-native";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export default function ShipperDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const stompClientRef = useRef(null);
  
  const auth = useAuth(s => s.auth);
  const setAuth = useAuth(s => s.setAuth);
  
  // Trạng thái đơn hàng cần lấy: DELIVERING (Sẵn sàng giao, không cần nhận)
  const STATUS_TO_FETCH = "DELIVERING";

  // Hàm fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getShipperOrders(STATUS_TO_FETCH);
      const filtered = (Array.isArray(data) ? data : []).filter(o => o.status === STATUS_TO_FETCH);
      setOrders(filtered.reverse());
      console.log("✅ Fetched shipper orders:", filtered.length);
    } catch (e) {
      console.log("❌ Shipper fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch khi vào màn hình
  useFocusEffect(
    useCallback(() => {
      fetchData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // WebSocket - Nhận notification real-time từ admin
  useEffect(() => {
    if (!auth?.token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS("https://foodappsv.id.vn/ws"),
      connectHeaders: {
        Authorization: `Bearer ${auth.token}`
      },
      debug: (str) => {
        console.log("🔌 STOMP:", str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log("✅ WebSocket connected (Shipper)");
      
      // Subscribe /topic/admin/orders - Nhận khi có đơn mới hoặc cập nhật
      client.subscribe('/topic/admin/orders', (message) => {
        console.log("📦 Received from /topic/admin/orders");
        refreshOrders();
      });
      
      // Subscribe /topic/kitchen/update - Nhận khi bếp finish order → DELIVERING
      client.subscribe('/topic/kitchen/update', (message) => {
        console.log("📦 Received from /topic/kitchen/update");
        refreshOrders();
      });
      
      console.log("✅ Subscribed to topics");
    };
    
    // Hàm refresh danh sách
    const refreshOrders = () => {
      getShipperOrders(STATUS_TO_FETCH)
        .then(data => {
          const filtered = (Array.isArray(data) ? data : []).filter(o => o.status === STATUS_TO_FETCH);
          setOrders(filtered.reverse());
          console.log("✅ Updated orders from WebSocket:", filtered.length);
        })
        .catch(e => {
          console.log("❌ Error fetching after notification:", e);
        });
    };

    client.onStompError = (frame) => {
      console.error("❌ STOMP error:", frame.headers?.message);
    };

    client.onDisconnect = () => {
      console.log("🔌 WebSocket disconnected (Shipper)");
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
        console.log("🔌 WebSocket cleanup");
      }
    };
  }, [auth?.token, STATUS_TO_FETCH]);

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đồng ý", onPress: () => { setAuth(null, null); router.replace("/login"); } }
    ]);
  };

  // Chức năng Gọi điện
  const handleCall = (phone) => {
    if (!phone) return Alert.alert("Lỗi", "Không có số điện thoại khách hàng.");
    let p = phone.replace(/[^\d+]/g, ''); 
    Linking.openURL(`tel:${p}`);
  };

  // Chức năng Mở Bản đồ
  const handleMap = (address) => {
    if (!address || address === "Đến cửa hàng lấy thông tin") {
      return Alert.alert("Lỗi", "Không có địa chỉ giao hàng cụ thể.");
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
  
  // Xử lý hành động "Hoàn thành đơn" (chuyển từ DELIVERING -> DONE)
  const onComplete = (item) => {
    Alert.alert("Xác nhận hoàn tất", "Bạn đã giao hàng và nhận tiền thành công?", [
      { text: "Chưa", style: "cancel" },
      { 
        text: "Đã giao xong", 
        onPress: async () => {
          try {
            await completeOrder(item.id);
            Alert.alert("Thành công", "Đơn hàng đã hoàn tất.");
            fetchData(); // Reload lại danh sách (sẽ không còn đơn này)
          } catch (e) {
            Alert.alert("Lỗi", e?.response?.data?.message || e?.message || "Thao tác thất bại. Vui lòng thử lại.");
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => {
    const shipInfo = item.shipping || {};
    const customerName = item.user?.username || "Khách hàng";
    const phone = shipInfo.phone || item.user?.phone || "";
    
    let address = shipInfo.addressLine || "";
    if (shipInfo.city && !address.includes(shipInfo.city)) {
        address += `, ${shipInfo.city}`;
    }
    if (!address) address = "Đến cửa hàng lấy thông tin";

    return (
      <View style={styles.card}>
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

        <View style={styles.cardBody}>
          <View style={styles.row}>
            <User size={18} color="#666" style={{marginTop: 2}} />
            <Text style={styles.customerName}>{customerName}</Text>
          </View>
          
          {/* Hiển thị SĐT và Địa chỉ chi tiết */}
          <View style={styles.row}>
            <Phone size={18} color="#4caf50" style={{marginTop: 2}} />
            <Text style={styles.addressText}>{phone || 'Chưa có SĐT'}</Text>
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
        
        {/* Nút Gọi điện và Chỉ đường */}
        <View style={styles.actionRow}>
            <TouchableOpacity style={styles.iconBtnCall} onPress={() => handleCall(phone)}>
              <Phone size={20} color="#fff" />
              <Text style={styles.iconBtnText}>Gọi điện</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.iconBtnMap} onPress={() => handleMap(address)}>
              <Navigation size={20} color="#fff" />
              <Text style={styles.iconBtnText}>Chỉ đường</Text>
            </TouchableOpacity>
        </View>

        {/* Nút hành động chính: Giao hàng thành công */}
        <TouchableOpacity 
          style={[styles.mainBtn, styles.btnOrange]}
          onPress={() => onComplete(item)}
        >
          <Text style={styles.mainBtnText}>GIAO HÀNG THÀNH CÔNG</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      
      {/* App Bar */}
      <View style={styles.appBar}>
        <Text style={styles.appTitle}>Đơn hàng cần giao ({orders.length})</Text>
        <TouchableOpacity onPress={handleLogout}>
          <LogOut color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      {/* Danh sách đơn */}
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} colors={["#4caf50"]} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyView}>
              <Package size={64} color="#ccc" />
              <Text style={styles.emptyText}>Hiện không có đơn nào cần giao</Text>
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
    backgroundColor: "#4caf50",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
  },
  appTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  
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
  iconBtnCall: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#4caf50", // Xanh lá cho Gọi điện
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 6
  },
  iconBtnMap: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#2196f3", // Xanh dương cho Chỉ đường
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
  btnOrange: { backgroundColor: "#ef6c00" }, // Cam cho nút Hoàn thành
  mainBtnText: { color: "#fff", fontSize: 16, fontWeight: "800", textTransform: "uppercase" },

  emptyView: { alignItems: "center", marginTop: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: "#888" }
});