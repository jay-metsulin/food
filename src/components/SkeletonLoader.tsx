import { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface SkeletonLoaderProps {
  width: number | string;
  height: number;
  borderRadius?: number;
}

export default function SkeletonLoader({ width, height, borderRadius = 8 }: SkeletonLoaderProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const style: ViewStyle = {
    width: width as any,
    height,
    borderRadius,
    backgroundColor: '#e5e7eb',
  };

  return <Animated.View style={[style, { opacity }]} />;
}