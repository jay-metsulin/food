import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginInput } from '@/schemas/auth';
import { AuthStackParamList } from '@/navigation/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { mapServerErrorsToForm } from '@/lib/errorMap';
import Input from '@/components/Input';
import PasswordInput from '@/components/PasswordInput';
import Button from '@/components/Button';
import Toast from '@/components/Toast';

type Nav = StackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const nav = useNavigation<Nav>();
  const { setAuth } = useAuth();
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as 'error' | 'success' | 'info' });
  const [lockCountdown, setLockCountdown] = useState(0);

  const { control, handleSubmit, formState: { errors, isSubmitting, isValid }, setError, setFocus } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (lockCountdown <= 0) return;
    const timer = setInterval(() => setLockCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [lockCountdown]);

  const onSubmit = async (data: LoginInput) => {
    try {
      const res = await api.post<any>('/api/auth/login', data);
      if (res.success) {
        setAuth(res.data.accessToken, res.data.user.id, res.data.user);
      } else if (res.error?.code === 'ACCOUNT_LOCKED') {
        const lockedUntil = new Date(res.error.lockedUntil);
        const secondsLeft = Math.max(0, Math.floor((lockedUntil.getTime() - Date.now()) / 1000));
        setLockCountdown(secondsLeft);
        setToast({ visible: true, message: `Account locked. Try again in ${Math.ceil(secondsLeft / 60)} min.`, type: 'error' });
      } else {
        mapServerErrorsToForm(res.error, setError);
      }
    } catch {
      setToast({ visible: true, message: 'Network error. Please try again.', type: 'error' });
    }
  };

  const onError = () => {
    const firstError = Object.keys(errors)[0] as keyof LoginInput;
    if (firstError) setFocus(firstError);
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 24, paddingTop: 64 }}>
      <Text className="text-4xl mb-1">🍔</Text>
      <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome back</Text>
      <Text className="text-base text-gray-500 mb-8">Log in to order delicious food</Text>

      <Controller control={control} name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Email" required placeholder="test@example.com" keyboardType="email-address" autoCapitalize="none"
            value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} />
        )} />

      <Controller control={control} name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <PasswordInput label="Password" placeholder="Enter your password"
            value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} />
        )} />

      {lockCountdown > 0 && (
        <View className="bg-red-50 rounded-xl p-3 mb-4">
          <Text className="text-red-600 text-sm font-semibold text-center">
            Account locked. Try again in {Math.floor(lockCountdown / 60)}:{String(lockCountdown % 60).padStart(2, '0')}
          </Text>
        </View>
      )}

      <Button label="Log In" onPress={handleSubmit(onSubmit, onError)} loading={isSubmitting} disabled={!isValid || lockCountdown > 0} />

      <Text className="text-center text-gray-500 mt-6">
        Don't have an account?{' '}
        <Text className="text-red-500 font-semibold" onPress={() => nav.navigate('Signup')}>Sign up</Text>
      </Text>

      <View className="mt-6 bg-gray-50 rounded-xl p-4">
        <Text className="text-xs text-gray-400 text-center">Demo: test@example.com / Password1</Text>
      </View>

      <Toast message={toast.message} type={toast.type} visible={toast.visible}
        onDismiss={() => setToast(t => ({ ...t, visible: false }))} />
    </ScrollView>
  );
}