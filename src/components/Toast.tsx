import { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';

interface ToastProps {
  message: string;
  type: 'error' | 'success' | 'info';
  visible: boolean;
  onDismiss?: () => void;
}

const bgColors = {
  error: 'bg-red-500',
  success: 'bg-green-500',
  info: 'bg-blue-500',
};

export default function Toast({ message, type, visible, onDismiss }: ToastProps) {
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      const timer = setTimeout(() => {
        Animated.timing(translateY, { toValue: 100, duration: 300, useNativeDriver: true }).start(() => {
          onDismiss?.();
        });
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      translateY.setValue(100);
    }
  }, [visible, translateY, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{ transform: [{ translateY }] }}
      className={`absolute bottom-8 left-4 right-4 ${bgColors[type]} rounded-xl px-4 py-3 z-50`}
    >
      <Text className="text-white font-semibold text-center">{message}</Text>
    </Animated.View>
  );
}