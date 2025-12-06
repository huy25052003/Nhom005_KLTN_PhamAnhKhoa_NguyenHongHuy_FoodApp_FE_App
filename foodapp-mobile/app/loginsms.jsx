import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, StatusBar } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { Smartphone, MessageSquare, ArrowLeft, Lock } from 'lucide-react-native';
import { useAuth } from "../src/store/auth";
import { jwtDecode } from "jwt-decode";
import axios from "../src/api/axios";

export default function LoginSMS() {
  const [step, setStep] = useState(1); // 1: nhập SĐT, 2: nhập OTP
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const setAuth = useAuth((s) => s.setAuth);

  const validatePhoneNumber = (phone) => {
    // Validate Vietnamese phone number
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    return phoneRegex.test(phone);
  };

  const handleRequestOTP = async () => {
    if (!phoneNumber.trim()) {
      setErrors({ phoneNumber: "Vui lòng nhập số điện thoại" });
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setErrors({ phoneNumber: "Số điện thoại không hợp lệ" });
      return;
    }

    setLoading(true);
    try {
      await axios.post("auth/sms/request", { phoneNumber });
      Alert.alert("Thành công", "Mã OTP đã được gửi đến số điện thoại của bạn");
      setStep(2);
      setErrors({});
    } catch (error) {
      Alert.alert("Lỗi", error?.response?.data?.message || "Không thể gửi mã OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setErrors({ otp: "Vui lòng nhập mã OTP" });
      return;
    }

    if (otp.length !== 6) {
      setErrors({ otp: "Mã OTP phải có 6 chữ số" });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("auth/sms/verify", { phoneNumber, otp });
      const token = response.data?.accessToken || response.data?.token;
      
      if (token) {
        const decoded = jwtDecode(token);
        const user = { username: decoded.sub || phoneNumber };
        await setAuth(user, token);

        Alert.alert("Thành công", "Đăng nhập thành công!");
        
        const roleString = decoded.role || "";
        if (roleString.includes("SHIPPER") || roleString.includes("KITCHEN")) {
          router.replace("/shipper");
        } else {
          router.replace("/home");
        }
      }
    } catch (error) {
      Alert.alert("Lỗi", error?.response?.data?.message || "Mã OTP không chính xác");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await axios.post("auth/sms/request", { phoneNumber });
      Alert.alert("Thành công", "Mã OTP mới đã được gửi");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể gửi lại mã OTP");
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
        <Smartphone color="#fff" size={60} strokeWidth={1.5} />
        <Text style={styles.headerTitle}>Đăng nhập SMS</Text>
        <Text style={styles.headerSubtitle}>
          {step === 1 ? "Nhập số điện thoại của bạn" : "Nhập mã OTP đã gửi"}
        </Text>
      </LinearGradient>

      {/* Form content */}
      <View style={styles.formContainer}>
        {/* Bước 1: Nhập số điện thoại */}
        {step === 1 ? (
          <>
            <View>
              <View style={[styles.inputGroup, errors.phoneNumber && styles.inputGroupError]}>
                <View style={styles.inputIcon}>
                  <Smartphone color={errors.phoneNumber ? "#f44336" : "#4caf50"} size={20} strokeWidth={2} />
                </View>
                <TextInput
                  placeholder="Số điện thoại (VD: 0912345678)"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: "" });
                  }}
                  style={styles.input}
                  maxLength={11}
                />
              </View>
              {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}
            </View>

            <TouchableOpacity
              onPress={handleRequestOTP}
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#4caf50', '#388e3c']} style={styles.buttonGradient}>
                <MessageSquare color="#fff" size={20} strokeWidth={2} />
                <Text style={styles.submitButtonText}>
                  {loading ? "Đang gửi..." : "Gửi mã OTP"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          /* Bước 2: Nhập mã OTP */
          <>
            <View style={styles.phoneNumberDisplay}>
              <Text style={styles.phoneNumberLabel}>Mã OTP đã gửi đến:</Text>
              <Text style={styles.phoneNumberText}>{phoneNumber}</Text>
              <TouchableOpacity onPress={() => setStep(1)}>
                <Text style={styles.changeNumberText}>Đổi số điện thoại</Text>
              </TouchableOpacity>
            </View>

            <View>
              <View style={[styles.inputGroup, errors.otp && styles.inputGroupError]}>
                <View style={styles.inputIcon}>
                  <Lock color={errors.otp ? "#f44336" : "#4caf50"} size={20} strokeWidth={2} />
                </View>
                <TextInput
                  placeholder="Nhập mã OTP (6 chữ số)"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={(text) => {
                    setOtp(text);
                    if (errors.otp) setErrors({ ...errors, otp: "" });
                  }}
                  style={styles.input}
                  maxLength={6}
                />
              </View>
              {errors.otp ? <Text style={styles.errorText}>{errors.otp}</Text> : null}
            </View>

            <TouchableOpacity
              onPress={handleVerifyOTP}
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#4caf50', '#388e3c']} style={styles.buttonGradient}>
                <Text style={styles.submitButtonText}>
                  {loading ? "Đang xác thực..." : "Xác nhận"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendLabel}>Không nhận được mã?</Text>
              <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
                <Text style={styles.resendButton}>Gửi lại</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

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
    textAlign: "center",
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
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  phoneNumberDisplay: {
    backgroundColor: "#e8f5e9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: "center",
  },
  phoneNumberLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  phoneNumberText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 8,
  },
  changeNumberText: {
    fontSize: 14,
    color: "#4caf50",
    textDecorationLine: "underline",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 8,
  },
  resendLabel: {
    fontSize: 14,
    color: "#666",
  },
  resendButton: {
    fontSize: 14,
    color: "#4caf50",
    fontWeight: "600",
    textDecorationLine: "underline",
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
