import { Colors, clayStyles } from "@/constants/Colors";
import type React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface ClayButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "success" | "warning" | "error";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ClayButton: React.FC<ClayButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  style,
  textStyle,
}) => {
  const pressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(pressed.value ? 0.95 : 1, {
            damping: 15,
            stiffness: 300,
          }),
        },
      ],
    };
  });

  const getVariantColor = () => {
    switch (variant) {
      case "primary":
        return Colors.dark.primary;
      case "secondary":
        return Colors.dark.secondary;
      case "success":
        return Colors.dark.success;
      case "warning":
        return Colors.dark.warning;
      case "error":
        return Colors.dark.error;
      default:
        return Colors.dark.primary;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 };
      case "medium":
        return { paddingHorizontal: 24, paddingVertical: 12, fontSize: 16 };
      case "large":
        return { paddingHorizontal: 32, paddingVertical: 16, fontSize: 18 };
      default:
        return { paddingHorizontal: 24, paddingVertical: 12, fontSize: 16 };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <AnimatedPressable
      style={[
        clayStyles.button,
        {
          backgroundColor: disabled
            ? Colors.dark.clay.shadow
            : Colors.dark.clay.background,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          opacity: disabled ? 0.5 : 1,
        },
        animatedStyle,
        style,
      ]}
      onPressIn={() => {
        pressed.value = true;
      }}
      onPressOut={() => {
        pressed.value = false;
      }}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.text,
          {
            color: disabled ? Colors.dark.textMuted : getVariantColor(),
            fontSize: sizeStyles.fontSize,
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
});
