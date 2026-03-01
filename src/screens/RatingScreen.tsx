import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RatingSchema, RatingInput } from '@/schemas/rating';
import { HomeStackParamList } from '@/navigation/types';
import { api } from '@/lib/api';
import StarRating from '@/components/StarRating';
import Button from '@/components/Button';
import Toast from '@/components/Toast';

type Nav = StackNavigationProp<HomeStackParamList, 'Rating'>;
type Route = RouteProp<HomeStackParamList, 'Rating'>;

const TAG_OPTIONS = ['Fast delivery', 'Great food', 'Good packaging', 'Friendly rider', 'Hot & fresh', 'Value for money'];

export default function RatingScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { orderId } = route.params;
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as 'error' | 'success' | 'info' });

  const { control, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<RatingInput>({
    resolver: zodResolver(RatingSchema),
    mode: 'onBlur',
    defaultValues: { restaurantRating: 0, riderRating: 0, review: '', tags: [] },
  });

  const tags = watch('tags') || [];
  const review = watch('review') || '';

  const toggleTag = (tag: string) => {
    const current = tags;
    if (current.includes(tag)) {
      setValue('tags', current.filter((t) => t !== tag));
    } else if (current.length < 10) {
      setValue('tags', [...current, tag]);
    }
  };

  const onSubmit = async (data: RatingInput) => {
    try {
      const res = await api.post<any>(`/api/orders/${orderId}/rate`, data);
      if (res.success) {
        setToast({ visible: true, message: 'Thanks for your feedback!', type: 'success' });
        setTimeout(() => nav.popToTop(), 1500);
      } else {
        setToast({ visible: true, message: res.error?.message || 'Could not submit rating', type: 'error' });
      }
    } catch {
      setToast({ visible: true, message: 'Network error', type: 'error' });
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 48 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-2">Rate Your Order</Text>
        <Text className="text-base text-gray-500 mb-8">How was your experience?</Text>

        {/* Restaurant rating */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Restaurant</Text>
          <Controller control={control} name="restaurantRating"
            render={({ field: { value, onChange } }) => (
              <StarRating value={value} onChange={onChange} />
            )} />
          {errors.restaurantRating && (
            <Text className="text-red-500 text-xs mt-1">{errors.restaurantRating.message}</Text>
          )}
        </View>

        {/* Rider rating */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Delivery Rider</Text>
          <Controller control={control} name="riderRating"
            render={({ field: { value, onChange } }) => (
              <StarRating value={value} onChange={onChange} />
            )} />
          {errors.riderRating && (
            <Text className="text-red-500 text-xs mt-1">{errors.riderRating.message}</Text>
          )}
        </View>

        {/* Tags */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">What stood out?</Text>
          <View className="flex-row flex-wrap gap-2">
            {TAG_OPTIONS.map((tag) => {
              const selected = tags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  className={`rounded-full px-4 py-2 border ${selected ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                >
                  <Text className={`text-sm ${selected ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Review */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Review (optional)</Text>
          <Controller control={control} name="review"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 bg-white min-h-[100px]"
                placeholder="Share your experience..."
                placeholderTextColor="#9ca3af"
                multiline
                textAlignVertical="top"
                maxLength={500}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )} />
          <Text className="text-xs text-gray-400 text-right mt-1">{review.length}/500</Text>
        </View>

        <Button label="Submit Rating" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
      </ScrollView>

      <Toast message={toast.message} type={toast.type} visible={toast.visible}
        onDismiss={() => setToast(t => ({ ...t, visible: false }))} />
    </View>
  );
}