// app/shipper/_layout.jsx
import { Stack } from 'expo-router';

export default function ShipperLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" options={{ title: 'Bảng điều khiển' }} />
    </Stack>
  );
}