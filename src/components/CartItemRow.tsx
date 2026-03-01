import { View, Text, TouchableOpacity } from 'react-native';

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartItemRowProps {
  item: CartItem;
  onQtyChange: (qty: number) => void;
  onRemove: () => void;
}

export default function CartItemRow({ item, onQtyChange, onRemove }: CartItemRowProps) {
  return (
    <View className="flex-row items-center py-3 px-4 border-b border-gray-100">
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900">{item.name}</Text>
        <Text className="text-sm text-gray-500 mt-0.5">${(item.price * item.quantity).toFixed(2)}</Text>
      </View>
      <View className="flex-row items-center bg-gray-100 rounded-lg">
        <TouchableOpacity
          onPress={() => item.quantity <= 1 ? onRemove() : onQtyChange(item.quantity - 1)}
          className="px-3 py-2"
        >
          <Text className="text-red-500 font-bold text-lg">{item.quantity <= 1 ? '🗑️' : '−'}</Text>
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900 px-2 min-w-[28px] text-center">
          {item.quantity}
        </Text>
        <TouchableOpacity
          onPress={() => onQtyChange(item.quantity + 1)}
          className="px-3 py-2"
        >
          <Text className="text-green-600 font-bold text-lg">+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}