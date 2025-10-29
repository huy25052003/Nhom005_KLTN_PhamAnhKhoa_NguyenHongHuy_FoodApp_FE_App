import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, StatusBar } from "react-native";
import { router } from "expo-router";
import { useRegister } from "../src/api/hooks";
import { useAuth } from "../src/store/auth";
import { LinearGradient } from 'expo-linear-gradient';
import { UserPlus, User, Lock, CheckCircle, LogIn } from 'lucide-react-native';

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
      router.replace("/login");
    } catch (e) {
      console.log("REGISTER ERR:", e?.message, e?.response?.status, e?.response?.data);
      Alert.alert("Lỗi", e?.response?.data?.message || e?.message || "Đăng ký thất bại");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <LinearGradient
        colors={['#4caf50', '#388e3c']}
        style={styles.header}
      >
        <UserPlus color="#fff" size={60} strokeWidth={1.5} />
        <Text style={styles.headerTitle}>Đăng ký</Text>
        <Text style={styles.headerSubtitle}>Tạo tài khoản mới ngay!</Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}>
            <User color="#4caf50" size={20} strokeWidth={2} />
          </View>
          <TextInput
            placeholder="Tên đăng nhập"
            placeholderTextColor="#999"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}>
            <Lock color="#4caf50" size={20} strokeWidth={2} />
          </View>
          <TextInput
            placeholder="Mật khẩu"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}>
            <CheckCircle color="#4caf50" size={20} strokeWidth={2} />
          </View>
          <TextInput
            placeholder="Xác nhận mật khẩu"
            placeholderTextColor="#999"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          onPress={submit}
          style={[styles.submitButton, register.isPending && styles.submitButtonDisabled]}
          disabled={register.isPending}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={register.isPending ? ['#bdbdbd', '#9e9e9e'] : ['#4caf50', '#388e3c']}
            style={styles.submitGradient}
          >
            <UserPlus color="#fff" size={20} strokeWidth={2} />
            <Text style={styles.submitText}>
              {register.isPending ? "Đang đăng ký..." : "Đăng ký ngay"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>hoặc</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity 
          onPress={() => router.push("/login")}
          style={styles.loginButton}
          activeOpacity={0.7}
        >
          <LogIn color="#4caf50" size={20} strokeWidth={2} />
          <Text style={styles.loginText}>Đã có tài khoản? Đăng nhập</Text>
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
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 30,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    marginTop: 16,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#e8f5e9",
    marginTop: 8,
    fontWeight: "500",
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#333",
  },
  submitButton: {
    borderRadius: 16,
    marginTop: 8,
    overflow: "hidden",
    shadowColor: "#4caf50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    shadowColor: "#9e9e9e",
  },
  submitGradient: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  submitText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#999",
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#4caf50",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loginText: {
    color: "#4caf50",
    fontSize: 16,
    fontWeight: "700",
  },
});