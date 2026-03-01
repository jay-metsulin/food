import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
}

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: 'bg-red-500 rounded-xl py-4 px-6',
    text: 'text-white font-bold text-base',
  },
  secondary: {
    container: 'bg-gray-100 border border-gray-300 rounded-xl py-4 px-6',
    text: 'text-gray-800 font-bold text-base',
  },
  ghost: {
    container: 'py-4 px-6',
    text: 'text-red-500 font-bold text-base',
  },
};

export default function Button({ label, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  const styles = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`items-center justify-center flex-row ${styles.container} ${isDisabled ? 'opacity-50' : ''}`}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#ef4444'} size="small" />
      ) : (
        <Text className={styles.text}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}