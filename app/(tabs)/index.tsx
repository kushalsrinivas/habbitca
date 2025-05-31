import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns";
import React, { useCallback, useState } from "react";
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AchievementUnlockModal } from "@/components/ui/AchievementUnlockModal";
import { ClayButton } from "@/components/ui/ClayButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { HabitCard } from "@/components/ui/HabitCard";
import { HabitCreationBottomSheet } from "@/components/ui/HabitCreationBottomSheet";
import { XPProgressBar } from "@/components/ui/XPProgressBar";
import { Colors } from "@/constants/Colors";
import {
  type Achievement,
  type Habit,
  type UserStats,
  useDatabase,
} from "@/hooks/useDatabase";

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [habitCompletions, setHabitCompletions] = useState<
    Record<number, boolean>
  >({});
  const [habitStreaks, setHabitStreaks] = useState<Record<number, number>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [unlockedAchievement, setUnlockedAchievement] =
    useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [isAddHabitVisible, setIsAddHabitVisible] = useState(false);

  const db = useDatabase();
  const today = format(new Date(), "yyyy-MM-dd");

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

      // Load completion status and streaks for each habit
      const completions: Record<number, boolean> = {};
      const streaks: Record<number, number> = {};

      for (const habit of habitsData) {
        const [isCompleted, streak] = await Promise.all([
          db.getHabitCompletion(habit.id, today),
          db.getHabitStreak(habit.id, today),
        ]);
        completions[habit.id] = isCompleted;
        streaks[habit.id] = streak;
      }

      setHabitCompletions(completions);
      setHabitStreaks(streaks);
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
      const isCurrentlyCompleted = habitCompletions[habitId];

      if (isCurrentlyCompleted) {
        await db.uncompleteHabit(habitId, today);
      } else {
        await db.completeHabit(habitId, today);

        // Check for newly unlocked achievements
        const newAchievements = await db.checkAndUnlockAchievements();
        if (newAchievements.length > 0) {
          // Show the first unlocked achievement
          const achievements = await db.getAllAchievements();
          const unlockedAchievement = achievements.find(
            (a) => newAchievements.includes(a.id) && a.is_unlocked
          );

          if (unlockedAchievement) {
            setUnlockedAchievement(unlockedAchievement);
            setShowAchievementModal(true);
          }
        }
      }

      // Reload data to get updated stats
      await loadData();
    } catch (error) {
      console.error("Error toggling habit:", error);
      Alert.alert("Error", "Failed to update habit");
    }
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
  }) => {
    try {
      await db.addHabit({
        title: habitData.title,
        description: habitData.description,
        emoji: habitData.emoji,
        category: habitData.category,
        frequency: "daily",
        time: habitData.time,
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

  const handleCloseAchievementModal = () => {
    setShowAchievementModal(false);
    setUnlockedAchievement(null);
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
                {Object.values(habitCompletions).filter(Boolean).length}
              </Text>
              <Text style={styles.statLabel}>Completed Today</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Math.max(...Object.values(habitStreaks), 0)}
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
          <Text style={styles.sectionTitle}>Today's Habits</Text>

          {habits.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyText}>Loading your habits...</Text>
              <Text style={styles.emptySubtext}>
                We're setting up some sample habits to get you started!
              </Text>
            </GlassCard>
          ) : (
            habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                isCompleted={habitCompletions[habit.id] || false}
                streak={habitStreaks[habit.id] || 0}
                onToggleComplete={() => handleToggleHabit(habit.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Achievement Unlock Modal */}
      <AchievementUnlockModal
        visible={showAchievementModal}
        achievement={unlockedAchievement}
        onClose={handleCloseAchievementModal}
      />

      {/* Habit Creation Bottom Sheet */}
      <HabitCreationBottomSheet
        visible={isAddHabitVisible}
        onClose={() => setIsAddHabitVisible(false)}
        onCreateHabit={handleCreateHabit}
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
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  habitsSection: {
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
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
});
