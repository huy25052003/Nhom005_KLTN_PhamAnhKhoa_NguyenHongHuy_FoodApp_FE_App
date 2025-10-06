import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { useLogin } from "../src/api/hooks";
import { useAuth } from "../src/store/auth";

export default function Login() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const login = useLogin();
  const setAuth = useAuth((s) => s.setAuth);

  const submit = async () => {
    try {
      const out = await login.mutateAsync({ username, password });
      console.log("Login response:", out); // Log để kiểm tra dữ liệu
      await setAuth(out.user ?? null, out.token);
      router.replace("/home");
    } catch (e) {
      console.log("LOGIN ERR:", e?.message, e?.response?.status, e?.response?.data);
      Alert.alert("Lỗi", e?.response?.data?.message || e?.message || "Đăng nhập thất bại");
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Đăng nhập</Text>
      <TextInput placeholder="Username" autoCapitalize="none" value={username} onChangeText={setU}
        style={{ backgroundColor: "#f2f2f2", padding: 12, borderRadius: 10 }} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setP}
        style={{ backgroundColor: "#f2f2f2", padding: 12, borderRadius: 10 }} />
      <TouchableOpacity onPress={submit} style={{ padding: 12, backgroundColor: "#0a7", borderRadius: 10 }}>
        <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
          {login.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}