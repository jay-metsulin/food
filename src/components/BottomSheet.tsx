import { useEffect, useRef } from 'react';
import { View, Modal, TouchableOpacity, Animated, Dimensions } from 'react-native';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const translateY = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20 }).start();
    } else {
      Animated.timing(translateY, { toValue: Dimensions.get('window').height, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible, translateY]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <TouchableOpacity className="flex-1 bg-black/40" onPress={onClose} activeOpacity={1} />
        <Animated.View
          style={{ transform: [{ translateY }] }}
          className="bg-white rounded-t-3xl max-h-[80%] pb-8"
        >
          <View className="items-center pt-3 pb-2">
            <View className="w-10 h-1 rounded-full bg-gray-300" />
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}