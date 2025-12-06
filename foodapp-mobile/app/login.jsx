import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, StatusBar } from "react-native";
import { router } from "expo-router";
import { useLogin } from "../src/api/hooks";
import { useAuth } from "../src/store/auth";
import { LinearGradient } from 'expo-linear-gradient';
import { LogIn, User, Lock, UserPlus, Eye, EyeOff } from 'lucide-react-native';
import { jwtDecode } from "jwt-decode";

export default function Login() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ username: "", password: "" });
  
  const login = useLogin();
  const setAuth = useAuth((s) => s.setAuth);

  const handleGoogleLogin = () => {
    Alert.alert(
      "Đăng nhập Google",
      "Tính năng này yêu cầu cài đặt Firebase. Xem file SETUP_NEW_FEATURES.md để cấu hình.",
      [{ text: "OK" }]
    );
  };

  const validateAndSubmit = async () => {
    let newErrors = {};
    
    if (!username.trim()) newErrors.username = "Vui lòng nhập tài khoản";
    if (!password) newErrors.password = "Vui lòng nhập mật khẩu";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    submit();
  };

  const submit = async () => {
    try {
      const out = await login.mutateAsync({ username, password });
      await setAuth(out.user ?? null, out.token);

      // --- LOGIC PHÂN QUYỀN MỚI ---
      let roles = [];
      
      // Cách 1: Nếu out.user có chứa roles
      if (out.user?.roles) {
        roles = out.user.roles;
      } 
      // Cách 2: Decode từ token (nếu out.user không có role)
      else if (out.token) {
        try {
          const decoded = jwtDecode(out.token); // Cần cài: npm install jwt-decode
          roles = decoded.roles || decoded.authorities || [];
        } catch (e) {}
      }

      // Chuẩn hóa role về dạng string hoặc array để kiểm tra
      const roleString = JSON.stringify(roles).toUpperCase();

      if (roleString.includes("SHIPPER") || roleString.includes("KITCHEN")) {
        // Nếu bạn muốn Shipper dùng chung app
        router.replace("/shipper"); 
      } else {
        // Khách hàng bình thường
        router.replace("/home");
      }
      // -----------------------------

    } catch (e) {
      console.log("LOGIN ERR:", e);
      Alert.alert("Lỗi", "Đăng nhập thất bại");
    }
  };
  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      
      {/* Header với gradient */}
      <LinearGradient
        colors={['#4caf50', '#388e3c']}
        style={styles.header}
      >
        <LogIn color="#fff" size={60} strokeWidth={1.5} />
        <Text style={styles.headerTitle}>Đăng nhập</Text>
        <Text style={styles.headerSubtitle}>Chào mừng bạn trở lại!</Text>
      </LinearGradient>

      {/* Form đăng nhập */}
      <View style={styles.formContainer}>
        {/* Input username/email */}
        <View>
          <View style={[styles.inputGroup, errors.username && styles.inputGroupError]}>
            <View style={styles.inputIcon}>
              <User color={errors.username ? "#f44336" : "#4caf50"} size={20} strokeWidth={2} />
            </View>
            <TextInput
              placeholder="Email hoặc Tên đăng nhập"
              placeholderTextColor="#999"
              autoCapitalize="none"
              value={username}
              onChangeText={(text) => {
                setU(text);
                if (errors.username) setErrors({ ...errors, username: "" });
              }}
              style={styles.input}
            />
          </View>
          {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
        </View>

        {/* Input password */}
        <View>
          <View style={[styles.inputGroup, errors.password && styles.inputGroupError]}>
            <View style={styles.inputIcon}>
              <Lock color={errors.password ? "#f44336" : "#4caf50"} size={20} strokeWidth={2} />
            </View>
            <TextInput
              placeholder="Mật khẩu"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setP(text);
                if (errors.password) setErrors({ ...errors, password: "" });
              }}
              style={[styles.input, { paddingRight: 50 }]}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)} 
              style={styles.eyeIcon}
            >
              {showPassword ? 
                <EyeOff color="#999" size={20} strokeWidth={2} /> : 
                <Eye color="#999" size={20} strokeWidth={2} />
              }
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>

        {/* Nút đăng nhập */}
        <TouchableOpacity
          onPress={validateAndSubmit}
          style={[styles.submitButton, login.isPending && styles.submitButtonDisabled]}
          disabled={login.isPending}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={login.isPending ? ['#bdbdbd', '#9e9e9e'] : ['#4caf50', '#388e3c']}
            style={styles.submitGradient}
          >
            <LogIn color="#fff" size={20} strokeWidth={2} />
            <Text style={styles.submitText}>
              {login.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Links: Quên mật khẩu & Đăng nhập SMS */}
        <View style={styles.linksRow}>
          <TouchableOpacity onPress={() => router.push("/forgotpassword")}>
            <Text style={styles.linkText}>Quên mật khẩu?</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/loginsms")}>
            <Text style={styles.linkText}>Đăng nhập SMS</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>hoặc</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Nút đăng nhập bằng Google */}
        <TouchableOpacity 
          onPress={handleGoogleLogin}
          style={styles.googleButton}
          activeOpacity={0.8}
        >
          <View style={styles.googleButtonContent}>
            <View style={styles.googleIcon}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={styles.googleButtonText}>Đăng nhập bằng Google</Text>
          </View>
        </TouchableOpacity>

        {/* Nút tạo tài khoản mới */}
        <TouchableOpacity 
          onPress={() => router.push("/register")}
          style={styles.registerButton}
          activeOpacity={0.7}
        >
          <UserPlus color="#4caf50" size={20} strokeWidth={2} />
          <Text style={styles.registerText}>Tạo tài khoản mới</Text>
        </TouchableOpacity>
      </View>
      {/* End formContainer */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
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
    marginBottom: 8,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  inputGroupError: {
    borderColor: "#f44336",
    borderWidth: 1.5,
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
  eyeIcon: {
    position: "absolute",
    right: 16,
    padding: 8,
  },
  errorText: {
    color: "#f44336",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
  },
  linksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 16,
  },
  linkText: {
    color: "#4caf50",
    fontSize: 14,
    fontWeight: "500",
  },
  googleButton: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#db4437",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  googleIconText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  googleButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
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
  registerButton: {
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
  registerText: {
    color: "#4caf50",
    fontSize: 16,
    fontWeight: "700",
  },
});