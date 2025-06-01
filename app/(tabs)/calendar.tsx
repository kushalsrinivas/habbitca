import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { format, subDays } from "date-fns";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/Colors";
import { type Habit, type HabitLog, useDatabase } from "@/hooks/useDatabase";

interface HabitStats {
  habit: Habit;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  totalCompleted: number;
  isCompletedToday: boolean;
  recentLogs: HabitLog[];
}

export default function CalendarScreen() {
  const [habitStats, setHabitStats] = useState<HabitStats[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const db = useDatabase();
  const today = format(new Date(), "yyyy-MM-dd");

  const loadData = useCallback(async () => {
    try {
      const habits = await db.getHabits();

      if (habits.length === 0) {
        setHabitStats([]);
        return;
      }

      const statsPromises = habits.map(async (habit) => {
        // Get logs for the past 30 days for stats calculation
        const endDate = format(new Date(), "yyyy-MM-dd");
        const startDate = format(subDays(new Date(), 30), "yyyy-MM-dd");

        const [logs, currentStreak, isCompletedToday] = await Promise.all([
          db.getHabitLogs(habit.id, startDate, endDate),
          db.getHabitStreak(habit.id, today),
          db.getHabitCompletion(habit.id, today),
        ]);

        // Calculate completion rate (past 30 days)
        const totalDays = 30;
        const completedDays = logs.filter((log) => log.completed).length;
        const completionRate =
          totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

        // Calculate longest streak from all logs
        const allLogs = await db.getHabitLogs(habit.id, "2020-01-01", endDate);
        const longestStreak = calculateLongestStreak(allLogs);

        // Get recent 7 days for mini calendar
        const recentStartDate = format(subDays(new Date(), 6), "yyyy-MM-dd");
        const recentLogs = await db.getHabitLogs(
          habit.id,
          recentStartDate,
          endDate
        );

        return {
          habit,
          currentStreak,
          longestStreak,
          completionRate,
          totalCompleted: allLogs.filter((log) => log.completed).length,
          isCompletedToday,
          recentLogs,
        };
      });

      const stats = await Promise.all(statsPromises);
      setHabitStats(stats);
    } catch (error) {
      console.error("Error loading calendar data:", error);
    }
  }, [db, today]);

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

  const handleToggleHabit = async (habitId: number) => {
    try {
      const habitStat = habitStats.find((stat) => stat.habit.id === habitId);
      if (!habitStat) return;

      if (habitStat.isCompletedToday) {
        await db.uncompleteHabit(habitId, today);
      } else {
        await db.completeHabit(habitId, today);
      }

      // Data will be refreshed automatically via the event listener
    } catch (error) {
      console.error("Error toggling habit:", error);
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak === 0) return Colors.dark.streak.none;
    if (streak < 7) return Colors.dark.streak.low;
    if (streak < 21) return Colors.dark.streak.medium;
    if (streak < 50) return Colors.dark.streak.high;
    return Colors.dark.streak.max;
  };

  const getAchievementBadges = (stats: HabitStats) => {
    const badges = [];

    if (stats.currentStreak >= 7)
      badges.push({ icon: "🔥", title: "Week Warrior" });
    if (stats.currentStreak >= 30)
      badges.push({ icon: "🏆", title: "Month Master" });
    if (stats.longestStreak >= 50)
      badges.push({ icon: "👑", title: "Streak King" });
    if (stats.completionRate >= 90)
      badges.push({ icon: "⚡", title: "Consistent" });
    if (stats.totalCompleted >= 100)
      badges.push({ icon: "💎", title: "Century Club" });

    return badges;
  };

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
          <Text style={styles.title}>Habit Calendar</Text>
          <Text style={styles.subtitle}>
            Track your progress across all habits
          </Text>
        </View>

        {habitStats.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyText}>No habits to display</Text>
            <Text style={styles.emptySubtext}>
              Add some habits to see your progress calendar
            </Text>
          </GlassCard>
        ) : (
          habitStats.map((stats) => (
            <HabitSection
              key={stats.habit.id}
              stats={stats}
              onToggle={() => handleToggleHabit(stats.habit.id)}
              getStreakColor={getStreakColor}
              getAchievementBadges={getAchievementBadges}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface HabitSectionProps {
  stats: HabitStats;
  onToggle: () => void;
  getStreakColor: (streak: number) => string;
  getAchievementBadges: (statitStats, []) => { icon: string; title: string }[];
}

const HabitSection: React.FC<HabitSectionProps> = ({
  stats,
  onToggle,
  getStreakColor,
  getAchievementBadges,
}) => {
  const checkScale = useSharedValue(stats.isCompletedToday ? 1 : 0);

  useEffect(() => {
    checkScale.value = withSpring(stats.isCompletedToday ? 1 : 0, {
      damping: 15,
      stiffness: 300,
    });
  }, [stats.isCompletedToday, checkScale]);

  const checkAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: checkScale.value }],
    };
  });

  const badges = getAchievementBadges(stats);

  // Generate mini calendar for past 7 days
  const generateMiniCalendar = () => {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const log = stats.recentLogs.find((log) => log.date === dateStr);
      const isCompleted = log?.completed || false;

      days.push({
        date,
        dateStr,
        isCompleted,
        dayLabel: format(date, "E").charAt(0), // First letter of day
        dayNumber: format(date, "d"),
      });
    }

    return days;
  };

  const miniCalendarDays = generateMiniCalendar();

  return (
    <GlassCard style={styles.habitCard}>
      {/* Habit Header */}
      <View style={styles.habitHeader}>
        <View style={styles.habitInfo}>
          <Text style={styles.habitEmoji}>{stats.habit.emoji}</Text>
          <View style={styles.habitDetails}>
            <Text style={styles.habitTitle}>{stats.habit.title}</Text>
            <Text style={styles.habitTime}>⏰ {stats.habit.time}</Text>
          </View>
        </View>

        <Pressable onPress={onToggle} style={styles.checkButton}>
          <View
            style={[
              styles.checkCircle,
              stats.isCompletedToday && styles.checkCircleCompleted,
            ]}
          >
            <Animated.View style={checkAnimatedStyle}>
              <Ionicons
                name="checkmark"
                size={20}
                color={Colors.dark.textPrimary}
              />
            </Animated.View>
          </View>
        </Pressable>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statValue,
              { color: getStreakColor(stats.currentStreak) },
            ]}
          >
            {stats.currentStreak}
          </Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.completionRate}%</Text>
          <Text style={styles.statLabel}>30-Day Rate</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.longestStreak}</Text>
          <Text style={styles.statLabel}>Best Streak</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalCompleted}</Text>
          <Text style={styles.statLabel}>Total Done</Text>
        </View>
      </View>

      {/* Mini Calendar */}
      <View style={styles.miniCalendarSection}>
        <Text style={styles.sectionTitle}>Past 7 Days</Text>
        <View style={styles.miniCalendar}>
          {miniCalendarDays.map((day) => (
            <View key={day.dateStr} style={styles.miniCalendarDay}>
              <Text style={styles.dayLabel}>{day.dayLabel}</Text>
              <View
                style={[
                  styles.dayCircle,
                  day.isCompleted && styles.dayCircleCompleted,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    day.isCompleted && styles.dayNumberCompleted,
                  ]}
                >
                  {day.dayNumber}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Achievement Badges */}
      {badges.length > 0 && (
        <View style={styles.badgesSection}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.badges}>
            {badges.map((badge) => (
              <View key={`${badge.icon}-${badge.title}`} style={styles.badge}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={styles.badgeTitle}>{badge.title}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </GlassCard>
  );
};

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
    justifyContent: "space-between",
    marginBottom: 16,
  },
  habitInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  habitEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  habitDetails: {
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
  checkButton: {
    padding: 4,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.dark.clay.border,
    backgroundColor: Colors.dark.clay.background,
    justifyContent: "center",
    alignItems: "center",
  },
  checkCircleCompleted: {
    backgroundColor: Colors.dark.success,
    borderColor: Colors.dark.success,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: Colors.dark.clay.background,
    borderRadius: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  miniCalendarSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
    marginBottom: 8,
  },
  miniCalendar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  miniCalendarDay: {
    alignItems: "center",
  },
  dayLabel: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    marginBottom: 4,
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.clay.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.clay.border,
  },
  dayCircleCompleted: {
    backgroundColor: Colors.dark.success,
    borderColor: Colors.dark.success,
  },
  dayNumber: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontWeight: "500",
  },
  dayNumberCompleted: {
    color: Colors.dark.textPrimary,
    fontWeight: "bold",
  },
  badgesSection: {
    marginTop: 4,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.clay.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.clay.border,
  },
  badgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  badgeTitle: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    fontWeight: "500",
  },
});
