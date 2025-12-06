import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, StatusBar } from "react-native";
import { router } from "expo-router";
import { useRegister } from "../src/api/hooks";
import { useAuth } from "../src/store/auth";
import { LinearGradient } from 'expo-linear-gradient';
import { UserPlus, User, Lock, CheckCircle, LogIn, Eye, EyeOff } from 'lucide-react-native';

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({ username: "", password: "", confirmPassword: "" });
  
  const register = useRegister();
  const { setAuth } = useAuth();

  const validateAndSubmit = async () => {
    let newErrors = {};
    
    if (!username.trim()) newErrors.username = "Vui lòng nhập tài khoản";
    if (!password) newErrors.password = "Vui lòng nhập mật khẩu";
    else if (password.length < 6) newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    
    if (!confirmPassword) newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    else if (password !== confirmPassword) newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    submit();
  };

  const submit = async () => {
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
                setUsername(text);
                if (errors.username) setErrors({ ...errors, username: "" });
              }}
              style={styles.input}
            />
          </View>
          {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
        </View>

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
                setPassword(text);
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

        <View>
          <View style={[styles.inputGroup, errors.confirmPassword && styles.inputGroupError]}>
            <View style={styles.inputIcon}>
              <CheckCircle color={errors.confirmPassword ? "#f44336" : "#4caf50"} size={20} strokeWidth={2} />
            </View>
            <TextInput
              placeholder="Xác nhận mật khẩu"
              placeholderTextColor="#999"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
              }}
              style={[styles.input, { paddingRight: 50 }]}
            />
            <TouchableOpacity 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
              style={styles.eyeIcon}
            >
              {showConfirmPassword ? 
                <EyeOff color="#999" size={20} strokeWidth={2} /> : 
                <Eye color="#999" size={20} strokeWidth={2} />
              }
            </TouchableOpacity>
          </View>
          {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
        </View>

        <TouchableOpacity
          onPress={validateAndSubmit}
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