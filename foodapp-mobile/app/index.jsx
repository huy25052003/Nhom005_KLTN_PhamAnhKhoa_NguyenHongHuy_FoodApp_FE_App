import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../src/store/auth";

export default function Index() {
  const { token, hydrate } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => { (async () => { await hydrate(); setReady(true); })(); }, []);

  if (!ready) {
    return (
      <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!token) return <Redirect href="/login" />;
  return <Redirect href="/home" />;
}
