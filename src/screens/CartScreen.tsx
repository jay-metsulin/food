import { useState } from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '@/navigation/types';
import { useCartStore } from '@/store/cart';
import { api } from '@/lib/api';
import CartItemRow from '@/components/CartItemRow';
import Button from '@/components/Button';
import Toast from '@/components/Toast';

type Nav = StackNavigationProp<HomeStackParamList, 'Cart'>;

export default function CartScreen() {
  const nav = useNavigation<Nav>();
  const { items, updateQty, removeItem, subtotal, clearCart } = useCartStore();
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as 'error' | 'success' | 'info' });

  const sub = subtotal();
  const deliveryFee = 2.99;
  const tax = sub * 0.08;
  const total = sub + deliveryFee + tax - discount;

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const res = await api.post<any>('/api/promo/validate', { code: promoCode, subtotal: sub });
      if (res.success) {
        setDiscount(res.data.discount);
        setToast({ visible: true, message: `Promo applied! -$${res.data.discount.toFixed(2)}`, type: 'success' });
      } else {
        setDiscount(0);
        setToast({ visible: true, message: res.error?.message || 'Invalid promo code', type: 'error' });
      }
    } catch {
      setToast({ visible: true, message: 'Network error', type: 'error' });
    } finally {
      setPromoLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <Text className="text-5xl mb-4">🛒</Text>
        <Text className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</Text>
        <Text className="text-gray-500 text-center mb-6">Add items from a restaurant to get started</Text>
        <Button label="Browse Restaurants" onPress={() => nav.goBack()} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView>
        <View className="px-4 pt-12 pb-4 border-b border-gray-100">
          <Text className="text-2xl font-bold text-gray-900">Your Cart</Text>
        </View>

        {items.map((item) => (
          <CartItemRow
            key={item.menuItemId}
            item={item}
            onQtyChange={(qty) => updateQty(item.menuItemId, qty)}
            onRemove={() => removeItem(item.menuItemId)}
          />
        ))}

        {/* Promo code */}
        <View className="px-4 py-4 border-t border-gray-100">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Promo Code</Text>
          <View className="flex-row gap-2">
            <TextInput
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 bg-white"
              placeholder="Enter code"
              placeholderTextColor="#9ca3af"
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters"
            />
            <Button label="Apply" variant="secondary" onPress={applyPromo} loading={promoLoading} />
          </View>
        </View>

        {/* Order summary */}
        <View className="px-4 py-4 border-t border-gray-100 gap-2">
          <Text className="text-lg font-bold text-gray-900 mb-2">Order Summary</Text>
          <View className="flex-row justify-between">
            <Text className="text-gray-500">Subtotal</Text>
            <Text className="text-gray-900 font-semibold">${sub.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-500">Delivery Fee</Text>
            <Text className="text-gray-900 font-semibold">{`$${deliveryFee.toFixed(2)}`}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-500">Tax</Text>
            <Text className="text-gray-900 font-semibold">{`$${tax.toFixed(2)}`}</Text>
          </View>
          {discount > 0 && (
            <View className="flex-row justify-between">
              <Text className="text-green-600">Discount</Text>
              <Text className="text-green-600 font-semibold">-${discount.toFixed(2)}</Text>
            </View>
          )}
          <View className="flex-row justify-between pt-2 border-t border-gray-200 mt-2">
            <Text className="text-lg font-bold text-gray-900">Total</Text>
            <Text className="text-lg font-bold text-gray-900">{`$${total.toFixed(2)}`}</Text>
          </View>
        </View>
      </ScrollView>

      <View className="px-4 py-4 border-t border-gray-100">
        <Button label={`Checkout — $${total.toFixed(2)}`} onPress={() => nav.navigate('Checkout')} />
      </View>

      <Toast message={toast.message} type={toast.type} visible={toast.visible}
        onDismiss={() => setToast(t => ({ ...t, visible: false }))} />
    </View>
  );
}
