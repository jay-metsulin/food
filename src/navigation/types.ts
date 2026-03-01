export type AuthStackParamList = {
  Splash: undefined;
  Signup: undefined;
  OTP: { userId: string; phone: string };
  Login: undefined;
};
export type HomeStackParamList = {
  HomeScreen: undefined;
  Restaurant: { restaurantId: string };
  Cart: undefined;
  Checkout: undefined;
  OrderTracking: { orderId: string };
  Rating: { orderId: string };
};