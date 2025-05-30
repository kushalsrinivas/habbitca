import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { GlassCard } from "@/components/ui/GlassCard";
import { XPProgressBar } from "@/components/ui/XPProgressBar";
import { Colors } from "@/constants/Colors";
import { type UserStats, useDatabase } from "@/hooks/useDatabase";

export default function StatsScreen() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [totalHabits, setTotalHabits] = useState(0);

  const db = useDatabase();

  const loadData = useCallback(async () => {
    try {
      const [statsData, habitsData] = await Promise.all([
        db.getUserStats(),
        db.getHabits(),
      ]);

      setUserStats(statsData);
      setTotalHabits(habitsData.length);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, [db]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getXPProgress = () => {
    if (!userStats) return { current: 0, needed: 100, percentage: 0 };
    return db.getXPProgress(userStats.xp, userStats.level);
  };

  const getLevelTitle = (level: number) => {
    if (level >= 20) return "Habit Master 🏆";
    if (level >= 15) return "Habit Expert 🎯";
    if (level >= 10) return "Habit Pro 💪";
    if (level >= 5) return "Habit Builder 🔨";
    return "Habit Beginner 🌱";
  };

  const getNextLevelXP = () => {
    if (!userStats) return 100;
    return db.getXPForNextLevel(userStats.level);
  };

  const xpProgress = getXPProgress();

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
          <Text style={styles.title}>Your Progress</Text>
          <Text style={styles.subtitle}>Track your habit-building journey</Text>
        </View>

        {/* Level & XP Card */}
        <GlassCard style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelNumber}>{userStats?.level || 1}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>
                {getLevelTitle(userStats?.level || 1)}
              </Text>
              <Text style={styles.levelSubtitle}>
                Level {userStats?.level || 1}
              </Text>
            </View>
          </View>

          <XPProgressBar
            currentXP={xpProgress.current}
            neededXP={xpProgress.needed}
            level={userStats?.level || 1}
            percentage={xpProgress.percentage}
          />

          <View style={styles.xpDetails}>
            <Text style={styles.xpDetailText}>
              {xpProgress.current} / {xpProgress.needed} XP to next level
            </Text>
            <Text style={styles.totalXpText}>
              Total XP: {userStats?.xp || 0}
            </Text>
          </View>
        </GlassCard>

        {/* Stats Overview */}
        <GlassCard style={styles.statsCard}>
          <Text style={styles.cardTitle}>Overview</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalHabits}</Text>
              <Text style={styles.statLabel}>Active Habits</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue}>{userStats?.level || 1}</Text>
              <Text style={styles.statLabel}>Current Level</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue}>{userStats?.xp || 0}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {userStats?.longest_streak || 0}
              </Text>
              <Text style={styles.statLabel}>Longest Streak</Text>
            </View>
          </View>
        </GlassCard>

        {/* Achievements */}
        <GlassCard style={styles.achievementsCard}>
          <Text style={styles.cardTitle}>Achievements</Text>

          <View style={styles.achievementsList}>
            <View style={styles.achievement}>
              <Text style={styles.achievementIcon}>🎯</Text>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>First Habit</Text>
                <Text style={styles.achievementDesc}>
                  {totalHabits > 0 ? "Completed ✓" : "Create your first habit"}
                </Text>
              </View>
            </View>

            <View style={styles.achievement}>
              <Text style={styles.achievementIcon}>🔥</Text>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>Week Warrior</Text>
                <Text style={styles.achievementDesc}>
                  {(userStats?.longest_streak || 0) >= 7
                    ? "Completed ✓"
                    : "Maintain a 7-day streak"}
                </Text>
              </View>
            </View>

            <View style={styles.achievement}>
              <Text style={styles.achievementIcon}>⚡</Text>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>Level Up</Text>
                <Text style={styles.achievementDesc}>
                  {(userStats?.level || 1) >= 5
                    ? "Completed ✓"
                    : "Reach level 5"}
                </Text>
              </View>
            </View>

            <View style={styles.achievement}>
              <Text style={styles.achievementIcon}>👑</Text>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>Habit Master</Text>
                <Text style={styles.achievementDesc}>
                  {(userStats?.level || 1) >= 20
                    ? "Completed ✓"
                    : "Reach level 20"}
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>

        {/* XP Formula Explanation */}
        <GlassCard style={styles.formulaCard}>
          <Text style={styles.cardTitle}>XP System</Text>

          <View style={styles.formulaInfo}>
            <Text style={styles.formulaText}>
              • Base XP per habit: <Text style={styles.highlight}>10 XP</Text>
            </Text>
            <Text style={styles.formulaText}>
              • Streak bonus: <Text style={styles.highlight}>+5 XP</Text> every
              7 days
            </Text>
            <Text style={styles.formulaText}>
              • Level formula:{" "}
              <Text style={styles.highlight}>√(XP ÷ 50) + 1</Text>
            </Text>
            <Text style={styles.formulaSubtext}>
              Keep building streaks to earn bonus XP!
            </Text>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  levelCard: {
    margin: 16,
    padding: 20,
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  levelBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  levelNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  levelSubtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  xpDetails: {
    marginTop: 16,
    alignItems: "center",
  },
  xpDetailText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 4,
  },
  totalXpText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  statsCard: {
    margin: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statBox: {
    width: "48%",
    backgroundColor: Colors.dark.clay.background,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  achievementsCard: {
    margin: 16,
    padding: 20,
  },
  achievementsList: {
    gap: 16,
  },
  achievement: {
    flexDirection: "row",
    alignItems: "center",
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  formulaCard: {
    margin: 16,
    padding: 20,
    marginBottom: 100,
  },
  formulaInfo: {
    gap: 8,
  },
  formulaText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  highlight: {
    color: Colors.dark.primary,
    fontWeight: "bold",
  },
  formulaSubtext: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    fontStyle: "italic",
    marginTop: 8,
  },
});
