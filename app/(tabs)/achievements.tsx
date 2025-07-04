import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/Colors";
import { type Achievement, useDatabase } from "@/hooks/useDatabase";

const { width } = Dimensions.get("window");

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const db = useDatabase();

  const loadAchievements = useCallback(async () => {
    try {
      const achievementsData = await db.getAllAchievements();
      setAchievements(achievementsData);
    } catch (error) {
      console.error("Error loading achievements:", error);
    }
  }, [db]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAchievements();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadAchievements();
    }, [loadAchievements])
  );

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

  const getProgressText = (achievement: Achievement) => {
    if (achievement.is_unlocked) {
      return `Unlocked ${
        achievement.unlocked_at
          ? new Date(achievement.unlocked_at).toLocaleDateString()
          : ""
      }`;
    }

    const { type, value, timeframe } = achievement.requirement;
    let progressText = "";

    switch (type) {
      case "level":
        progressText = `Reach level ${value}`;
        break;
      case "streak":
      case "streak_start":
        progressText = `${value}-day streak`;
        break;
      case "mega_streak":
        progressText = `${value}-day mega streak`;
        break;
      case "habits_completed":
        progressText =
          timeframe === "all_time"
            ? `Complete ${value} habits total`
            : `Complete ${value} habits`;
        break;
      case "habits_per_day":
        progressText = `Complete ${value} habits in one day`;
        break;
      case "total_habits_created":
        progressText = `Create ${value} total habits`;
        break;
      case "consistency":
      case "monthly_perfect":
        progressText = `${value}% consistency ${timeframe || ""}`;
        break;
      case "total_xp":
        progressText = `Earn ${value} total XP`;
        break;
      case "gold_achievements":
        progressText = `Unlock ${value} gold achievements`;
        break;
      case "special_date":
        progressText = `Log habit on special date`;
        break;
      case "social_share":
        progressText = `Share ${value} milestone`;
        break;
      case "habit_notes":
        progressText = `Log ${value} habit notes`;
        break;
      case "streak_recovery":
        progressText = `Recover streak within ${value} days`;
        break;
      case "weekend_complete":
        progressText = `Complete all weekend habits`;
        break;
      case "night_habits":
        progressText = `Log ${value} habits after 10 PM`;
        break;
      case "consistency_period":
        progressText = `${value}% consistency over 2 weeks`;
        break;
      case "active_habits_duration":
        progressText = `Maintain 3+ habits for ${value} days`;
        break;
      case "no_zero_days":
        progressText = `Complete habits for ${value} days straight`;
        break;
      case "time_based_habits":
        progressText = `Log morning, afternoon & night habits`;
        break;
      case "streak_comeback":
        progressText = `Build longer streak after break`;
        break;
      case "zen_mode":
        progressText = `Perfect completion for ${value} days`;
        break;
      case "habit_edits":
        progressText = `Edit ${value} different habits`;
        break;
      case "habit_revival":
        progressText = `Revive habit after ${value}+ days`;
        break;
      default:
        progressText = `Achievement requirement: ${value}`;
        break;
    }

    return progressText;
  };

  const unlockedAchievements = achievements.filter((a) => a.is_unlocked);
  const lockedAchievements = achievements.filter((a) => !a.is_unlocked);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🏆 Achievement Board</Text>
          <Text style={styles.subtitle}>
            Your habit-building journey milestones
          </Text>
        </View>

        {/* Stats Overview */}
        <GlassCard style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {unlockedAchievements.length}
              </Text>
              <Text style={styles.statLabel}>Unlocked</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{achievements.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {unlockedAchievements.reduce((sum, a) => sum + a.xp_reward, 0)}
              </Text>
              <Text style={styles.statLabel}>XP Earned</Text>
            </View>
          </View>
        </GlassCard>

        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎉 Unlocked Achievements</Text>
            <View style={styles.achievementsGrid}>
              {unlockedAchievements.map((achievement) => (
                <GlassCard key={achievement.id} style={styles.achievementCard}>
                  <View style={styles.achievementHeader}>
                    <View
                      style={[
                        styles.medalContainer,
                        { backgroundColor: getMedalColor(achievement.type) },
                      ]}
                    >
                      <Text style={styles.achievementIcon}>
                        {achievement.icon}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.typeIndicator,
                        { backgroundColor: getMedalColor(achievement.type) },
                      ]}
                    >
                      <Text style={styles.typeText}>
                        {achievement.type.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.achievementTitle}>
                    {achievement.title}
                  </Text>
                  <Text style={styles.achievementDescription}>
                    {achievement.description}
                  </Text>

                  <View style={styles.achievementFooter}>
                    <Text style={styles.xpReward}>
                      +{achievement.xp_reward} XP
                    </Text>
                    <Text style={styles.progressText}>
                      {getProgressText(achievement)}
                    </Text>
                  </View>
                </GlassCard>
              ))}
            </View>
          </View>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔒 Locked Achievements</Text>
            <View style={styles.achievementsGrid}>
              {lockedAchievements.map((achievement) => (
                <GlassCard
                  key={achievement.id}
                  style={StyleSheet.flatten([
                    styles.achievementCard,
                    styles.lockedCard,
                  ])}
                >
                  <View style={styles.achievementHeader}>
                    <View style={[styles.medalContainer, styles.lockedMedal]}>
                      <Text style={[styles.achievementIcon, styles.lockedIcon]}>
                        {achievement.icon}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.typeIndicator,
                        {
                          backgroundColor: getMedalColor(achievement.type),
                          opacity: 0.5,
                        },
                      ]}
                    >
                      <Text style={styles.typeText}>
                        {achievement.type.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.achievementTitle, styles.lockedText]}>
                    {achievement.title}
                  </Text>
                  <Text
                    style={[styles.achievementDescription, styles.lockedText]}
                  >
                    {achievement.description}
                  </Text>

                  <View style={styles.achievementFooter}>
                    <Text style={[styles.xpReward, styles.lockedText]}>
                      +{achievement.xp_reward} XP
                    </Text>
                    <Text style={[styles.progressText, styles.lockedText]}>
                      {getProgressText(achievement)}
                    </Text>
                  </View>
                </GlassCard>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {achievements.length === 0 && (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyTitle}>No Achievements Yet</Text>
            <Text style={styles.emptyText}>
              Start completing habits to unlock your first achievement!
            </Text>
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 10,
    marginTop: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textMuted,
    lineHeight: 22,
  },
  statsCard: {
    margin: 20,
    marginTop: 10,
    padding: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.dark.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  achievementCard: {
    width: (width - 60) / 2,
    marginBottom: 16,
    padding: 16,
    minHeight: 200,
  },
  lockedCard: {
    opacity: 0.7,
  },
  achievementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  medalContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  lockedMedal: {
    backgroundColor: Colors.dark.textMuted,
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 24,
  },
  lockedIcon: {
    opacity: 0.6,
  },
  typeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.dark.background,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  achievementDescription: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    lineHeight: 18,
    marginBottom: 12,
    flex: 1,
  },
  achievementFooter: {
    marginTop: "auto",
  },
  xpReward: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.dark.primary,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    fontStyle: "italic",
  },
  lockedText: {
    opacity: 0.6,
  },
  emptyCard: {
    margin: 20,
    padding: 40,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.dark.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
});
