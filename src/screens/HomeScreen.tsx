import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '@/navigation/types';
import { api } from '@/lib/api';
import RestaurantCard from '@/components/RestaurantCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import OfflineBanner from '@/components/OfflineBanner';

type Nav = StackNavigationProp<HomeStackParamList, 'HomeScreen'>;

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchRestaurants = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/api/restaurants?q=${encodeURIComponent(q)}`);
      if (res.success) setRestaurants(res.data);
    } catch {
      // offline — keep existing data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants('');
  }, [fetchRestaurants]);

  const handleSearch = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchRestaurants(text), 300);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <OfflineBanner />
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900 mb-3">What are you craving?</Text>
        <View className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center">
          <Text className="text-gray-400 mr-2">🔍</Text>
          <TextInput
            className="flex-1 text-base text-gray-900"
            placeholder="Search restaurants..."
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {loading ? (
        <View className="p-4 gap-4">
          {[1, 2, 3].map((i) => (
            <View key={i} className="gap-3">
              <SkeletonLoader width="100%" height={144} borderRadius={16} />
              <SkeletonLoader width="60%" height={20} />
              <SkeletonLoader width="40%" height={16} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              onPress={() => nav.navigate('Restaurant', { restaurantId: item.id })}
            />
          )}
          ListEmptyComponent={
            <View className="items-center mt-16">
              <Text className="text-4xl mb-3">🍽️</Text>
              <Text className="text-gray-500 text-base">No restaurants found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}