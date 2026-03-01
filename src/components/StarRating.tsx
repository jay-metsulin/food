import { View, Text, TouchableOpacity } from 'react-native';

interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
}

export default function StarRating({ value, onChange, readonly }: StarRatingProps) {
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => !readonly && onChange?.(star)}
          disabled={readonly}
          activeOpacity={readonly ? 1 : 0.6}
        >
          <Text className={`text-3xl ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}