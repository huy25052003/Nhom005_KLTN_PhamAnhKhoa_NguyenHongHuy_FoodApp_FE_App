import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, StatusBar } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { KeyRound, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { changePassword } from "../src/api/auth";

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    let newErrors = {};
    
    if (!oldPassword) newErrors.oldPassword = "Vui lòng nhập mật khẩu hiện tại";
    if (!newPassword) newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    else if (newPassword.length < 6) newErrors.newPassword = "Mật khẩu phải có ít nhất 6 ký tự";
    if (!confirmPassword) newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
    else if (newPassword !== confirmPassword) newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      Alert.alert("Thành công", "Đổi mật khẩu thành công!", [
        { text: "OK", onPress: () => router.back() }
      ]);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      Alert.alert("Lỗi", error?.response?.data?.message || "Không thể đổi mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      
      <LinearGradient colors={['#4caf50', '#388e3c']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} strokeWidth={2} />
        </TouchableOpacity>
        <KeyRound color="#fff" size={60} strokeWidth={1.5} />
        <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
        <Text style={styles.headerSubtitle}>Cập nhật mật khẩu của bạn</Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        <View>
          <View style={[styles.inputGroup, errors.oldPassword && styles.inputGroupError]}>
            <View style={styles.inputIcon}>
              <Lock color={errors.oldPassword ? "#f44336" : "#4caf50"} size={20} strokeWidth={2} />
            </View>
            <TextInput
              placeholder="Mật khẩu hiện tại"
              placeholderTextColor="#999"
              secureTextEntry={!showOldPassword}
              value={oldPassword}
              onChangeText={(text) => {
                setOldPassword(text);
                if (errors.oldPassword) setErrors({ ...errors, oldPassword: "" });
              }}
              style={[styles.input, { paddingRight: 50 }]}
            />
            <TouchableOpacity 
              onPress={() => setShowOldPassword(!showOldPassword)} 
              style={styles.eyeIcon}
            >
              {showOldPassword ? 
                <EyeOff color="#999" size={20} strokeWidth={2} /> : 
                <Eye color="#999" size={20} strokeWidth={2} />
              }
            </TouchableOpacity>
          </View>
          {errors.oldPassword ? <Text style={styles.errorText}>{errors.oldPassword}</Text> : null}
        </View>

        <View>
          <View style={[styles.inputGroup, errors.newPassword && styles.inputGroupError]}>
            <View style={styles.inputIcon}>
              <Lock color={errors.newPassword ? "#f44336" : "#4caf50"} size={20} strokeWidth={2} />
            </View>
            <TextInput
              placeholder="Mật khẩu mới"
              placeholderTextColor="#999"
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (errors.newPassword) setErrors({ ...errors, newPassword: "" });
              }}
              style={[styles.input, { paddingRight: 50 }]}
            />
            <TouchableOpacity 
              onPress={() => setShowNewPassword(!showNewPassword)} 
              style={styles.eyeIcon}
            >
              {showNewPassword ? 
                <EyeOff color="#999" size={20} strokeWidth={2} /> : 
                <Eye color="#999" size={20} strokeWidth={2} />
              }
            </TouchableOpacity>
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
          onPress={handleChangePassword}
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#4caf50', '#388e3c']} style={styles.buttonGradient}>
            <Text style={styles.submitButtonText}>
              {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
            </Text>
          </LinearGradient>
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
});
