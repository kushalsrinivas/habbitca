import { BlurView } from "expo-blur";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "@/constants/Colors";
import type { Achievement } from "@/hooks/useDatabase";
import { ClayButton } from "./ClayButton";

const { width, height } = Dimensions.get("window");

interface AchievementUnlockModalProps {
  visible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
}

export function AchievementUnlockModal({
  visible,
  achievement,
  onClose,
}: AchievementUnlockModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && achievement) {
      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      sparkleAnim.setValue(0);

      // Start celebration animation sequence
      Animated.sequence([
        // Scale in the medal
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        // Rotate and sparkle
        Animated.parallel([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.sequence([
              Animated.timing(sparkleAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(sparkleAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }),
            ]),
            { iterations: 3 }
          ),
        ]),
      ]).start();
    }
  }, [visible, achievement, scaleAnim, rotateAnim, sparkleAnim]);

  const getMedalColor = (type: Achievement["type"]) => {
    switch (type) {
      case "bronze":
        return "#CD7F32";
      case "silver":
        return "#C0C0C0";
      case "gold":
        return "#FFD700";
      case "platinum":
        return "#E5E4E2";
      default:
        return "#CD7F32";
    }
  };

  const getMedalGradient = (type: Achievement["type"]) => {
    switch (type) {
      case "bronze":
        return ["#CD7F32", "#8B4513"];
      case "silver":
        return ["#C0C0C0", "#808080"];
      case "gold":
        return ["#FFD700", "#FFA500"];
      case "platinum":
        return ["#E5E4E2", "#B8B8B8"];
      default:
        return ["#CD7F32", "#8B4513"];
    }
  };

  if (!achievement) return null;

  const scale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const sparkleScale = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity activeOpacity={1} style={styles.modal}>
              {/* Celebration Background */}
              <View style={styles.celebrationContainer}>
                {[...Array(8)].map((_, i) => (
                  <Animated.View
                    key={`sparkle-${i}`}
                    style={[
                      styles.sparkle,
                      {
                        transform: [
                          { scale: sparkleScale },
                          { rotate: `${i * 45}deg` },
                        ],
                        opacity: sparkleOpacity,
                        top: height * 0.3 + Math.sin((i * Math.PI) / 4) * 100,
                        left: width * 0.5 + Math.cos((i * Math.PI) / 4) * 100,
                      },
                    ]}
                  >
                    <Text style={styles.sparkleText}>✨</Text>
                  </Animated.View>
                ))}
              </View>

              {/* Achievement Content */}
              <View style={styles.content}>
                <Text style={styles.congratsText}>
                  🎉 Achievement Unlocked! 🎉
                </Text>

                <Animated.View
                  style={[
                    styles.medalContainer,
                    {
                      backgroundColor: getMedalColor(achievement.type),
                      transform: [{ scale }, { rotate }],
                    },
                  ]}
                >
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                </Animated.View>

                <View
                  style={[
                    styles.typeIndicator,
                    { backgroundColor: getMedalColor(achievement.type) },
                  ]}
                >
                  <Text style={styles.typeText}>
                    {achievement.type.toUpperCase()} MEDAL
                  </Text>
                </View>

                <Text style={styles.achievementTitle}>{achievement.title}</Text>

                <Text style={styles.achievementDescription}>
                  {achievement.description}
                </Text>

                <View style={styles.xpContainer}>
                  <Text style={styles.xpText}>
                    +{achievement.xp_reward} XP Earned!
                  </Text>
                </View>

                <ClayButton
                  title="Awesome!"
                  onPress={onClose}
                  variant="primary"
                  size="large"
                  style={styles.closeButton}
                />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
  },
  modal: {
    backgroundColor: Colors.dark.background2,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.dark.clay.border,
    overflow: "hidden",
  },
  celebrationContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  sparkle: {
    position: "absolute",
    zIndex: 2,
  },
  sparkleText: {
    fontSize: 20,
  },
  content: {
    padding: 32,
    alignItems: "center",
    zIndex: 3,
  },
  congratsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.primary,
    textAlign: "center",
    marginBottom: 24,
  },
  medalContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  achievementIcon: {
    fontSize: 48,
  },
  typeIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.dark.background,
    letterSpacing: 1,
  },
  achievementTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.dark.text,
    textAlign: "center",
    marginBottom: 12,
  },
  achievementDescription: {
    fontSize: 16,
    color: Colors.dark.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  xpContainer: {
    backgroundColor: `${Colors.dark.primary}20`,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 24,
  },
  xpText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.primary,
    textAlign: "center",
  },
  closeButton: {
    width: "100%",
  },
});
