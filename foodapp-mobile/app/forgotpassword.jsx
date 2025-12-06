import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, StatusBar } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { KeyRound, Mail, Lock, ArrowLeft } from 'lucide-react-native';
import { requestForgotPassword, resetPasswordEmail } from "../src/api/auth";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập mã + mật khẩu mới
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleRequestCode = async () => {
    if (!email.trim()) {
      setErrors({ email: "Vui lòng nhập email" });
      return;
    }

    setLoading(true);
    try {
      await requestForgotPassword(email);
      Alert.alert("Thành công", "Mã xác nhận đã được gửi đến email của bạn");
      setStep(2);
      setErrors({});
    } catch (error) {
      Alert.alert("Lỗi", error?.response?.data?.message || "Không thể gửi mã xác nhận");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    let newErrors = {};
    
    if (!code.trim()) newErrors.code = "Vui lòng nhập mã xác nhận";
    if (!newPassword) newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    else if (newPassword.length < 6) newErrors.newPassword = "Mật khẩu phải có ít nhất 6 ký tự";
    if (newPassword !== confirmPassword) newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await resetPasswordEmail(email, code, newPassword);
      Alert.alert("Thành công", "Đặt lại mật khẩu thành công!", [
        { text: "OK", onPress: () => router.replace("/login") }
      ]);
    } catch (error) {
      Alert.alert("Lỗi", error?.response?.data?.message || "Không thể đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      {/* Header với gradient */}
      <LinearGradient colors={['#4caf50', '#388e3c']} style={styles.header}>
        <KeyRound color="#fff" size={60} strokeWidth={1.5} />
        <Text style={styles.headerTitle}>Quên mật khẩu</Text>
        <Text style={styles.headerSubtitle}>
          {step === 1 ? "Nhập email để nhận mã xác nhận" : "Nhập mã và mật khẩu mới"}
        </Text>
      </LinearGradient>

      {/* Form content */}
      <View style={styles.formContainer}>
        {/* Bước 1: Nhập email */}
        {step === 1 ? (
          <>
            <View>
              <View style={[styles.inputGroup, errors.email && styles.inputGroupError]}>
                <View style={styles.inputIcon}>
                  <Mail color={errors.email ? "#f44336" : "#4caf50"} size={20} strokeWidth={2} />
                </View>
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: "" });
                  }}
                  style={styles.input}
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <TouchableOpacity
              onPress={handleRequestCode}
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#4caf50', '#388e3c']} style={styles.buttonGradient}>
                <Text style={styles.submitButtonText}>
                  {loading ? "Đang gửi..." : "Gửi mã xác nhận"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          /* Bước 2: Nhập mã và mật khẩu mới */
          <>
            <View>
              <View style={[styles.inputGroup, errors.code && styles.inputGroupError]}>
                <View style={styles.inputIcon}>
                  <KeyRound color={errors.code ? "#f44336" : "#4caf50"} size={20} strokeWidth={2} />
                </View>
                <TextInput
                  placeholder="Mã xác nhận"
                  placeholderTextColor="#999"
                  value={code}
                  onChangeText={(text) => {
                    setCode(text);
                    if (errors.code) setErrors({ ...errors, code: "" });
                  }}
                  style={styles.input}
                />
              </View>
              {errors.code ? <Text style={styles.errorText}>{errors.code}</Text> : null}
            </View>

            <View>
              <View style={[styles.inputGroup, errors.newPassword && styles.inputGroupError]}>
                <View style={styles.inputIcon}>
                  <Lock color={errors.newPassword ? "#f44336" : "#4caf50"} size={20} strokeWidth={2} />
                </View>
                <TextInput
                  placeholder="Mật khẩu mới"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (errors.newPassword) setErrors({ ...errors, newPassword: "" });
                  }}
                  style={styles.input}
                />
              </View>
              {errors.newPassword ? <Text style={styles.errorText}>{errors.newPassword}</Text> : null}
            </View>

            <View>
              <View style={[styles.inputGroup, errors.confirmPassword && styles.inputGroupError]}>
                <View style={styles.inputIcon}>
                  <Lock color={errors.confirmPassword ? "#f44336" : "#4caf50"} size={20} strokeWidth={2} />
                </View>
                <TextInput
                  placeholder="Xác nhận mật khẩu mới"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                  }}
                  style={styles.input}
                />
              </View>
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
            </View>

            <TouchableOpacity
              onPress={handleResetPassword}
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#4caf50', '#388e3c']} style={styles.buttonGradient}>
                <Text style={styles.submitButtonText}>
                  {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* Nút quay lại đăng nhập */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backToLoginButton}>
          <Text style={styles.backToLoginText}>Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#e8f5e9",
    marginTop: 8,
    textAlign: "center",
  },
  formContainer: {
    padding: 24,
    marginTop: 24,
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
  errorText: {
    color: "#f44336",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#4caf50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  backToLoginButton: {
    marginTop: 20,
    alignItems: "center",
  },
  backToLoginText: {
    color: "#4caf50",
    fontSize: 14,
  },
});
