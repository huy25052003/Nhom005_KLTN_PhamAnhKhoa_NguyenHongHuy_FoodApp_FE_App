import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { LinearGradient } from "expo-linear-gradient";
import { X, ChevronLeft } from "lucide-react-native";

export default function PayOSWebView() {
  const params = useLocalSearchParams();
  const { paymentUrl, orderId } = params;
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef(null);

  const handleCancel = () => {
    Alert.alert(
      "Xác nhận hủy",
      "Bạn có chắc muốn hủy thanh toán và quay về trang chủ?",
      [
        {
          text: "Không",
          style: "cancel",
        },
        {
          text: "Có",
          onPress: () => router.push("/home"),
          style: "destructive",
        },
      ]
    );
  };

  const handleNavigationStateChange = (navState) => {
    // Kiểm tra nếu URL chứa kết quả thanh toán
    const url = navState.url || "";
    
    // PayOS thường redirect về URL callback sau khi thanh toán
    // Có thể check URL để xác định thanh toán thành công/thất bại
    if (url.includes("status=PAID") || url.includes("success")) {
      // Chuyển sang trang kết quả
      router.replace(`/paymentresult?orderId=${orderId}`);
    } else if (url.includes("status=CANCELLED") || url.includes("cancel")) {
      Alert.alert(
        "Thanh toán đã hủy",
        "Bạn đã hủy thanh toán. Quay về trang chủ?",
        [
          {
            text: "Ở lại",
            style: "cancel",
          },
          {
            text: "Về trang chủ",
            onPress: () => router.push("/home"),
          },
        ]
      );
    }
  };

  if (!paymentUrl) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
        <LinearGradient colors={["#4caf50", "#388e3c"]} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft color="#fff" size={28} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thanh toán PayOS</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không có link thanh toán</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <LinearGradient colors={["#4caf50", "#388e3c"]} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Thanh toán PayOS</Text>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <X color="#fff" size={24} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4caf50" />
          <Text style={styles.loadingText}>Đang tải trang thanh toán...</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: paymentUrl }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={handleNavigationStateChange}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        mixedContentMode="always"
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Quét mã QR hoặc thanh toán trên trang
        </Text>
        <TouchableOpacity style={styles.cancelButtonFooter} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Hủy thanh toán</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    flex: 1,
  },
  cancelButton: {
    padding: 4,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#dc3545",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#4caf50",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#dee2e6",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    textAlign: "center",
  },
  cancelButtonFooter: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
