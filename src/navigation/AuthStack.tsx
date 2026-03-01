import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from './types';
import SplashScreen from '@/screens/SplashScreen';
import SignupScreen from '@/screens/SignupScreen';
import OTPScreen from '@/screens/OTPScreen';
import LoginScreen from '@/screens/LoginScreen';

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}