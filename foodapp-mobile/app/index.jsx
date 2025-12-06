import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../src/store/auth";

export default function Index() {
  const { hydrate, user } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => { (async () => { await hydrate(); setReady(true); })(); }, []);

  if (!ready) {
    return (
      <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  // Redirect to login if not logged in, otherwise home
  return <Redirect href={user ? "/home" : "/login"} />;
}
