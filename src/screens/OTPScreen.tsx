import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '@/navigation/types';
import { api } from '@/lib/api';
import OTPInput from '@/components/OTPInput';
import Button from '@/components/Button';
import Toast from '@/components/Toast';

type Nav = StackNavigationProp<AuthStackParamList, 'OTP'>;
type Route = RouteProp<AuthStackParamList, 'OTP'>;

export default function OTPScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { userId, phone } = route.params;

  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as 'error' | 'success' | 'info' });

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleComplete = async (code: string) => {
    setLoading(true);
    try {
      const res = await api.post<any>('/api/auth/otp/verify', { userId, code });
      if (res.success) {
        setToast({ visible: true, message: 'Verified! Please log in.', type: 'success' });
        setTimeout(() => nav.navigate('Login'), 1500);
      } else {
        const msg = res.error?.message || res.error?.code || 'Invalid OTP';
        setToast({ visible: true, message: msg, type: 'error' });
      }
    } catch {
      setToast({ visible: true, message: 'Network error.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await api.post<any>('/api/auth/otp/resend', { userId });
      if (res.success) {
        setCountdown(60);
        setToast({ visible: true, message: 'Code resent!', type: 'success' });
      } else {
        setToast({ visible: true, message: res.error?.message || 'Could not resend.', type: 'error' });
      }
    } catch {
      setToast({ visible: true, message: 'Network error.', type: 'error' });
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <Text className="text-3xl font-bold text-gray-900 mb-2">Verify Phone</Text>
      <Text className="text-base text-gray-500 mb-8">
        Enter the 6-digit code sent to {phone}
      </Text>

      <OTPInput length={6} onComplete={handleComplete} />

      {loading && <Text className="text-center text-gray-500 mt-4">Verifying...</Text>}

      <View className="mt-8 items-center">
        {countdown > 0 ? (
          <Text className="text-gray-400 text-sm">Resend code in {countdown}s</Text>
        ) : (
          <Button label="Resend Code" variant="ghost" onPress={handleResend} />
        )}
      </View>

      <Toast message={toast.message} type={toast.type} visible={toast.visible}
        onDismiss={() => setToast(t => ({ ...t, visible: false }))} />
    </View>
  );
}