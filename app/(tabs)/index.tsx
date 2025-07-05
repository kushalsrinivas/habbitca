import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { format, subDays } from "date-fns";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
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

import { ClayButton } from "@/components/ui/ClayButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { HabitCreationBottomSheet } from "@/components/ui/HabitCreationBottomSheet";
import { HabitEditBottomSheet } from "@/components/ui/HabitEditBottomSheet";
import { XPProgressBar } from "@/components/ui/XPProgressBar";
import { Colors } from "@/constants/Colors";
import {
  type Habit,
  type HabitLog,
  useDatabase,
  type UserStats,
} from "@/hooks/useDatabase";

interface HabitStats {
  habit: Habit;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  totalCompleted: number;
  isCompletedToday: boolean;
  recentLogs: HabitLog[];
}

interface HabitSectionProps {
  stats: HabitStats;
  onToggle: () => void;
  onEdit: () => void;
  getStreakColor: (streak: number) => string;
  getAchievementBadges: (
    stats: HabitStats
  ) => { icon: string; title: string }[];
}

const HabitSection: React.FC<HabitSectionProps> = ({
  stats,
  onToggle,
  onEdit,
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

        <View style={styles.habitActions}>
          <Pressable
            onPress={() => {
              console.log("Edit button pressed for habit:", stats.habit.title);
              onEdit();
            }}
            style={styles.actionButton}
          >
            <Ionicons
              name="pencil"
              size={18}
              color={Colors.dark.textSecondary}
            />
          </Pressable>

          {stats.habit.track_time ? (
            <Pressable 
              onPress={() => {
                router.push({
                  pathname: "/timer",
                  params: { habitId: stats.habit.id.toString() },
                });
              }} 
              style={styles.timerButton}
            >
              <Ionicons
                name="timer-outline"
                size={20}
                color={Colors.dark.textPrimary}
              />
              <Text style={styles.timerButtonText}>Start Session</Text>
            </Pressable>
          ) : (
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
          )}
        </View>
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

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitStats, setHabitStats] = useState<HabitStats[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddHabitVisible, setIsAddHabitVisible] = useState(false);
  const [isEditHabitVisible, setIsEditHabitVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

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
      await db.initializeDatabase();

      // Initialize sample habits for testing (only if no habits exist)
      await db.initializeSampleHabits();

      const [habitsData, statsData] = await Promise.all([
        db.getHabits(),
        db.getUserStats(),
      ]);

      setHabits(habitsData);
      setUserStats(statsData);

      if (habitsData.length === 0) {
        setHabitStats([]);
        return;
      }

      // Calculate detailed stats for each habit
      const statsPromises = habitsData.map(async (habit) => {
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
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load habits data");
    }
  }, [db, today]);

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

  const handleToggleHabit = async (habitId: number) => {
    try {
      const habitStat = habitStats.find((stat) => stat.habit.id === habitId);
      if (!habitStat) return;

      if (habitStat.isCompletedToday) {
        await db.uncompleteHabit(habitId, today);
      } else {
        // Complete habit and check for level-up
        const result = await db.completeHabit(habitId, today);

        // Check if user leveled up
        if (result.levelUpData) {
          router.push({
            pathname: "/celebration",
            params: {
              levelUpData: JSON.stringify(result.levelUpData),
            },
          });
        }

        // Check for new achievements (this might also trigger the modal)
        const newAchievements = await db.checkAndUnlockAchievements();
        console.log("🎉 New achievements unlocked:", newAchievements);

        if (newAchievements.length > 0 && !result.levelUpData) {
          // Only show achievement modal if no level-up occurred
          const achievements = await db.getAllAchievements();
          const firstNewAchievement = achievements.find(
            (a) => newAchievements.includes(a.id) && a.is_unlocked
          );

          console.log("🏆 First new achievement to show:", firstNewAchievement);

          if (firstNewAchievement) {
            console.log(
              "🎊 Navigating to celebration screen for achievement:",
              firstNewAchievement.title
            );
            router.push({
              pathname: "/celebration",
              params: {
                achievement: JSON.stringify(firstNewAchievement),
              },
            });
          }
        }
      }

      // Reload data to reflect changes
      await loadData();
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

  const handleAddHabit = () => {
    setIsAddHabitVisible(true);
  };

  const handleCreateHabit = async (habitData: {
    title: string;
    description: string;
    emoji: string;
    category: string;
    time: string;
    track_time: boolean;
  }) => {
    try {
      await db.addHabit({
        title: habitData.title,
        description: habitData.description,
        emoji: habitData.emoji,
        category: habitData.category,
        frequency: "daily",
        time: habitData.time,
        track_time: habitData.track_time,
      });

      // Reload data to show the new habit
      await loadData();

      // Close the bottom sheet
      setIsAddHabitVisible(false);

      // Show success message
      Alert.alert(
        "Success! 🎉",
        `Your habit '${habitData.title}' has been created. Start building your streak!`,
        [{ text: "OK", style: "default" }]
      );
    } catch (error) {
      console.error("Error creating habit:", error);
      Alert.alert("Error", "Failed to create habit. Please try again.");
    }
  };

  const handleEditHabit = (habit: Habit) => {
    console.log("handleEditHabit called with habit:", habit);
    setEditingHabit(habit);
    setIsEditHabitVisible(true);
    console.log("Edit modal state set to visible");
  };

  const handleDeleteHabit = async (habitId: number) => {
    if (!editingHabit) return;

    try {
      await db.deleteHabit(habitId);
      await loadData();

      // Close the edit modal
      setIsEditHabitVisible(false);
      setEditingHabit(null);

      Alert.alert("Success", "Habit deleted successfully");
    } catch (error) {
      console.error("Error deleting habit:", error);
      Alert.alert("Error", "Failed to delete habit. Please try again.");
    }
  };

  const handleUpdateHabit = async (habitData: {
    title: string;
    description: string;
    emoji: string;
    category: string;
    time: string;
    track_time: boolean;
  }) => {
    if (!editingHabit) return;

    try {
      await db.updateHabit(editingHabit.id, {
        title: habitData.title,
        description: habitData.description,
        emoji: habitData.emoji,
        category: habitData.category,
        frequency: "daily",
        time: habitData.time,
        track_time: habitData.track_time ?? editingHabit.track_time ?? false,
      });

      // Reload data to show the updated habit
      await loadData();

      // Close the bottom sheet
      setIsEditHabitVisible(false);
      setEditingHabit(null);

      // Show success message
      Alert.alert(
        "Success! ✨",
        `Your habit '${habitData.title}' has been updated!`,
        [{ text: "OK", style: "default" }]
      );
    } catch (error) {
      console.error("Error updating habit:", error);
      Alert.alert("Error", "Failed to update habit. Please try again.");
    }
  };

  const getXPProgress = () => {
    if (!userStats) return { current: 0, needed: 100, percentage: 0 };
    return db.getXPProgress(userStats.xp, userStats.level);
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
          <Text style={styles.title}>Habit Tracker</Text>
          <Text style={styles.subtitle}>
            Build better habits, one day at a time
          </Text>
        </View>

        {/* User Stats Dashboard */}
        <GlassCard style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>
                👑 Level {userStats?.level || 1}
              </Text>
            </View>
            <Text style={styles.xpText}>{userStats?.xp || 0} XP</Text>
          </View>

          <XPProgressBar
            currentXP={xpProgress.current}
            neededXP={xpProgress.needed}
            level={userStats?.level || 1}
            percentage={xpProgress.percentage}
          />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{habits.length}</Text>
              <Text style={styles.statLabel}>Active Habits</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {habitStats.filter((hs) => hs.isCompletedToday).length}
              </Text>
              <Text style={styles.statLabel}>Completed Today</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {habitStats.length > 0
                  ? Math.max(...habitStats.map((hs) => hs.currentStreak), 0)
                  : 0}
              </Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
          </View>
        </GlassCard>

        {/* Add Habit Button */}
        <View style={styles.addButtonContainer}>
          <ClayButton
            title="+ Add New Habit"
            onPress={handleAddHabit}
            variant="primary"
            size="large"
          />
        </View>

        {/* Habits List */}
        <View style={styles.habitsSection}>
          <Text style={styles.sectionTitle}>Today&apos;s Habits</Text>

          {habitStats.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyText}>Loading your habits...</Text>
              <Text style={styles.emptySubtext}>
                We&apos;re setting up some sample habits to get you started!
              </Text>
            </GlassCard>
          ) : (
            habitStats.map((stats) => (
              <HabitSection
                key={stats.habit.id}
                stats={stats}
                onToggle={() => handleToggleHabit(stats.habit.id)}
                onEdit={() => handleEditHabit(stats.habit)}
                getStreakColor={getStreakColor}
                getAchievementBadges={getAchievementBadges}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Habit Creation Bottom Sheet */}
      <HabitCreationBottomSheet
        visible={isAddHabitVisible}
        onClose={() => setIsAddHabitVisible(false)}
        onCreateHabit={handleCreateHabit}
      />

      {/* Habit Edit Bottom Sheet */}
      <HabitEditBottomSheet
        visible={isEditHabitVisible}
        habit={editingHabit}
        onClose={() => {
          setIsEditHabitVisible(false);
          setEditingHabit(null);
        }}
        onUpdateHabit={handleUpdateHabit}
        onDeleteHabit={handleDeleteHabit}
      />
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
  statsCard: {
    margin: 16,
    padding: 20,
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  levelBadge: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  levelText: {
    color: Colors.dark.textPrimary,
    fontWeight: "bold",
    fontSize: 16,
  },
  xpText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.xp.text,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
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
  addButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  habitsSection: {
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
    marginHorizontal: 16,
    marginBottom: 8,
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
    marginBottom: 4,
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
  habitActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.dark.clay.background,
    borderWidth: 1,
    borderColor: Colors.dark.clay.border,
    minWidth: 36,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  timerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  timerButtonText: {
    color: Colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  miniCalendarSection: {
    marginBottom: 16,
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
