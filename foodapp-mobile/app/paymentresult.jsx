import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { getOrderById } from "../src/api/order";
import { clearCart, getCart } from "../src/api/cart";
import { useCart } from "../src/store/cart";

const OK_ORDER_STATUSES = ["PAID", "CONFIRMED", "PREPARING", "DELIVERING", "DONE"];
const BAD_ORDER_STATUSES = ["CANCELLED", "CANCELED", "FAILED"];

export default function PaymentResult() {
  const params = useLocalSearchParams();
  const { setCount } = useCart();
  
  const { orderId, paymentUrl } = params;
  
  const [state, setState] = useState({
    loading: true,
    msg: "Đang kiểm tra thanh toán…",
    orderId: null,
    status: null,
    hintOk: false,
  });

  const timer = useRef(null);
  const hasOpenedPayment = useRef(false);

  useEffect(() => {
    // Mở link thanh toán PayOS nếu có
    if (paymentUrl && !hasOpenedPayment.current) {
      hasOpenedPayment.current = true;
      Linking.openURL(paymentUrl).catch((err) => {
        console.error("Không thể mở link thanh toán:", err);
        Alert.alert("Lỗi", "Không thể mở trang thanh toán. Vui lòng thử lại.");
      });
    }

    if (!orderId) {
      setState({
        loading: false,
        msg: "Không xác định được đơn vừa thanh toán.",
        orderId: null,
        status: null,
        hintOk: false,
      });
      return;
    }

    setState((prev) => ({
      ...prev,
      orderId,
      msg: "Đang kiểm tra thanh toán…",
    }));

    let stopped = false;
    let tries = 0;

    async function poll() {
      if (stopped) return;
      tries++;

      try {
        const order = await getOrderById(orderId);
        const st = (order?.status || "").toUpperCase();

        // Nếu BE đã đổi sang các trạng thái OK -> clear giỏ, kết thúc
        if (OK_ORDER_STATUSES.includes(st)) {
          try {
            await clearCart();
            const c = await getCart();
            const items = c?.items || c?.cartItems || [];
            setCount(items.reduce((s, it) => s + (it?.quantity || 0), 0));
          } catch {
            // ignore
          }

          setState({
            loading: false,
            msg: "Thanh toán thành công!",
            orderId,
            status: st,
            hintOk: true,
          });
          return;
        }

        // Nếu BE trả trạng thái xấu -> báo lỗi
        if (BAD_ORDER_STATUSES.includes(st)) {
          setState({
            loading: false,
            msg: "Thanh toán không thành công hoặc đã huỷ.",
            orderId,
            status: st,
            hintOk: false,
          });
          return;
        }

        // Vẫn PENDING: tiếp tục chờ thêm
        if (tries >= 40) {
          setState({
            loading: false,
            msg: "Đang chờ xác nhận thanh toán. Vui lòng kiểm tra lại sau ít phút.",
            orderId,
            status: st || "PENDING",
            hintOk: false,
          });
          return;
        }

        timer.current = setTimeout(poll, 1500);
      } catch (e) {
        // Gặp lỗi tạm thời -> thử lại vài lần
        if (tries >= 8) {
          setState({
            loading: false,
            msg: e?.response?.data?.message || e?.message || "Không kiểm tra được trạng thái đơn.",
            orderId,
            status: null,
            hintOk: false,
          });
          return;
        }
        timer.current = setTimeout(poll, 1500);
      }
    }

    poll();

    return () => {
      stopped = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [orderId, paymentUrl]);

  const ok = state.hintOk || OK_ORDER_STATUSES.includes((state.status || "").toUpperCase());

  const handleGoHome = () => {
    router.push("/home");
  };

  const handleViewOrders = () => {
    // Assuming you have an orders page, adjust the route name as needed
    router.push("/orders");
  };

  const handleRetryPayment = () => {
    if (paymentUrl) {
      Linking.openURL(paymentUrl).catch((err) => {
        console.error("Không thể mở link thanh toán:", err);
        Alert.alert("Lỗi", "Không thể mở trang thanh toán. Vui lòng thử lại.");
      });
    }
  };

  if (state.loading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.title}>
            {state.hintOk ? "✅ Đã thanh toán — đang xác nhận" : "⏳ Đang kiểm tra thanh toán"}
          </Text>
          <Text style={styles.message}>{state.msg}</Text>
          {state.orderId && (
            <Text style={styles.orderInfo}>
              Mã đơn: <Text style={styles.orderId}>{state.orderId}</Text>
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.icon, ok ? styles.successIcon : styles.errorIcon]}>
          {ok ? "✅" : "❌"}
        </Text>
        
        <Text style={[styles.title, ok ? styles.successTitle : styles.errorTitle]}>
          {ok ? "Thanh toán thành công!" : "Thanh toán chưa thành công"}
        </Text>
        
        <Text style={styles.message}>{state.msg}</Text>
        
        {state.orderId && (
          <Text style={styles.orderInfo}>
            Mã đơn: <Text style={styles.orderId}>{state.orderId}</Text>
          </Text>
        )}

        <View style={styles.buttonContainer}>
          {ok ? (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={handleViewOrders}>
                <Text style={styles.primaryButtonText}>Xem đơn hàng</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
                <Text style={styles.secondaryButtonText}>Về trang chủ</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {paymentUrl && (
                <TouchableOpacity style={styles.primaryButton} onPress={handleRetryPayment}>
                  <Text style={styles.primaryButtonText}>Thử lại thanh toán</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/cart")}>
                <Text style={styles.secondaryButtonText}>Quay lại giỏ hàng</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
                <Text style={styles.secondaryButtonText}>Về trang chủ</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    margin: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 300,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  successIcon: {
    color: "#28a745",
  },
  errorIcon: {
    color: "#dc3545",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  successTitle: {
    color: "#28a745",
  },
  errorTitle: {
    color: "#dc3545",
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  orderInfo: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 24,
  },
  orderId: {
    fontWeight: "700",
    color: "#007bff",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#007bff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  secondaryButtonText: {
    color: "#6c757d",
    fontWeight: "600",
    fontSize: 16,
  },
});