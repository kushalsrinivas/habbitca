import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Colors } from "@/constants/Colors";
import type { Achievement, LevelUpData } from "@/hooks/useDatabase";
import { useDatabase } from "@/hooks/useDatabase";
import { ClayButton } from "./ClayButton";

const { width, height } = Dimensions.get("window");

interface CelebrationModalProps {
  visible: boolean;
  achievement?: Achievement | null;
  levelUpData?: LevelUpData | null;
  onClose: () => void;
}

interface ParticleProps {
  index: number;
  type: "sparkle" | "confetti" | "star";
}

const Particle: React.FC<ParticleProps> = ({ index, type }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    const startDelay = index * 100;
    const angle = (index * 45) % 360;
    const distance = 80 + (index % 3) * 40;

    // Initial burst animation
    translateX.value = withDelay(
      startDelay,
      withSpring(Math.cos((angle * Math.PI) / 180) * distance, {
        damping: 15,
        stiffness: 100,
      })
    );

    translateY.value = withDelay(
      startDelay,
      withSpring(Math.sin((angle * Math.PI) / 180) * distance, {
        damping: 15,
        stiffness: 100,
      })
    );

    scale.value = withDelay(
      startDelay,
      withSequence(
        withSpring(1.2, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 15, stiffness: 150 })
      )
    );

    opacity.value = withDelay(
      startDelay,
      withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(1500, withTiming(0, { duration: 500 }))
      )
    );

    rotation.value = withDelay(
      startDelay,
      withRepeat(withTiming(360, { duration: 2000 }), -1, false)
    );
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  const getParticleEmoji = () => {
    switch (type) {
      case "sparkle":
        return "✨";
      case "confetti":
        return ["🎉", "🎊", "🌟"][index % 3];
      case "star":
        return "⭐";
      default:
        return "✨";
    }
  };

  return (
    <Animated.View style={[styles.particle, animatedStyle]}>
      <Text style={styles.particleText}>{getParticleEmoji()}</Text>
    </Animated.View>
  );
};

export function AchievementUnlockModal({
  visible,
  achievement,
  levelUpData,
  onClose,
}: CelebrationModalProps) {
  const [showSharePreview, setShowSharePreview] = useState(false);
  const db = useDatabase();

  // Animation values
  const backdropOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0);
  const badgeScale = useSharedValue(0);
  const badgeRotation = useSharedValue(0);
  const xpBarWidth = useSharedValue(0);
  const xpBarGlow = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const rewardsOpacity = useSharedValue(0);
  const rewardsTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);

  const isLevelUp = !!levelUpData;
  const isAchievement = !!achievement;

  useEffect(() => {
    if (visible && (achievement || levelUpData)) {
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reset all animations
      backdropOpacity.value = 0;
      modalScale.value = 0;
      badgeScale.value = 0;
      badgeRotation.value = 0;
      xpBarWidth.value = 0;
      xpBarGlow.value = 0;
      titleOpacity.value = 0;
      titleTranslateY.value = 30;
      rewardsOpacity.value = 0;
      rewardsTranslateY.value = 20;
      buttonOpacity.value = 0;

      // Start celebration animation sequence
      backdropOpacity.value = withTiming(1, { duration: 300 });

      modalScale.value = withDelay(
        200,
        withSpring(1, {
          damping: 15,
          stiffness: 200,
        })
      );

      // Badge animation with dramatic effect
      badgeScale.value = withDelay(
        500,
        withSequence(
          withSpring(1.3, { damping: 8, stiffness: 150 }),
          withSpring(1, { damping: 12, stiffness: 200 })
        )
      );

      badgeRotation.value = withDelay(
        500,
        withSequence(
          withTiming(360, { duration: 800 }),
          withSpring(0, { damping: 15, stiffness: 200 })
        )
      );

      // XP bar animation for level-ups
      if (isLevelUp) {
        xpBarWidth.value = withDelay(
          1000,
          withSequence(
            withTiming(100, { duration: 1000 }),
            withTiming(0, { duration: 300 }),
            withTiming((levelUpData.xpGained / 100) * 100, { duration: 800 })
          )
        );

        xpBarGlow.value = withDelay(
          1000,
          withRepeat(
            withSequence(
              withTiming(1, { duration: 500 }),
              withTiming(0.3, { duration: 500 })
            ),
            3,
            true
          )
        );
      }

      // Title animation
      titleOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));
      titleTranslateY.value = withDelay(
        800,
        withSpring(0, { damping: 15, stiffness: 200 })
      );

      // Rewards animation
      rewardsOpacity.value = withDelay(1200, withTiming(1, { duration: 600 }));
      rewardsTranslateY.value = withDelay(
        1200,
        withSpring(0, { damping: 15, stiffness: 200 })
      );

      // Button animation
      buttonOpacity.value = withDelay(1600, withTiming(1, { duration: 400 }));
    }
  }, [visible, achievement, levelUpData]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: badgeScale.value },
      { rotate: `${badgeRotation.value}deg` },
    ],
  }));

  const xpBarStyle = useAnimatedStyle(() => ({
    width: `${xpBarWidth.value}%`,
    shadowOpacity: interpolate(
      xpBarGlow.value,
      [0, 1],
      [0.3, 0.8],
      Extrapolate.CLAMP
    ),
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const rewardsStyle = useAnimatedStyle(() => ({
    opacity: rewardsOpacity.value,
    transform: [{ translateY: rewardsTranslateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const handleShare = async () => {
    try {
      const message = isLevelUp
        ? `🎉 Just reached Level ${levelUpData?.newLevel}! ${levelUpData?.levelTitle} 🚀 #HabitTracker #LevelUp`
        : `🏆 Achievement Unlocked: ${achievement?.title}! ${achievement?.description} 🎯 #HabitTracker #Achievement`;

      await Share.share({
        message,
        title: isLevelUp ? "Level Up!" : "Achievement Unlocked!",
      });

      // Trigger social share achievement
      await db.triggerSocialShare();
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleSharePreview = () => {
    setShowSharePreview(true);
    setTimeout(() => setShowSharePreview(false), 2000);
  };

  if (!achievement && !levelUpData) return null;

  const getBadgeColor = () => {
    if (isLevelUp) {
      const level = levelUpData.newLevel;
      if (level >= 20) return "#FFD700"; // Gold
      if (level >= 10) return "#C0C0C0"; // Silver
      return "#CD7F32"; // Bronze
    }

    switch (achievement?.type) {
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

  const getMainIcon = () => {
    if (isLevelUp) return "👑";
    return achievement?.icon || "🏆";
  };

  const getTitle = () => {
    if (isLevelUp) return `🎉 Level ${levelUpData.newLevel} Unlocked!`;
    return "🏆 Achievement Unlocked!";
  };

  const getSubtitle = () => {
    if (isLevelUp) return levelUpData.levelTitle;
    return achievement?.title || "";
  };

  const getDescription = () => {
    if (isLevelUp) {
      return `You're on fire! Keep up the consistency and unlock your next reward soon.`;
    }
    return achievement?.description || "";
  };

  const getRewards = () => {
    if (isLevelUp) return levelUpData.levelRewards;
    return [`+${achievement?.xp_reward} XP`];
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, backdropStyle]}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />

        {/* Particle System */}
        <View style={styles.particleContainer}>
          {Array.from({ length: 12 }, (_, i) => (
            <Particle
              key={i}
              index={i}
              type={i % 3 === 0 ? "sparkle" : i % 3 === 1 ? "confetti" : "star"}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View style={[styles.modalContainer, modalStyle]}>
            <TouchableOpacity activeOpacity={1} style={styles.modal}>
              {/* Main Content */}
              <View style={styles.content}>
                {/* Title */}
                <Animated.View style={titleStyle}>
                  <Text style={styles.congratsText}>{getTitle()}</Text>
                </Animated.View>

                {/* Badge/Level Display */}
                <Animated.View
                  style={[
                    styles.badgeContainer,
                    {
                      backgroundColor: getBadgeColor(),
                    },
                    badgeStyle,
                  ]}
                >
                  <Text style={styles.badgeIcon}>{getMainIcon()}</Text>
                  {isLevelUp && (
                    <View style={styles.levelNumber}>
                      <Text style={styles.levelText}>
                        {levelUpData.newLevel}
                      </Text>
                    </View>
                  )}
                </Animated.View>

                {/* Type/Level Indicator */}
                <View
                  style={[
                    styles.typeIndicator,
                    { backgroundColor: getBadgeColor() },
                  ]}
                >
                  <Text style={styles.typeText}>
                    {isLevelUp
                      ? "LEVEL UP!"
                      : `${achievement?.type?.toUpperCase()} MEDAL`}
                  </Text>
                </View>

                {/* Subtitle */}
                <Animated.View style={titleStyle}>
                  <Text style={styles.achievementTitle}>{getSubtitle()}</Text>
                </Animated.View>

                {/* Description */}
                <Animated.View style={titleStyle}>
                  <Text style={styles.achievementDescription}>
                    {getDescription()}
                  </Text>
                </Animated.View>

                {/* XP Progress Bar (Level-ups only) */}
                {isLevelUp && (
                  <Animated.View style={styles.xpProgressContainer}>
                    <View style={styles.xpProgressTrack}>
                      <Animated.View
                        style={[styles.xpProgressBar, xpBarStyle]}
                      />
                    </View>
                    <Text style={styles.xpProgressText}>
                      XP Overflow → New Level!
                    </Text>
                  </Animated.View>
                )}

                {/* Rewards Section */}
                <Animated.View style={[styles.rewardsContainer, rewardsStyle]}>
                  <Text style={styles.rewardsTitle}>
                    {isLevelUp ? "🎁 Level Rewards:" : "🎁 Reward:"}
                  </Text>
                  {getRewards().map((reward, index) => (
                    <View key={index} style={styles.rewardItem}>
                      <Text style={styles.rewardText}>{reward}</Text>
                    </View>
                  ))}
                </Animated.View>

                {/* Action Buttons */}
                <Animated.View style={[styles.buttonContainer, buttonStyle]}>
                  <ClayButton
                    title={isLevelUp ? "Continue" : "Awesome!"}
                    onPress={onClose}
                    variant="primary"
                    size="large"
                    style={styles.primaryButton}
                  />

                  <ClayButton
                    title="Share Achievement"
                    onPress={handleSharePreview}
                    variant="secondary"
                    size="medium"
                    style={styles.shareButton}
                  />
                </Animated.View>

                {/* Share Preview Mock */}
                {showSharePreview && (
                  <View style={styles.sharePreview}>
                    <Text style={styles.sharePreviewText}>
                      📱 Instagram Story Preview
                    </Text>
                    <View style={styles.mockStory}>
                      <Text style={styles.mockStoryText}>
                        {isLevelUp
                          ? `Level ${levelUpData.newLevel}! 🚀`
                          : `${achievement?.title}! 🏆`}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    paddingHorizontal: 20,
  },
  backdrop: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "100%",
    maxWidth: 380,
    alignSelf: "center",
  },
  modal: {
    backgroundColor: Colors.dark.background2,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.dark.clay.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  particleContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 1,
    height: 1,
    zIndex: 1,
    transform: [{ translateX: -0.5 }, { translateY: -0.5 }],
  },
  particle: {
    position: "absolute",
    zIndex: 2,
  },
  particleText: {
    fontSize: 24,
  },
  content: {
    padding: 24,
    alignItems: "center",
    zIndex: 3,
  },
  congratsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.primary,
    textAlign: "center",
    marginBottom: 20,
  },
  badgeContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    position: "relative",
  },
  badgeIcon: {
    fontSize: 48,
  },
  levelNumber: {
    position: "absolute",
    bottom: -6,
    right: -6,
    backgroundColor: Colors.dark.primary,
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.dark.background2,
  },
  levelText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
  },
  typeIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.dark.background1,
    letterSpacing: 1.2,
  },
  achievementTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  achievementDescription: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  xpProgressContainer: {
    width: "100%",
    marginBottom: 20,
  },
  xpProgressTrack: {
    height: 6,
    backgroundColor: Colors.dark.clay.background,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  xpProgressBar: {
    height: "100%",
    backgroundColor: Colors.dark.primary,
    borderRadius: 3,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 4,
  },
  xpProgressText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
  rewardsContainer: {
    width: "100%",
    backgroundColor: `${Colors.dark.primary}15`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  rewardsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.dark.primary,
    marginBottom: 10,
    textAlign: "center",
  },
  rewardItem: {
    backgroundColor: `${Colors.dark.primary}20`,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    alignItems: "center",
  },
  rewardText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    gap: 10,
  },
  primaryButton: {
    width: "100%",
  },
  shareButton: {
    width: "100%",
  },
  sharePreview: {
    position: "absolute",
    top: -80,
    left: 0,
    right: 0,
    backgroundColor: Colors.dark.background3,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.clay.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sharePreviewText: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginBottom: 6,
  },
  mockStory: {
    backgroundColor: "#E1306C",
    borderRadius: 6,
    padding: 8,
    width: "70%",
  },
  mockStoryText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
});
