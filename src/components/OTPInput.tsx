import { useRef, useState } from 'react';
import { View, TextInput, Text } from 'react-native';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
}

export default function OTPInput({ length = 6, onComplete }: OTPInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    // Handle paste (multi-character input)
    if (text.length > 1) {
      const chars = text.replace(/\D/g, '').split('').slice(0, length);
      const newValues = [...values];
      chars.forEach((char, i) => {
        if (index + i < length) newValues[index + i] = char;
      });
      setValues(newValues);
      const nextIndex = Math.min(index + chars.length, length - 1);
      inputs.current[nextIndex]?.focus();
      if (newValues.every((v) => v !== '')) onComplete(newValues.join(''));
      return;
    }

    const digit = text.replace(/\D/g, '');
    const newValues = [...values];
    newValues[index] = digit;
    setValues(newValues);

    if (digit && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }

    if (newValues.every((v) => v !== '')) {
      onComplete(newValues.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !values[index] && index > 0) {
      const newValues = [...values];
      newValues[index - 1] = '';
      setValues(newValues);
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View className="flex-row justify-center gap-2">
      {values.map((val, i) => (
        <TextInput
          key={i}
          ref={(ref) => { inputs.current[i] = ref; }}
          value={val}
          onChangeText={(text) => handleChange(text, i)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
          keyboardType="number-pad"
          maxLength={i === 0 ? length : 1}
          className="w-12 h-14 border-2 border-gray-300 rounded-xl text-center text-xl font-bold text-gray-900 bg-white"
          style={{ borderColor: val ? '#ef4444' : '#d1d5db' }}
        />
      ))}
    </View>
  );
}