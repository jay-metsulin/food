import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
}

export default function Input({ label, error, required, ...props }: InputProps) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-1">
        {label}{required ? <Text className="text-red-500"> *</Text> : null}
      </Text>
      <TextInput
        className={`border rounded-xl px-4 py-3 text-base text-gray-900 bg-white ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error ? <Text className="text-red-500 text-xs mt-1">{error}</Text> : null}
      {!error && props.value && props.value.length > 0 ? (
        <Text className="text-green-500 text-xs mt-1 absolute right-3 top-9">✓</Text>
      ) : null}
    </View>
  );
}