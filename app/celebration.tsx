import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
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

import { ClayButton } from "@/components/ui/ClayButton";
import { Colors, glassStyles } from "@/constants/Colors";
import type { Achievement, LevelUpData } from "@/hooks/useDatabase";
import { useDatabase } from "@/hooks/useDatabase";

const { width, height } = Dimensions.get("window");

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
    const startDelay = index * 150;
    const angle = (index * 30) % 360;
    const distance = 120 + (index % 4) * 60;

    // Initial burst animation
    translateX.value = withDelay(
      startDelay,
      withSpring(Math.cos((angle * Math.PI) / 180) * distance, {
        damping: 12,
        stiffness: 80,
      })
    );

    translateY.value = withDelay(
      startDelay,
      withSpring(Math.sin((angle * Math.PI) / 180) * distance, {
        damping: 12,
        stiffness: 80,
      })
    );

    scale.value = withDelay(
      startDelay,
      withSequence(
        withSpring(1.5, { damping: 8, stiffness: 150 }),
        withSpring(1, { damping: 12, stiffness: 120 })
      )
    );

    opacity.value = withDelay(
      startDelay,
      withSequence(
        withTiming(1, { duration: 400 }),
        withDelay(2000, withTiming(0, { duration: 800 }))
      )
    );

    rotation.value = withDelay(
      startDelay,
      withRepeat(withTiming(360, { duration: 3000 }), -1, false)
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
        return ["🎉", "🎊", "🌟", "💫", "⭐"][index % 5];
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

export default function CelebrationScreen() {
  const params = useLocalSearchParams();
  const [showSharePreview, setShowSharePreview] = useState(false);
  const db = useDatabase();

  // Parse the achievement or level data from params
  const achievement: Achievement | null = params.achievement
    ? JSON.parse(params.achievement as string)
    : null;
  const levelUpData: LevelUpData | null = params.levelUpData
    ? JSON.parse(params.levelUpData as string)
    : null;

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-50);
  const badgeScale = useSharedValue(0);
  const badgeRotation = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const xpBarWidth = useSharedValue(0);
  const xpBarGlow = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(30);

  const isLevelUp = !!levelUpData;
  const isAchievement = !!achievement;

  useEffect(() => {
    if (achievement || levelUpData) {
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Start celebration animation sequence
      headerOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
      headerTranslateY.value = withDelay(
        300,
        withSpring(0, { damping: 15, stiffness: 200 })
      );

      // Badge animation with dramatic effect
      badgeScale.value = withDelay(
        800,
        withSequence(
          withSpring(1.4, { damping: 6, stiffness: 120 }),
          withSpring(1, { damping: 10, stiffness: 150 })
        )
      );

      badgeRotation.value = withDelay(
        800,
        withSequence(
          withTiming(720, { duration: 1200 }),
          withSpring(0, { damping: 12, stiffness: 180 })
        )
      );

      // Card animation
      cardOpacity.value = withDelay(1200, withTiming(1, { duration: 600 }));
      cardScale.value = withDelay(
        1200,
        withSpring(1, { damping: 15, stiffness: 200 })
      );

      // XP bar animation for level-ups
      if (isLevelUp) {
        xpBarWidth.value = withDelay(
          1600,
          withSequence(
            withTiming(100, { duration: 1200 }),
            withTiming(0, { duration: 400 }),
            withTiming((levelUpData.xpGained / 100) * 100, { duration: 1000 })
          )
        );

        xpBarGlow.value = withDelay(
          1600,
          withRepeat(
            withSequence(
              withTiming(1, { duration: 600 }),
              withTiming(0.4, { duration: 600 })
            ),
            4,
            true
          )
        );
      }

      // Buttons animation
      buttonsOpacity.value = withDelay(2000, withTiming(1, { duration: 600 }));
      buttonsTranslateY.value = withDelay(
        2000,
        withSpring(0, { damping: 15, stiffness: 200 })
      );
    }
  }, [achievement, levelUpData]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: badgeScale.value },
      { rotate: `${badgeRotation.value}deg` },
    ],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const xpBarStyle = useAnimatedStyle(() => ({
    width: `${xpBarWidth.value}%`,
    shadowOpacity: interpolate(
      xpBarGlow.value,
      [0, 1],
      [0.4, 1],
      Extrapolate.CLAMP
    ),
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
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

  const handleBackToApp = () => {
    router.back();
  };

  const handleViewAchievements = () => {
    router.push("/(tabs)/achievements");
  };

  if (!achievement && !levelUpData) {
    router.back();
    return null;
  }

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
    if (isLevelUp) return `🎉 You Leveled Up!`;
    return "🏅 New Achievement!";
  };

  const getSubtitle = () => {
    if (isLevelUp)
      return `Level ${levelUpData.newLevel} - ${levelUpData.levelTitle}`;
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
    <SafeAreaView style={styles.container}>
      {/* Animated Background */}
      <LinearGradient
        colors={[
          "#0F0F0F", // Deep black
          "#1A1A2E", // Dark blue-purple
          "#16213E", // Navy blue
          "#0F3460", // Deep blue
          "#1A1A2E", // Back to dark blue-purple
          "#0F0F0F", // Deep black
        ]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Particle System */}
      <View style={styles.particleContainer}>
        {Array.from({ length: 20 }, (_, i) => (
          <Particle
            key={i}
            index={i}
            type={
              i % 4 === 0
                ? "sparkle"
                : i % 4 === 1
                ? "confetti"
                : i % 4 === 2
                ? "star"
                : "confetti"
            }
          />
        ))}
      </View>

      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Text style={styles.headerTitle}>{getTitle()}</Text>
        <Text style={styles.headerSubtitle}>{getSubtitle()}</Text>
      </Animated.View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Badge/Level Display */}
        <Animated.View style={[styles.badgeSection, badgeStyle]}>
          <View
            style={[
              styles.badgeContainer,
              {
                backgroundColor: getBadgeColor(),
              },
            ]}
          >
            <Text style={styles.badgeIcon}>{getMainIcon()}</Text>
            {isLevelUp && (
              <View style={styles.levelNumber}>
                <Text style={styles.levelText}>{levelUpData.newLevel}</Text>
              </View>
            )}
          </View>

          {/* Type/Level Indicator */}
          <View
            style={[styles.typeIndicator, { backgroundColor: getBadgeColor() }]}
          >
            <Text style={styles.typeText}>
              {isLevelUp
                ? "LEVEL UP!"
                : `${achievement?.type?.toUpperCase()} MEDAL`}
            </Text>
          </View>
        </Animated.View>

        {/* Main Card */}
        <Animated.View style={[cardStyle]}>
          <BlurView intensity={20} style={[styles.mainCard, glassStyles.card]}>
            <Text style={styles.cardTitle}>{getSubtitle()}</Text>
            <Text style={styles.cardDescription}>{getDescription()}</Text>

            {/* XP Progress Bar (Level-ups only) */}
            {isLevelUp && (
              <View style={styles.xpProgressContainer}>
                <View style={styles.xpProgressTrack}>
                  <Animated.View style={[styles.xpProgressBar, xpBarStyle]} />
                </View>
                <Text style={styles.xpProgressText}>
                  XP Overflow → New Level!
                </Text>
              </View>
            )}

            {/* Rewards Section */}
            <View style={styles.rewardsContainer}>
              <Text style={styles.rewardsTitle}>
                {isLevelUp ? "🎁 Level Rewards:" : "🎁 Reward:"}
              </Text>
              {getRewards().map((reward, index) => (
                <View key={index} style={styles.rewardItem}>
                  <Text style={styles.rewardText}>{reward}</Text>
                </View>
              ))}
            </View>
          </BlurView>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <Animated.View style={[styles.buttonContainer, buttonsStyle]}>
        <ClayButton
          title="Back to App"
          onPress={handleBackToApp}
          variant="primary"
          size="large"
          style={styles.primaryButton}
        />

        <View style={styles.secondaryButtons}>
          <ClayButton
            title="View All Achievements"
            onPress={handleViewAchievements}
            variant="secondary"
            size="medium"
            style={styles.secondaryButton}
          />

          <ClayButton
            title="Share"
            onPress={handleShare}
            variant="secondary"
            size="medium"
            style={styles.secondaryButton}
          />
        </View>
      </Animated.View>

      {/* Share Preview Mock */}
      {showSharePreview && (
        <View style={styles.sharePreview}>
          <Text style={styles.sharePreviewText}>
            📱 Shared to Social Media!
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background1,
  },
  particleContainer: {
    position: "absolute",
    top: height * 0.3,
    left: width * 0.5,
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
    fontSize: 28,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: "center",
    zIndex: 3,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 18,
    color: Colors.dark.primary,
    textAlign: "center",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    zIndex: 3,
  },
  badgeSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  badgeContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    position: "relative",
  },
  badgeIcon: {
    fontSize: 64,
  },
  levelNumber: {
    position: "absolute",
    bottom: -8,
    right: -8,
    backgroundColor: Colors.dark.primary,
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: Colors.dark.background1,
  },
  levelText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
  },
  typeIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.dark.background1,
    letterSpacing: 1.5,
  },
  mainCard: {
    width: width - 48,
    padding: 32,
    alignItems: "center",
    borderRadius: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  xpProgressContainer: {
    width: "100%",
    marginBottom: 24,
  },
  xpProgressTrack: {
    height: 8,
    backgroundColor: Colors.dark.clay.background,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  xpProgressBar: {
    height: "100%",
    backgroundColor: Colors.dark.primary,
    borderRadius: 4,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 6,
  },
  xpProgressText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
  rewardsContainer: {
    width: "100%",
    backgroundColor: `${Colors.dark.primary}15`,
    borderRadius: 16,
    padding: 20,
  },
  rewardsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.dark.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  rewardItem: {
    backgroundColor: `${Colors.dark.primary}25`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: "center",
  },
  rewardText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
    textAlign: "center",
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
    zIndex: 3,
  },
  primaryButton: {
    width: "100%",
  },
  secondaryButtons: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
  },
  sharePreview: {
    position: "absolute",
    top: 100,
    left: 24,
    right: 24,
    backgroundColor: Colors.dark.success,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    zIndex: 10,
  },
  sharePreviewText: {
    fontSize: 14,
    color: Colors.dark.textPrimary,
    fontWeight: "600",
  },
});
