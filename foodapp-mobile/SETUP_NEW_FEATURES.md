# Cài đặt tính năng mới cho Mobile App

## Tính năng hiện có (Sẵn sàng sử dụng)

### ✅ Đăng nhập - Đã cải tiến
- Validation từng trường input với thông báo lỗi
- Icon show/hide password
- Link "Quên mật khẩu?"
- Link "Đăng nhập SMS"
- Placeholder "Email hoặc Tên đăng nhập"

### ✅ Đăng nhập SMS (`/loginsms`)
- **Hoạt động ngay** nếu backend có API
- Bước 1: Nhập số điện thoại → Nhận mã OTP qua SMS
- Bước 2: Nhập mã OTP 6 chữ số → Đăng nhập
- Validation số điện thoại Việt Nam
- Tính năng gửi lại OTP
- Có thể đổi số điện thoại

### ✅ Đăng ký - Đã cải tiến
- Validation 3 trường (username, password, confirmPassword)
- Icon show/hide password cho cả 2 trường mật khẩu
- Kiểm tra độ dài password tối thiểu 6 ký tự
- Thông báo lỗi riêng cho từng trường
- Border đỏ khi có lỗi

### ✅ Quên mật khẩu (`/forgotpassword`)
- **Hoạt động ngay** nếu backend có API
- Bước 1: Nhập email → Nhận mã OTP
- Bước 2: Nhập mã + mật khẩu mới
- Validation đầy đủ

### ✅ Đổi mật khẩu (`/changepassword`)
- **Hoạt động ngay** nếu backend có API
- 3 trường: Mật khẩu hiện tại, Mật khẩu mới, Xác nhận
- Icon show/hide password cho cả 3 trường

---

## Tính năng tùy chọn (Cần cấu hình Firebase)

### 🔧 Đăng nhập Google

**Lưu ý:** Hiện tại nút "Đăng nhập Google" chỉ hiển thị thông báo. Để kích hoạt:

#### Bước 1: Cài đặt Dependencies

```bash
npm install firebase @react-native-firebase/app @react-native-firebase/auth
```

#### Bước 2: Cấu hình Firebase

1. Tạo Firebase Project tại https://console.firebase.google.com/
2. Thêm Android/iOS app vào project
3. Tải file cấu hình:
   - Android: `google-services.json` → `android/app/`
   - iOS: `GoogleService-Info.plist` → `ios/`

#### Bước 3: Cập nhật Firebase Config

Mở `src/lib/firebase.js` và thay thế:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:android:abc123"
};
```

#### Bước 4: Bật Google Sign-In trong Firebase

1. Firebase Console → Authentication → Sign-in method
2. Enable "Google"

#### Bước 5: Cập nhật code trong `app/login.jsx`

Bỏ comment và thay thế hàm `handleGoogleLogin`:

```javascript
// Uncomment khi đã cài Firebase
// import { auth, googleProvider } from "../src/lib/firebase";
// import { signInWithPopup } from "firebase/auth";
// import { loginWithFirebase } from "../src/api/auth";

const handleGoogleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    const { token } = await loginWithFirebase(idToken);
    
    const decoded = jwtDecode(token);
    const user = { username: decoded.sub };
    await setAuth(user, token);
    
    const roleString = decoded.role || "";
    if (roleString.includes("SHIPPER") || roleString.includes("KITCHEN")) {
      router.replace("/shipper");
    } else {
      router.replace("/home");
    }
  } catch (error) {
    Alert.alert("Lỗi", "Đăng nhập Google thất bại");
  }
};
```

---

## Backend API Requirements

Đảm bảo backend có các endpoints:

### Bắt buộc cho tính năng cơ bản:
- `POST /auth/login` - Đăng nhập
- `POST /auth/register` - Đăng ký

### Cho Đăng nhập SMS:
- `POST /auth/sms/request` - Gửi mã OTP (body: `{phoneNumber}`)
- `POST /auth/sms/verify` - Xác thực OTP (body: `{phoneNumber, otp}`)

### Cho tính năng quên mật khẩu & đổi mật khẩu:
- `POST /auth/forgot-password/request` - Yêu cầu mã reset (body: `{email}`)
- `POST /auth/forgot-password/reset` - Reset mật khẩu (body: `{email, code, newPassword}`)
- `POST /auth/change-password` - Đổi mật khẩu (body: `{oldPassword, newPassword}`, cần token)

### Cho Google Login (tùy chọn):
## Sử dụng

### Đăng nhập SMS
```javascript
// Từ trang login hoặc bất kỳ đâu
router.push("/loginsms")
```

### Quên mật khẩu

## Sử dụng

### Quên mật khẩu
```javascript
// Từ trang login hoặc bất kỳ đâu
router.push("/forgotpassword")
```

### Đổi mật khẩu
```javascript
// Từ trang profile/settings
router.push("/changepassword")
```

### Link trong UI
```jsx
// Ví dụ trong trang Profile
<TouchableOpacity onPress={() => router.push("/changepassword")}>
  <Text>Đổi mật khẩu</Text>
</TouchableOpacity>
```

---

## Testing

```bash
# Build và chạy
npm run android
npm run ios

# Reload nhanh
r (trong terminal Expo)
```

---

## Troubleshooting

### Lỗi "Unable to resolve expo-auth-session"
✅ **Đã sửa** - Không cần cài package này nữa

### Lỗi "Cannot find module firebase"
→ Chỉ cần cài nếu muốn Google Login

### API trả về 404
→ Kiểm tra backend đã có endpoint chưa

### Không nhận được email OTP
→ Kiểm tra cấu hình email service trong backend
