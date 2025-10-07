import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { useRegister } from "../src/api/hooks";
import { useAuth } from "../src/store/auth";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const register = useRegister();
  const { setAuth } = useAuth();

  const submit = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
      return;
    }
    if (!username || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }
    try {
      const { token, user } = await register.mutateAsync({ username, password });
      console.log("Register response:", { token, user });
      await setAuth(user, token);
      Alert.alert("Thành công", "Đăng ký thành công!");
      router.replace("/login"); // Chuyển về đăng nhập sau đăng ký thành công
    } catch (e) {
      console.log("REGISTER ERR:", e?.message, e?.response?.status, e?.response?.data);
      Alert.alert("Lỗi", e?.response?.data?.message || e?.message || "Đăng ký thất bại");
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Đăng ký</Text>
      <TextInput
        placeholder="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
        style={{ backgroundColor: "#f2f2f2", padding: 12, borderRadius: 10 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ backgroundColor: "#f2f2f2", padding: 12, borderRadius: 10 }}
      />
      <TextInput
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={{ backgroundColor: "#f2f2f2", padding: 12, borderRadius: 10 }}
      />
      <TouchableOpacity
        onPress={submit}
        style={{ padding: 12, backgroundColor: "#0a7", borderRadius: 10 }}
        disabled={register.isPending}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
          {register.isPending ? "Đang đăng ký..." : "Đăng ký"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/login")}>
        <Text style={{ textAlign: "center", color: "#007bff", fontSize: 16 }}>
          Đã có tài khoản? Đăng nhập
        </Text>
      </TouchableOpacity>
    </View>
  );
}