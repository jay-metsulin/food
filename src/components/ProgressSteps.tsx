import { View, Text } from 'react-native';

interface ProgressStepsProps {
  steps: string[];
  currentStep: number;
}

export default function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-6">
      {steps.map((step, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        const isLast = i === steps.length - 1;

        return (
          <View key={i} className="flex-1 items-center">
            <View className="flex-row items-center w-full">
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  isCompleted ? 'bg-green-500' : isCurrent ? 'bg-red-500' : 'bg-gray-200'
                }`}
              >
                <Text className={`text-sm font-bold ${isCompleted || isCurrent ? 'text-white' : 'text-gray-500'}`}>
                  {isCompleted ? '✓' : i + 1}
                </Text>
              </View>
              {!isLast && (
                <View className={`flex-1 h-0.5 mx-1 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </View>
            <Text className={`text-xs mt-1 text-center ${isCurrent ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
              {step}
            </Text>
          </View>
        );
      })}
    </View>
  );
}