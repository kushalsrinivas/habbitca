import { Colors } from "@/constants/Colors";
import type { Habit } from "@/hooks/useDatabase";
import { Ionicons } from "@expo/vector-icons";
import type React from "react";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { GlassCard } from "./GlassCard";

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  streak: number;
  onToggleComplete: () => void;
  onPress?: () => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  isCompleted,
  streak,
  onToggleComplete,
  onPress,
}) => {
  const [showXPGain, setShowXPGain] = useState(false);
  const checkScale = useSharedValue(isCompleted ? 1 : 0);
  const cardScale = useSharedValue(1);
  const xpOpacity = useSharedValue(0);
  const xpTranslateY = useSharedValue(0);

  useEffect(() => {
    checkScale.value = withSpring(isCompleted ? 1 : 0, {
      damping: 15,
      stiffness: 300,
    });
  }, [isCompleted, checkScale]);

  const handleToggleComplete = () => {
    if (!isCompleted) {
      // Celebration animation
      cardScale.value = withSequence(
        withSpring(1.05, { damping: 15, stiffness: 300 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );

      // XP gain animation
      xpOpacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 300 })
      );

      xpTranslateY.value = withSequence(withTiming(-30, { duration: 1600 }));

      runOnJS(setShowXPGain)(true);
      setTimeout(() => runOnJS(setShowXPGain)(false), 1600);
    }

    onToggleComplete();
  };

  const checkAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: checkScale.value }],
    };
  });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: cardScale.value }],
    };
  });

  const xpAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: xpOpacity.value,
      transform: [{ translateY: xpTranslateY.value }],
    };
  });

  const getStreakColor = () => {
    if (streak === 0) return Colors.dark.streak.none;
    if (streak < 7) return Colors.dark.streak.low;
    if (streak < 21) return Colors.dark.streak.medium;
    if (streak < 50) return Colors.dark.streak.high;
    return Colors.dark.streak.max;
  };

  return (
    <Animated.View style={cardAnimatedStyle}>
      <GlassCard style={styles.card}>
        <Pressable onPress={onPress} style={styles.content}>
          <View style={styles.header}>
            <View style={styles.habitInfo}>
              <Text style={styles.title}>{habit.title}</Text>
              <Text style={styles.description}>{habit.description}</Text>
              <Text style={styles.time}>⏰ {habit.time}</Text>
            </View>

            <Pressable
              onPress={handleToggleComplete}
              style={styles.checkButton}
            >
              <View
                style={[
                  styles.checkCircle,
                  isCompleted && styles.checkCircleCompleted,
                ]}
              >
                <Animated.View style={checkAnimatedStyle}>
                  <Ionicons
                    name="checkmark"
                    size={24}
                    color={Colors.dark.textPrimary}
                  />
                </Animated.View>
              </View>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <View style={styles.streakContainer}>
              <View
                style={[
                  styles.streakDot,
                  { backgroundColor: getStreakColor() },
                ]}
              />
              <Text style={styles.streakText}>
                {streak} day{streak !== 1 ? "s" : ""} streak
              </Text>
            </View>
          </View>
        </Pressable>

        {showXPGain && (
          <Animated.View style={[styles.xpGain, xpAnimatedStyle]}>
            <Text style={styles.xpGainText}>
              +{10 + Math.floor(streak / 7) * 5} XP
            </Text>
          </Animated.View>
        )}
      </GlassCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  habitInfo: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  checkButton: {
    padding: 4,
  },
  checkCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.clay.background,
    borderWidth: 2,
    borderColor: Colors.dark.clay.border,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.dark.clay.shadow,
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  checkCircleCompleted: {
    backgroundColor: Colors.dark.success,
    borderColor: Colors.dark.success,
    shadowColor: Colors.dark.success,
    shadowOpacity: 0.8,
  },
  footer: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  streakText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontWeight: "500",
  },
  xpGain: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: Colors.dark.xp.fill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: Colors.dark.xp.fill,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 8,
  },
  xpGainText: {
    color: Colors.dark.textPrimary,
    fontSize: 12,
    fontWeight: "bold",
  },
});
