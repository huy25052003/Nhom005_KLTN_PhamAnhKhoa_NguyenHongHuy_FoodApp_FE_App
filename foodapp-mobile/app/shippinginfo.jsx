import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, StyleSheet, StatusBar } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyShipping, upsertMyShipping } from "../src/api/shipping";
import { useAuth } from "../src/store/auth";
import { LinearGradient } from 'expo-linear-gradient';

export default function ShippingInfo() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { redirect } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    phone: "",
    addressLine: "",
    city: "",
  });
  const [msg, setMsg] = useState("");

  const { data: shippingData } = useQuery({
    queryKey: ["shipping"],
    queryFn: getMyShipping,
    enabled: !!token,
  });

  useEffect(() => {
    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent(redirect || "/shippinginfo")}`);
      return;
    }
    setLoading(true);
    if (shippingData) {
      setForm({
        phone: shippingData.phone || "",
        addressLine: shippingData.addressLine || "",
        city: shippingData.city || "",
      });
    }
    setLoading(false);
  }, [shippingData, token, redirect]);

  const saveMutation = useMutation({
    mutationFn: upsertMyShipping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping"] });
      setMsg("Đã lưu thông tin giao hàng ✅");
      if (redirect) {
        setTimeout(() => router.replace(redirect), 400);
      }
    },
    onError: (e) => {
      setMsg(e?.message || "Lưu thất bại.");
    },
  });

  const onChange = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSave = async () => {
    setMsg("");
    if (!form.phone.trim()) { setMsg("Vui lòng nhập số điện thoại."); return; }
    if (!form.addressLine.trim()) { setMsg("Vui lòng nhập địa chỉ giao hàng."); return; }

    setSaving(true);
    saveMutation.mutate({
      phone: form.phone.trim(),
      addressLine: form.addressLine.trim(),
      city: form.city.trim(),
    });
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2196f3" />
        <LinearGradient
          colors={['#2196f3', '#1976d2']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Thông tin giao hàng</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196f3" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2196f3" />
      <LinearGradient
        colors={['#2196f3', '#1976d2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Thông tin giao hàng</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>📍 Địa chỉ nhận hàng</Text>
          <Text style={styles.cardSubtitle}>
            Vui lòng cung cấp thông tin chính xác để chúng tôi giao hàng đến bạn
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>📞 Số điện thoại <Text style={styles.required}>*</Text></Text>
            <TextInput
              value={form.phone}
              onChangeText={(value) => onChange("phone", value)}
              placeholder="VD: 0912345678"
              keyboardType="phone-pad"
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>🏠 Địa chỉ cụ thể <Text style={styles.required}>*</Text></Text>
            <TextInput
              value={form.addressLine}
              onChangeText={(value) => onChange("addressLine", value)}
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
              multiline
              numberOfLines={3}
              style={[styles.input, styles.textArea]}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>🌆 Tỉnh/Thành phố</Text>
            <TextInput
              value={form.city}
              onChangeText={(value) => onChange("city", value)}
              placeholder="VD: TP. Hồ Chí Minh"
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {msg && (
          <View style={[styles.messageBox, msg.includes("✅") ? styles.successBox : styles.errorBox]}>
            <Text style={styles.messageText}>{msg}</Text>
          </View>
        )}

        <View style={styles.noteCard}>
          <Text style={styles.noteIcon}>ℹ️</Text>
          <Text style={styles.noteText}>
            Thông tin này sẽ được sử dụng làm địa chỉ giao hàng mặc định khi bạn đặt hàng.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => router.push("/")}
          style={styles.homeButton}
        >
          <Text style={styles.homeButtonText}>🏠 Trang chủ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSave}
          disabled={saving}
          style={[styles.saveButton, saving && styles.disabledButton]}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "⏳ Đang lưu..." : "💾 Lưu thông tin"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  required: {
    color: "#f44336",
    fontSize: 16,
  },
  input: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 15,
    color: "#1a1a1a",
    borderWidth: 1.5,
    borderColor: "#e9ecef",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  messageBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  successBox: {
    backgroundColor: "#e8f5e9",
    borderWidth: 1,
    borderColor: "#4caf50",
  },
  errorBox: {
    backgroundColor: "#ffebee",
    borderWidth: 1,
    borderColor: "#f44336",
  },
  messageText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
  },
  noteCard: {
    flexDirection: "row",
    backgroundColor: "#e3f2fd",
    borderRadius: 12,
    padding: 16,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#90caf9",
  },
  noteIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: "#1976d2",
    lineHeight: 20,
    fontWeight: "500",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  homeButton: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#2196f3",
  },
  homeButtonText: {
    color: "#2196f3",
    fontWeight: "700",
    fontSize: 15,
  },
  saveButton: {
    flex: 2,
    padding: 16,
    backgroundColor: "#2196f3",
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#2196f3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: "#9e9e9e",
    shadowOpacity: 0,
    elevation: 0,
  },
});