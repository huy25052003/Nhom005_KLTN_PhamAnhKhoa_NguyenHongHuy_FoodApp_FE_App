import 'dotenv/config';

export default {
  expo: {
    name: "FoodApp Mobile",
    slug: "foodapp-mobile",
    scheme: "foodapp",
    extra: {
      apiBaseUrl: process.env.API_BASE_URL
    }
  }
}
