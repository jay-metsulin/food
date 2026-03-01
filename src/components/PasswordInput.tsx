import { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';

interface PasswordInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export default function PasswordInput({ label, error, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-1">{label}</Text>
      <View className="flex-row items-center border rounded-xl bg-white overflow-hidden"
        style={{ borderColor: error ? '#f87171' : '#d1d5db' }}>
        <TextInput
          className="flex-1 px-4 py-3 text-base text-gray-900"
          placeholderTextColor="#9ca3af"
          secureTextEntry={!visible}
          autoCapitalize="none"
          {...props}
        />
        <TouchableOpacity onPress={() => setVisible(!visible)} className="px-3">
          <Text className="text-gray-500 text-sm">{visible ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text className="text-red-500 text-xs mt-1">{error}</Text> : null}
    </View>
  );
}