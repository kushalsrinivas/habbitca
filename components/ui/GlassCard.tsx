import { glassStyles } from "@/constants/Colors";
import { BlurView } from "expo-blur";
import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";

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

  // Safely render children, wrapping strings in Text components
  const safeChildren =
    React.Children.map(children, (child) => {
      if (typeof child === "string") {
        return <Text>{child}</Text>;
      }
      return child;
    }) || children;

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
      <View style={styles.content}>{safeChildren}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    position: "relative",
    zIndex: 1,
  },
});
