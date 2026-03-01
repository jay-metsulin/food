import { View, Text, Image, TouchableOpacity } from 'react-native';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: number;
}

interface MenuItemCardProps {
  item: MenuItem;
  onAdd: () => void;
}

export default function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
  const unavailable = !item.is_available;

  return (
    <View className={`flex-row bg-white rounded-xl p-3 mb-3 border border-gray-100 ${unavailable ? 'opacity-50' : ''}`}>
      <View className="flex-1 mr-3 justify-center">
        <Text className="text-base font-semibold text-gray-900">{item.name}</Text>
        {item.description ? (
          <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>{item.description}</Text>
        ) : null}
        <Text className="text-base font-bold text-gray-800 mt-2">${item.price.toFixed(2)}</Text>
      </View>
      <View className="items-center">
        <View className="w-20 h-20 rounded-xl bg-gray-100 items-center justify-center overflow-hidden">
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <Text className="text-2xl">🍴</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={onAdd}
          disabled={unavailable}
          className="bg-red-500 rounded-lg px-4 py-1.5 mt-2"
          activeOpacity={0.7}
        >
          <Text className="text-white text-sm font-bold">+ Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}