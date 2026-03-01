import { useState } from 'react';
import { View, Text, ScrollView, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, RegisterInput } from '@/schemas/auth';
import { AuthStackParamList } from '@/navigation/types';
import { api } from '@/lib/api';
import { mapServerErrorsToForm } from '@/lib/errorMap';
import Input from '@/components/Input';
import PasswordInput from '@/components/PasswordInput';
import Button from '@/components/Button';
import Toast from '@/components/Toast';

type Nav = StackNavigationProp<AuthStackParamList, 'Signup'>;

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: '20%' };
  if (score <= 2) return { label: 'Fair', color: 'bg-orange-400', width: '40%' };
  if (score <= 3) return { label: 'Good', color: 'bg-yellow-400', width: '60%' };
  if (score <= 4) return { label: 'Strong', color: 'bg-green-400', width: '80%' };
  return { label: 'Very Strong', color: 'bg-green-600', width: '100%' };
}

export default function SignupScreen() {
  const nav = useNavigation<Nav>();
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as const });

  const { control, handleSubmit, formState: { errors, isSubmitting, isValid }, setError, watch, setFocus } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    mode: 'onBlur',
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '', dob: '', termsAccepted: false as any },
  });

  const password = watch('password') || '';
  const strength = getPasswordStrength(password);

  const onSubmit = async (data: RegisterInput) => {
    try {
      const res = await api.post<any>('/api/auth/register', data);
      if (res.success) {
        nav.navigate('OTP', { userId: res.data.userId, phone: data.phone });
      } else {
        mapServerErrorsToForm(res.error, setError);
      }
    } catch {
      setToast({ visible: true, message: 'Network error. Please try again.', type: 'error' });
    }
  };

  const onError = () => {
    const firstError = Object.keys(errors)[0] as keyof RegisterInput;
    if (firstError) setFocus(firstError);
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 24 }}>
      <Text className="text-3xl font-bold text-gray-900 mb-2">Create Account</Text>
      <Text className="text-base text-gray-500 mb-8">Sign up to order your favorite food</Text>

      <Controller control={control} name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Full Name" required placeholder="John Doe"
            value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} />
        )} />

      <Controller control={control} name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Email" required placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none"
            value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} />
        )} />

      <Controller control={control} name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Phone" required placeholder="+14155551234" keyboardType="phone-pad"
            value={value} onChangeText={(t: string) => onChange(t.replace(/[^\d+]/g, ''))} onBlur={onBlur} error={errors.phone?.message} />
        )} />

      <Controller control={control} name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <PasswordInput label="Password" placeholder="Min 8 chars, 1 uppercase, 1 number"
              value={value} onChangeText={(t: string) => onChange(t.replace(/\s/g, ''))} onBlur={onBlur} error={errors.password?.message} />
            {password.length > 0 && (
              <View className="mb-4 -mt-2">
                <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <View className={`h-full ${strength.color} rounded-full`} style={{ width: strength.width as any }} />
                </View>
                <Text className="text-xs text-gray-500 mt-1">{strength.label}</Text>
              </View>
            )}
          </View>
        )} />

      <Controller control={control} name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <PasswordInput label="Confirm Password" placeholder="Re-enter password"
            value={value} onChangeText={onChange} onBlur={onBlur} error={errors.confirmPassword?.message} />
        )} />

      <Controller control={control} name="dob"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Date of Birth" required placeholder="YYYY-MM-DD"
            value={value} onChangeText={onChange} onBlur={onBlur} error={errors.dob?.message} />
        )} />

      <Controller control={control} name="termsAccepted"
        render={({ field: { onChange, value } }) => (
          <View className="flex-row items-center mb-6">
            <Switch value={value as any} onValueChange={onChange} trackColor={{ true: '#ef4444' }} />
            <Text className="ml-3 text-sm text-gray-600 flex-1">I accept the Terms of Service & Privacy Policy</Text>
          </View>
        )} />
      {errors.termsAccepted ? <Text className="text-red-500 text-xs -mt-4 mb-4">{errors.termsAccepted.message as string}</Text> : null}

      <Button label="Create Account" onPress={handleSubmit(onSubmit, onError)} loading={isSubmitting} disabled={!isValid} />

      <Text className="text-center text-gray-500 mt-6">
        Already have an account?{' '}
        <Text className="text-red-500 font-semibold" onPress={() => nav.navigate('Login')}>Log in</Text>
      </Text>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={() => setToast(t => ({ ...t, visible: false }))} />
    </ScrollView>
  );
}