import { useState, useEffect } from 'react';
import { View, Text, SectionList, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '@/navigation/types';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import MenuItemCard from '@/components/MenuItemCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import BottomSheet from '@/components/BottomSheet';
import Button from '@/components/Button';

type Nav = StackNavigationProp<HomeStackParamList, 'Restaurant'>;
type Route = RouteProp<HomeStackParamList, 'Restaurant'>;

export default function RestaurantDetailScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { restaurantId } = route.params;

  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const { addItem, items, subtotal } = useCartStore();
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<any>(`/api/restaurants/${restaurantId}`);
        if (res.success) setRestaurant(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [restaurantId]);

  const handleAdd = (item: any) => {
    addItem(restaurantId, {
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
    });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white p-4 pt-16">
        <SkeletonLoader width="100%" height={180} borderRadius={16} />
        <View className="mt-4 gap-3">
          <SkeletonLoader width="70%" height={24} />
          <SkeletonLoader width="40%" height={18} />
        </View>
      </View>
    );
  }

  const sections = (restaurant?.categories || []).map((cat: any) => ({
    title: cat.name,
    data: (restaurant?.items || []).filter((item: any) => item.category_id === cat.id),
  }));

  return (
    <View className="flex-1 bg-white">
      <View className="bg-red-500 pt-12 pb-6 px-4">
        <TouchableOpacity onPress={() => nav.goBack()} className="mb-4">
          <Text className="text-white text-lg">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">{restaurant?.name}</Text>
        <Text className="text-white/70 mt-1">{restaurant?.description}</Text>
        <View className="flex-row mt-3 gap-4">
          <Text className="text-white">★ {restaurant?.rating?.toFixed(1)}</Text>
          <Text className="text-white/70">{restaurant?.eta_min} min</Text>
          <Text className="text-white/70">
            {restaurant?.delivery_fee === 0 ? 'Free delivery' : `$${restaurant?.delivery_fee?.toFixed(2)} delivery`}
          </Text>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section }) => (
          <View className="bg-gray-50 px-4 py-2 border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-900">{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View className="px-4">
            <MenuItemCard item={item} onAdd={() => handleAdd(item)} />
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center mt-16">
            <Text className="text-gray-400">No menu items available</Text>
          </View>
        }
      />

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <TouchableOpacity
          onPress={() => nav.navigate('Cart')}
          className="absolute bottom-6 left-4 right-4 bg-red-500 rounded-2xl flex-row items-center justify-between px-5 py-4"
          activeOpacity={0.9}
        >
          <View className="bg-white/20 rounded-lg px-2 py-1">
            <Text className="text-white font-bold">{cartCount}</Text>
          </View>
          <Text className="text-white font-bold text-base">View Cart</Text>
          <Text className="text-white font-bold">${subtotal().toFixed(2)}</Text>
        </TouchableOpacity>
      )}

      <BottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)}>
        {selectedItem && (
          <View className="px-6 pb-6">
            <Text className="text-xl font-bold text-gray-900 mb-2">{selectedItem.name}</Text>
            <Text className="text-gray-500 mb-4">{selectedItem.description}</Text>
            <Button label={`Add — $${selectedItem.price.toFixed(2)}`} onPress={() => {
              handleAdd(selectedItem);
              setSheetVisible(false);
            }} />
          </View>
        )}
      </BottomSheet>
    </View>
  );
}