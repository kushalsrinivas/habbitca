import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns";
import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ActivityTrendChart } from "@/components/ui/ActivityTrendChart";
import { GlassCard } from "@/components/ui/GlassCard";
import { HabitHeatmap } from "@/components/ui/HabitHeatmap";
import { XPProgressBar } from "@/components/ui/XPProgressBar";
import { Colors } from "@/constants/Colors";
import {
  type Habit,
  type HabitLog,
  type UserStats,
  useDatabase,
} from "@/hooks/useDatabase";

interface HabitStatsData {
  habit: Habit;
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  allLogs: HabitLog[];
  totalTimeSpent: number; // in seconds
  averageSessionTime: number; // in seconds
  longestSession: number; // in seconds
}

export default function StatsScreen() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [habitStatsData, setHabitStatsData] = useState<HabitStatsData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [totalHabits, setTotalHabits] = useState(0);

  const db = useDatabase();
  const today = format(new Date(), "yyyy-MM-dd");

  const calculateLongestStreak = (logs: HabitLog[]): number => {
    if (logs.length === 0) return 0;

    const completedLogs = logs
      .filter((log) => log.completed)
      .sort((a, b) => a.date.localeCompare(b.date));
    let longestStreak = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;

    for (const log of completedLogs) {
      const logDate = new Date(log.date);

      if (lastDate) {
        const daysDiff = Math.floor(
          (logDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      lastDate = logDate;
    }

    return Math.max(longestStreak, currentStreak);
  };

  const loadData = useCallback(async () => {
    try {
      const [statsData, habitsData] = await Promise.all([
        db.getUserStats(),
        db.getHabits(),
      ]);

      setUserStats(statsData);
      setTotalHabits(habitsData.length);

      if (habitsData.length === 0) {
        setHabitStatsData([]);
        return;
      }

      // Load detailed stats for each habit including all logs for heatmap
      const habitStatsPromises = habitsData.map(async (habit) => {
        const [allLogs, currentStreak] = await Promise.all([
          db.getHabitLogsForHeatmap(habit.id),
          db.getHabitStreak(habit.id, today),
        ]);

        const longestStreak = calculateLongestStreak(allLogs);
        const totalCompleted = allLogs.filter((log) => log.completed).length;

        // Calculate time-based metrics for time-tracking habits
        let totalTimeSpent = 0;
        let averageSessionTime = 0;
        let longestSession = 0;

        if (habit.track_time) {
          const timeSpentLogs = allLogs.filter((log) => log.time_spent > 0);
          totalTimeSpent = timeSpentLogs.reduce(
            (sum, log) => sum + log.time_spent,
            0
          );

          if (timeSpentLogs.length > 0) {
            averageSessionTime = Math.floor(
              totalTimeSpent / timeSpentLogs.length
            );
            longestSession = Math.max(
              ...timeSpentLogs.map((log) => log.time_spent)
            );
          }
        }

        return {
          habit,
          currentStreak,
          longestStreak,
          totalCompleted,
          allLogs,
          totalTimeSpent,
          averageSessionTime,
          longestSession,
        };
      });

      const habitStats = await Promise.all(habitStatsPromises);
      setHabitStatsData(habitStats);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, [db, today]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Listen for database changes to update in real-time
  useEffect(() => {
    const handleDataChange = () => {
      loadData();
    };

    db.onDataChange(handleDataChange);

    return () => {
      db.offDataChange(handleDataChange);
    };
  }, [db, loadData]);

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

  const formatTime = (seconds: number): string => {
    if (seconds === 0) return "0m";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
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

        {/* Activity Trend Chart */}
        <View style={styles.chartSection}>
          <ActivityTrendChart />
        </View>

        {/* Habit Heatmaps */}
        <View style={styles.habitsSection}>
          <Text style={styles.sectionTitle}>Habit Consistency</Text>

          {habitStatsData.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyText}>No habits to display</Text>
              <Text style={styles.emptySubtext}>
                Create some habits to see your consistency patterns!
              </Text>
            </GlassCard>
          ) : (
            habitStatsData.map((habitData) => (
              <GlassCard key={habitData.habit.id} style={styles.habitCard}>
                {/* Habit Header */}
                <View style={styles.habitHeader}>
                  <Text style={styles.habitEmoji}>{habitData.habit.emoji}</Text>
                  <View style={styles.habitInfo}>
                    <Text style={styles.habitTitle}>
                      {habitData.habit.title}
                    </Text>
                    <Text style={styles.habitTime}>
                      ⏰ {habitData.habit.time}
                    </Text>
                  </View>
                </View>

                {/* Heatmap */}
                <View style={styles.heatmapSection}>
                  <HabitHeatmap
                    habitLogs={habitData.allLogs}
                    habitCreatedAt={habitData.habit.created_at}
                  />
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {habitData.currentStreak}
                    </Text>
                    <Text style={styles.statLabel}>Current Streak</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {habitData.longestStreak}
                    </Text>
                    <Text style={styles.statLabel}>Best Streak</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {habitData.totalCompleted}
                    </Text>
                    <Text style={styles.statLabel}>Days Completed</Text>
                  </View>
                </View>

                {/* Time Tracking Stats for time-tracking habits */}
                {habitData.habit.track_time && habitData.totalTimeSpent > 0 && (
                  <View style={styles.timeStatsSection}>
                    <Text style={styles.timeStatsTitle}>⏱️ Time Tracking</Text>
                    <View style={styles.timeStatsRow}>
                      <View style={styles.timeStatItem}>
                        <Text style={styles.timeStatValue}>
                          {formatTime(habitData.totalTimeSpent)}
                        </Text>
                        <Text style={styles.timeStatLabel}>Total Time</Text>
                      </View>
                      <View style={styles.timeStatItem}>
                        <Text style={styles.timeStatValue}>
                          {formatTime(habitData.averageSessionTime)}
                        </Text>
                        <Text style={styles.timeStatLabel}>Avg Session</Text>
                      </View>
                      <View style={styles.timeStatItem}>
                        <Text style={styles.timeStatValue}>
                          {formatTime(habitData.longestSession)}
                        </Text>
                        <Text style={styles.timeStatLabel}>
                          Longest Session
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </GlassCard>
            ))
          )}
        </View>

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
    backgroundColor: Colors.dark.background1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
    marginTop: 20,
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
  chartSection: {
    marginHorizontal: 16,
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
  habitsSection: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  emptyCard: {
    margin: 16,
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  habitCard: {
    margin: 16,
    marginBottom: 8,
    padding: 20,
  },
  habitHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  habitEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    marginBottom: 2,
  },
  habitTime: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  heatmapSection: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    backgroundColor: Colors.dark.clay.background,
    borderRadius: 12,
  },
  statItem: {
    alignItems: "center",
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
  timeStatsSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.dark.background3,
    borderRadius: 12,
  },
  timeStatsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
    marginBottom: 12,
  },
  timeStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  timeStatItem: {
    alignItems: "center",
  },
  timeStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.primary,
    marginBottom: 4,
  },
  timeStatLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
});
