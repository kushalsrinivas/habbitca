import { Colors, clayStyles } from "@/constants/Colors";
import type React from "react";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface XPProgressBarProps {
  currentXP: number;
  neededXP: number;
  level: number;
  percentage: number;
}

export const XPProgressBar: React.FC<XPProgressBarProps> = ({
  currentXP,
  neededXP,
  level,
  percentage,
}) => {
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(percentage, {
      duration: 1000,
    });
  }, [percentage, progressWidth]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.levelText}>Level {level}</Text>
        <Text style={styles.xpText}>
          {currentXP} / {neededXP} XP
        </Text>
      </View>

      <View style={[clayStyles.inset, styles.progressContainer]}>
        <Animated.View style={[styles.progressBar, progressStyle]} />
        <View style={styles.progressOverlay}>
          <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  levelText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
  },
  xpText: {
    fontSize: 14,
    color: Colors.dark.xp.text,
  },
  progressContainer: {
    height: 24,
    position: "relative",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.dark.xp.fill,
    borderRadius: 16,
    shadowColor: Colors.dark.xp.fill,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  progressOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  percentageText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
