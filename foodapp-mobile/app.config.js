import 'dotenv/config';

export default {
  expo: {
    name: "FoodApp Mobile",
    slug: "foodapp-mobile",
    scheme: "foodapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/foodapp.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/foodapp.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      package: "com.foodapp.mobile",
      adaptiveIcon: {
        foregroundImage: "./assets/foodapp.png",
        backgroundColor: "#3d7e4a"
      },
      edgeToEdgeEnabled: true
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-secure-store"
    ],
    extra: {
      apiBaseUrl: process.env.API_BASE_URL,
      wsUrl: process.env.WS_URL || process.env.API_BASE_URL?.replace('/api', '/ws'),
      eas: {
        projectId: "855c7f93-21ad-4d97-af70-5c25888403b1"
      }
    }
  }
}
