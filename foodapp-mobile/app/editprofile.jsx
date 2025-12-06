import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, StatusBar, ScrollView } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { User, Mail, Phone, MapPin, ArrowLeft } from 'lucide-react-native';
import { useMe } from "../src/api/hooks";
import axios from "../src/api/axios";

export default function EditProfile() {
  const { data: me, refetch } = useMe();
  const [username, setUsername] = useState(me?.username || "");
  const [email, setEmail] = useState(me?.email || "");
  const [phone, setPhone] = useState(me?.phone || "");
  const [address, setAddress] = useState(me?.address || "");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleUpdate = async () => {
    let newErrors = {};
    
    if (!username.trim()) newErrors.username = "Vui lòng nhập tên";
    if (email && !/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email không hợp lệ";
    if (phone && !/^[0-9]{10,11}$/.test(phone)) newErrors.phone = "Số điện thoại không hợp lệ";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await axios.put("/users/profile", {
        username,
        email,
        phone,
        address,
      });
      Alert.alert("Thành công", "Cập nhật thông tin thành công!", [
        { text: "OK", onPress: () => {
          refetch();
          router.back();
        }}
      ]);
    } catch (error) {
      Alert.alert("Lỗi", error?.response?.data?.message || "Không thể cập nhật thông tin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      <LinearGradient colors={['#4caf50', '#388e3c']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} strokeWidth={2} />
        </TouchableOpacity>
        <User color="#fff" size={60} strokeWidth={1.5} />
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <Text style={styles.headerSubtitle}>Cập nhật thông tin cá nhân</Text>
      </LinearGradient>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View>
          <Text style={styles.label}>Tên người dùng</Text>
          <View style={[styles.inputGroup, errors.username && styles.inputGroupError]}>
            <View style={styles.inputIcon}>
              <User color={errors.username ? "#f44336" : "#4caf50"} size={20} strokeWidth={2} />
            </View>
            <TextInput
              placeholder="Nhập tên của bạn"
              placeholderTextColor="#999"
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
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputGroup, errors.email && styles.inputGroupError]}>
            <View style={styles.inputIcon}>
              <Mail color={errors.email ? "#f44336" : "#4caf50"} size={20} strokeWidth={2} />
            </View>
            <TextInput
              placeholder="Nhập email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
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

        <View>
          <Text style={styles.label}>Số điện thoại</Text>
          <View style={[styles.inputGroup, errors.phone && styles.inputGroupError]}>
            <View style={styles.inputIcon}>
              <Phone color={errors.phone ? "#f44336" : "#4caf50"} size={20} strokeWidth={2} />
            </View>
            <TextInput
              placeholder="Nhập số điện thoại"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (errors.phone) setErrors({ ...errors, phone: "" });
              }}
              style={styles.input}
              maxLength={11}
            />
          </View>
          {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
        </View>

        <View>
          <Text style={styles.label}>Địa chỉ</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <MapPin color="#4caf50" size={20} strokeWidth={2} />
            </View>
            <TextInput
              placeholder="Nhập địa chỉ"
              placeholderTextColor="#999"
              value={address}
              onChangeText={setAddress}
              style={styles.input}
              multiline
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleUpdate}
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#4caf50', '#388e3c']} style={styles.buttonGradient}>
            <Text style={styles.submitButtonText}>
              {loading ? "Đang cập nhật..." : "Cập nhật thông tin"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 16,
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
    marginTop: 32,
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
