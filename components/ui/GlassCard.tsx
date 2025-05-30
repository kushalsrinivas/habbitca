import { glassStyles } from "@/constants/Colors";
import { BlurView } from "expo-blur";
import type React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: "light" | "dark" | "default";
  variant?: "card" | "container";
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 20,
  tint = "dark",
  variant = "card",
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case "card":
        return glassStyles.card;
      case "container":
        return glassStyles.container;
      default:
        return glassStyles.card;
    }
  };

  return (
    <View style={[getVariantStyle(), style]}>
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: variant === "card" ? 16 : 0 },
        ]}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    position: "relative",
    zIndex: 1,
  },
});
