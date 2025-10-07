import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyShipping, upsertMyShipping } from "../src/api/shipping";
import { useAuth } from "../src/store/auth";

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
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center" }} />;
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Thông tin giao hàng</Text>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: "600" }}>Số điện thoại *</Text>
        <TextInput
          value={form.phone}
          onChangeText={(value) => onChange("phone", value)}
          placeholder="VD: 09xxxxxxxx"
          keyboardType="phone-pad"
          style={{ backgroundColor: "#f2f2f2", padding: 12, borderRadius: 10 }}
        />

        <Text style={{ fontSize: 16, fontWeight: "600" }}>Địa chỉ *</Text>
        <TextInput
          value={form.addressLine}
          onChangeText={(value) => onChange("addressLine", value)}
          placeholder="Số nhà, đường, phường/xã…"
          multiline
          numberOfLines={3}
          style={{ backgroundColor: "#f2f2f2", padding: 12, borderRadius: 10 }}
        />

        <Text style={{ fontSize: 16, fontWeight: "600" }}>Tỉnh/Thành (tùy chọn)</Text>
        <TextInput
          value={form.city}
          onChangeText={(value) => onChange("city", value)}
          placeholder="VD: TP. Hồ Chí Minh"
          style={{ backgroundColor: "#f2f2f2", padding: 12, borderRadius: 10 }}
        />
      </View>

      {msg && <Text style={{ color: "#666", marginTop: 8 }}>{msg}</Text>}

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
        <TouchableOpacity onPress={() => router.push("/")}>
          <Text style={{ color: "#007bff", fontWeight: "600" }}>Về trang chủ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSave}
          disabled={saving}
          style={{ padding: 12, backgroundColor: "#0a7", borderRadius: 10 }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
            {saving ? "Đang lưu..." : "Lưu thông tin"}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={{ color: "#666", fontSize: 14, marginTop: 8 }}>
        * Thông tin này sẽ được dùng khi bạn đặt hàng.
      </Text>
    </ScrollView>
  );
}