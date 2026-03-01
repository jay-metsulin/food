import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckoutSchema } from '@/schemas/order';
import { HomeStackParamList } from '@/navigation/types';
import { useCartStore } from '@/store/cart';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { mapServerErrorsToForm } from '@/lib/errorMap';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Toast from '@/components/Toast';

type Nav = StackNavigationProp<HomeStackParamList, 'Checkout'>;

const TIP_OPTIONS = [0, 2, 5, 10];
const PAYMENT_METHODS = [
  { value: 'stripe_card', label: '💳 Card (Stripe)' },
  { value: 'cash', label: '💵 Cash' },
  { value: 'wallet', label: '👛 Wallet' },
] as const;

export default function CheckoutScreen() {
  const nav = useNavigation<Nav>();
  const { items, subtotal, restaurantId, clearCart } = useCartStore();
  const { userId } = useAuth();
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as 'error' | 'success' | 'info' });

  const sub = subtotal();
  const deliveryFee = 2.99;
  const tax = sub * 0.08;

  const { control, handleSubmit, formState: { errors, isSubmitting }, setError, watch, setValue } = useForm({
    resolver: zodResolver(CheckoutSchema),
    mode: 'onBlur',
    defaultValues: {
      addressId: 'a1', // default seed address
      paymentMethod: 'stripe_card' as const,
      promoCode: '',
      tipAmount: 0,
      deliveryNotes: '',
    },
  });

  const tip = watch('tipAmount') || 0;
  const total = sub + deliveryFee + tax + tip;

  const onSubmit = async (data: any) => {
    try {
      const orderPayload = {
        ...data,
        restaurantId,
        userId,
        subtotal: sub,
        deliveryFee,
        tax,
        total,
        discount: 0,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          unitPrice: i.price,
          customizations: i.customizations || {},
        })),
      };
      const res = await api.post<any>('/api/orders/create', orderPayload);
      if (res.success) {
        clearCart();
        nav.navigate('OrderTracking', { orderId: res.data.orderId });
      } else {
        mapServerErrorsToForm(res.error, setError);
        if (res.error?.message) setToast({ visible: true, message: res.error.message, type: 'error' });
      }
    } catch {
      setToast({ visible: true, message: 'Network error', type: 'error' });
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 48 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-6">Checkout</Text>

        {/* Address */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Delivery Address</Text>
          <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <Text className="text-base text-gray-900 font-semibold">🏠 Home</Text>
            <Text className="text-sm text-gray-500 mt-1">123 Main St, San Francisco, CA 94102</Text>
          </View>
        </View>

        {/* Payment method */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Payment Method</Text>
          <Controller control={control} name="paymentMethod"
            render={({ field: { value, onChange } }) => (
              <View className="gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <TouchableOpacity
                    key={m.value}
                    onPress={() => onChange(m.value)}
                    className={`rounded-xl p-4 border ${value === m.value ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                  >
                    <Text className={`text-base ${value === m.value ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )} />
        </View>

        {/* Tip selector */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Add a tip</Text>
          <Controller control={control} name="tipAmount"
            render={({ field: { value, onChange } }) => (
              <View className="flex-row gap-2">
                {TIP_OPTIONS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => onChange(t)}
                    className={`flex-1 rounded-xl py-3 items-center border ${value === t ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                  >
                    <Text className={`font-bold ${value === t ? 'text-red-600' : 'text-gray-700'}`}>
                      {t === 0 ? 'None' : `$${t}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )} />
        </View>

        {/* Delivery notes */}
        <Controller control={control} name="deliveryNotes"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-6">
              <Input label="Delivery Notes" placeholder="Ring doorbell, leave at door..."
                value={value} onChangeText={onChange} onBlur={onBlur}
                error={errors.deliveryNotes?.message} maxLength={200} />
              <Text className="text-xs text-gray-400 text-right -mt-2">{(value || '').length}/200</Text>
            </View>
          )} />

        {/* Summary */}
        <View className="bg-gray-50 rounded-xl p-4 gap-2 mb-6">
          <View className="flex-row justify-between">
            <Text className="text-gray-500">Subtotal</Text>
            <Text className="font-semibold">${sub.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-500">Delivery</Text>
            <Text className="font-semibold">${deliveryFee.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-500">Tax</Text>
            <Text className="font-semibold">${tax.toFixed(2)}</Text>
          </View>
          {tip > 0 && (
            <View className="flex-row justify-between">
              <Text className="text-gray-500">Tip</Text>
              <Text className="font-semibold">${tip.toFixed(2)}</Text>
            </View>
          )}
          <View className="flex-row justify-between border-t border-gray-200 pt-2 mt-1">
            <Text className="text-lg font-bold">Total</Text>
            <Text className="text-lg font-bold">${total.toFixed(2)}</Text>
          </View>
        </View>

        <Button label={`Place Order — $${total.toFixed(2)}`} onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
      </ScrollView>

      <Toast message={toast.message} type={toast.type} visible={toast.visible}
        onDismiss={() => setToast(t => ({ ...t, visible: false }))} />
    </View>
  );
}