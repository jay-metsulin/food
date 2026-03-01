import { View, Text, Image, TouchableOpacity } from 'react-native';

interface Restaurant {
  id: string;
  name: string;
  logo_url: string;
  rating: number;
  eta_min: number;
  delivery_fee: number;
  description?: string;
}

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress?: () => void;
}

export default function RestaurantCard({ restaurant, onPress }: RestaurantCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl overflow-hidden mb-4 border border-gray-100"
      activeOpacity={0.7}
    >
      <View className="h-36 bg-gray-200 items-center justify-center">
        {restaurant.logo_url ? (
          <Image source={{ uri: restaurant.logo_url }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <Text className="text-4xl">🍽️</Text>
        )}
      </View>
      <View className="p-3">
        <Text className="text-lg font-bold text-gray-900">{restaurant.name}</Text>
        {restaurant.description ? (
          <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>{restaurant.description}</Text>
        ) : null}
        <View className="flex-row items-center mt-2 gap-3">
          <View className="flex-row items-center">
            <Text className="text-yellow-500 mr-1">★</Text>
            <Text className="text-sm font-semibold text-gray-700">{restaurant.rating.toFixed(1)}</Text>
          </View>
          <Text className="text-gray-300">|</Text>
          <Text className="text-sm text-gray-500">{restaurant.eta_min} min</Text>
          <Text className="text-gray-300">|</Text>
          <Text className="text-sm text-gray-500">
            {restaurant.delivery_fee === 0 ? 'Free delivery' : `$${restaurant.delivery_fee.toFixed(2)} delivery`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}