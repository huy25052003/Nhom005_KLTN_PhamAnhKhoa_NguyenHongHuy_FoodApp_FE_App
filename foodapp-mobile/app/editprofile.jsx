import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, StatusBar, ScrollView, Picker, Platform } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { User, Mail, Phone, MapPin, ArrowLeft, Save, Activity, Heart, Target, Calendar } from 'lucide-react-native';
import { Picker as RNPicker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyShipping, upsertMyShipping } from "../src/api/shipping";
import { getProfile, updateProfile, getMe } from "../src/api/user";
import { useAuth } from "../src/store/auth";

const API_HOST = "https://esgoo.net/api-tinhthanh-new";

export default function EditProfile() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  
  // Load user data using getMe instead of useMe hook
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: !!token,
  });
  
  // Thông tin tài khoản & cá nhân
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState("MALE");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  // Thông tin sức khỏe
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [activityLevel, setActivityLevel] = useState("MODERATE");
  const [goal, setGoal] = useState("MAINTAIN");
  const [targetCalories, setTargetCalories] = useState("");
  
  // Shipping info
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingNote, setShippingNote] = useState("");
  
  // Province & Ward data
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedWardId, setSelectedWardId] = useState("");
  const [houseNumber, setHouseNumber] = useState("");

  // Load profile data
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !!token,
  });

  const { data: shippingData } = useQuery({
    queryKey: ["shipping"],
    queryFn: getMyShipping,
    enabled: !!token,
  });

  useEffect(() => {
    if (me) {
      console.log("Me data:", me);
      setEmail(me.email || "");
      setPhone(me.phone || "");
      // Set fullName from me
      if (me.fullName) {
        setFullName(me.fullName);
      }
    }
  }, [me]);

  useEffect(() => {
    if (profileData) {
      console.log("Profile data:", profileData);
      if (profileData.fullName) {
        setFullName(profileData.fullName);
      }
      if (profileData.birthDate) {
        setBirthDate(profileData.birthDate);
      }
      // Set phone from profile if available
      if (profileData.phone) {
        console.log("Setting phone from profile:", profileData.phone);
        setPhone(profileData.phone);
      }
      setGender(profileData.gender || "MALE");
      setHeightCm(profileData.heightCm?.toString() || "");
      setWeightKg(profileData.weightKg?.toString() || "");
      setActivityLevel(profileData.activityLevel || "MODERATE");
      setGoal(profileData.goal || "MAINTAIN");
      setTargetCalories(profileData.targetCalories?.toString() || "");
    }
  }, [profileData]);

  useEffect(() => {
    if (shippingData) {
      setShippingPhone(shippingData.phone || phone || "");
      setShippingNote(shippingData.note || "");
      
      // Parse addressLine to extract houseNumber (just keep the full address for now)
      if (shippingData.addressLine) {
        setHouseNumber(shippingData.addressLine);
      }
    }
  }, [shippingData, phone]);

  // Load provinces on mount
  useEffect(() => {
    fetch(`${API_HOST}/1/0.htm`)
      .then(r => r.json())
      .then(res => {
        if (res.error === 0) setProvinces(res.data || []);
      })
      .catch(() => {});
  }, []);

  // Load wards when province changes
  useEffect(() => {
    if (!selectedProvinceId) {
      setWards([]);
      setSelectedWardId("");
      return;
    }
    fetch(`${API_HOST}/2/${selectedProvinceId}.htm`)
      .then(r => r.json())
      .then(res => {
        if (res.error === 0) setWards(res.data || []);
      })
      .catch(() => {});
  }, [selectedProvinceId]);

  // Calculate TDEE
  const calculateTDEE = () => {
    if (!heightCm || !weightKg) return 0;
    
    const h = Number(heightCm);
    const w = Number(weightKg);
    // Calculate age from birthDate or use default
    let age = 25;
    if (birthDate) {
      age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    }
    
    let bmr = (10 * w) + (6.25 * h) - (5 * age);
    bmr += (gender === "MALE" ? 5 : -161);

    const multipliers = { "SEDENTARY": 1.2, "LIGHT": 1.375, "MODERATE": 1.55, "ACTIVE": 1.725 };
    const maintenance = Math.round(bmr * (multipliers[activityLevel] || 1.2));

    if (goal === "LOSE") return Math.max(1200, maintenance - 500);
    if (goal === "GAIN") return maintenance + 500;
    return maintenance;
  };

  const estimatedTDEE = calculateTDEE();

  const handleSaveAll = async () => {
    // Validation
    if (!fullName || !fullName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ tên");
      return;
    }

    setLoading(true);
    try {
      // Save profile
      const profilePayload = {
        fullName: fullName.trim(),
        birthDate: birthDate || null,
        gender: gender,
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        activityLevel: activityLevel,
        goal: goal,
        targetCalories: targetCalories ? Number(targetCalories) : null,
      };
      
      console.log("Saving profile data:", profilePayload);
      
      const profileResult = await updateProfile(profilePayload);
      console.log("Profile saved successfully:", profileResult);

      // Save shipping - same logic as web
      let addressToSave = houseNumber?.trim() || "";
      
      // Only construct full address if all required fields are present
      if (selectedProvinceId && selectedWardId && addressToSave) {
        const pName = provinces.find(p => p.id === selectedProvinceId)?.full_name;
        const wName = wards.find(w => w.id === selectedWardId)?.full_name;
        addressToSave = `${addressToSave}, ${wName}, ${pName}`;
      }
      
      // Only save shipping if we have a valid address
      if (addressToSave) {
        try {
          const shippingPayload = {
            phone: shippingPhone?.trim() || phone,
            addressLine: addressToSave,
            city: provinces.find(p => p.id === selectedProvinceId)?.full_name || "Vietnam",
            note: shippingNote?.trim() || "",
          };
          
          console.log("Saving shipping data:", shippingPayload);
          
          const shippingResult = await upsertMyShipping(shippingPayload);
          console.log("Shipping saved successfully:", shippingResult);
        } catch (shippingError) {
          // Log but don't fail the whole save operation
          console.warn("Failed to save shipping (non-critical):", shippingError);
        }
      }

      Alert.alert("Thành công", "Đã lưu tất cả thông tin!", [
        { text: "OK", onPress: () => {
          queryClient.invalidateQueries({ queryKey: ["me"] });
          queryClient.invalidateQueries({ queryKey: ["profile"] });
          queryClient.invalidateQueries({ queryKey: ["shipping"] });
          router.back();
        }}
      ]);
    } catch (error) {
      console.error("Save error:", error);
      console.error("Error details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        stack: error?.stack
      });
      
      let errorMessage = "Không thể lưu thông tin";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      {/* Header */}
      <LinearGradient colors={['#4caf50', '#388e3c']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} strokeWidth={2} />
        </TouchableOpacity>
        <User color="#fff" size={60} strokeWidth={1.5} />
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
        <Text style={styles.headerSubtitle}>Cập nhật thông tin để nhận gợi ý thực đơn chuẩn xác</Text>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* SECTION 1: THÔNG TIN TÀI KHOẢN */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User color="#4caf50" size={20} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
          </View>

          <View style={styles.card}>
            <View>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email..."
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View>
              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="09..."
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View>
              <Text style={styles.label}>Họ tên hiển thị</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Tên hiển thị..."
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* SECTION 2: CHỈ SỐ SỨC KHỎE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Heart color="#f44336" size={20} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Chỉ số Sức khỏe</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Ngày sinh</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Calendar color="#666" size={18} strokeWidth={2} />
                  <Text style={styles.dateButtonText}>
                    {birthDate || "Chọn ngày sinh"}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={birthDate ? new Date(birthDate) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        const formattedDate = selectedDate.toISOString().split('T')[0];
                        setBirthDate(formattedDate);
                      }
                    }}
                    maximumDate={new Date()}
                  />
                )}
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Giới tính</Text>
                <View style={styles.radioRow}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setGender("MALE")}
                  >
                    <View style={[styles.radioCircle, gender === "MALE" && styles.radioCircleSelected]}>
                      {gender === "MALE" && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.radioLabel}>Nam</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setGender("FEMALE")}
                  >
                    <View style={[styles.radioCircle, gender === "FEMALE" && styles.radioCircleSelected]}>
                      {gender === "FEMALE" && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.radioLabel}>Nữ</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Chiều cao (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={heightCm}
                  onChangeText={setHeightCm}
                  placeholder="170"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Cân nặng (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={weightKg}
                  onChangeText={setWeightKg}
                  placeholder="65"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Mức độ vận động</Text>
                <View style={styles.pickerWrapper}>
                  <RNPicker
                    selectedValue={activityLevel}
                    onValueChange={(value) => setActivityLevel(value)}
                    style={styles.picker}
                  >
                    <RNPicker.Item label="Ít vận động" value="SEDENTARY" />
                    <RNPicker.Item label="Nhẹ (1-3/tuần)" value="LIGHT" />
                    <RNPicker.Item label="Vừa (3-5/tuần)" value="MODERATE" />
                    <RNPicker.Item label="Năng động (6-7)" value="ACTIVE" />
                  </RNPicker>
                </View>
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Mục tiêu</Text>
                <View style={styles.pickerWrapper}>
                  <RNPicker
                    selectedValue={goal}
                    onValueChange={(value) => setGoal(value)}
                    style={styles.picker}
                  >
                    <RNPicker.Item label="📉 Giảm cân" value="LOSE" />
                    <RNPicker.Item label="⚖️ Giữ cân" value="MAINTAIN" />
                    <RNPicker.Item label="📈 Tăng cân" value="GAIN" />
                  </RNPicker>
                </View>
              </View>
            </View>

            {/* TDEE Calculator */}
            <View style={styles.tdeeBox}>
              <Activity color="#10b981" size={18} strokeWidth={2} />
              <Text style={styles.tdeeLabel}>Nhu cầu Calo/ngày</Text>
              <Text style={styles.tdeeValue}>
                {estimatedTDEE > 0 ? estimatedTDEE : "--"} <Text style={styles.tdeeUnit}>kcal</Text>
              </Text>
            </View>

            <View>
              <Text style={styles.label}>Target Calories (Tùy chỉnh)</Text>
              <TextInput
                style={styles.input}
                value={targetCalories}
                onChangeText={setTargetCalories}
                placeholder={`Mặc định: ${estimatedTDEE || 2000}`}
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* SECTION 3: ĐỊA CHỈ GIAO HÀNG */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin color="#ff9800" size={20} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Địa chỉ mặc định</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>SĐT Nhận hàng</Text>
                <TextInput
                  style={styles.input}
                  value={shippingPhone}
                  onChangeText={setShippingPhone}
                  placeholder="SĐT người nhận"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Tỉnh/Thành phố</Text>
                <View style={styles.pickerWrapper}>
                  <RNPicker
                    selectedValue={selectedProvinceId}
                    onValueChange={(value) => setSelectedProvinceId(value)}
                    style={styles.picker}
                  >
                    <RNPicker.Item label="-- Chọn Tỉnh --" value="" />
                    {provinces.map(p => (
                      <RNPicker.Item key={p.id} label={p.full_name} value={p.id} />
                    ))}
                  </RNPicker>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Phường/Xã</Text>
                <View style={styles.pickerWrapper}>
                  <RNPicker
                    selectedValue={selectedWardId}
                    onValueChange={(value) => setSelectedWardId(value)}
                    style={styles.picker}
                    enabled={!!selectedProvinceId}
                  >
                    <RNPicker.Item label="-- Chọn Phường --" value="" />
                    {wards.map(w => (
                      <RNPicker.Item key={w.id} label={w.full_name} value={w.id} />
                    ))}
                  </RNPicker>
                </View>
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Số nhà, Tên đường</Text>
                <TextInput
                  style={styles.input}
                  value={houseNumber}
                  onChangeText={setHouseNumber}
                  placeholder="Số nhà, đường..."
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View>
              <Text style={styles.label}>Ghi chú (Tùy chọn)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={shippingNote}
                onChangeText={setShippingNote}
                placeholder="Lưu ý giao hàng..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={2}
              />
            </View>
          </View>
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity
          onPress={handleSaveAll}
          disabled={loading}
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        >
          <LinearGradient colors={['#4caf50', '#388e3c']} style={styles.saveButtonGradient}>
            <Save color="#fff" size={20} strokeWidth={2} />
            <Text style={styles.saveButtonText}>
              {loading ? "Đang lưu..." : "Lưu tất cả thay đổi"}
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
    fontSize: 13,
    color: "#e8f5e9",
    marginTop: 8,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  genderRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  genderButtonActive: {
    backgroundColor: "#4caf50",
    borderColor: "#4caf50",
  },
  genderText: {
    fontSize: 14,
    color: "#666",
  },
  genderTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  radioRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
    alignItems: "center",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#999",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: "#4caf50",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4caf50",
  },
  radioLabel: {
    fontSize: 14,
    color: "#333",
  },
  pickerWrapper: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  pickerContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  pickerText: {
    fontSize: 15,
    color: "#333",
  },
  goalRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  goalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  goalButtonActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  goalText: {
    fontSize: 18,
  },
  goalTextActive: {
    transform: [{ scale: 1.2 }],
  },
  tdeeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  tdeeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
    flex: 1,
  },
  tdeeValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#10b981",
  },
  tdeeUnit: {
    fontSize: 12,
    fontWeight: "normal",
    color: "#666",
  },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 8,
  },
  dateButtonText: {
    fontSize: 15,
    color: "#333",
  },
});
