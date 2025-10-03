import { View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "../src/store/auth";

export default function Home() {
  const { clear } = useAuth();
  return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center", gap:12 }}>
      <Text style={{ fontSize:22, fontWeight:"700" }}>Xin chào!</Text>
      <TouchableOpacity onPress={clear} style={{ padding:12, backgroundColor:"#a00", borderRadius:10 }}>
        <Text style={{ color:"#fff" }}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}
