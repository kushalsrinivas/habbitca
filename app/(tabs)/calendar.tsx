import { useFocusEffect } from "@react-navigation/native";
import { format, subDays } from "date-fns";
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
import { StreakHeatmap } from "@/components/ui/StreakHeatmap";
import { Colors } from "@/constants/Colors";
import { type Habit, type HabitLog, useDatabase } from "@/hooks/useDatabase";

export default function CalendarScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const db = useDatabase();

  const loadData = useCallback(async () => {
    try {
      const habitsData = await db.getHabits();
      setHabits(habitsData);

      if (habitsData.length > 0) {
        const firstHabit = habitsData[0];
        setSelectedHabit(firstHabit);

        // Load logs for the past 12 weeks
        const endDate = format(new Date(), "yyyy-MM-dd");
        const startDate = format(subDays(new Date(), 84), "yyyy-MM-dd"); // 12 weeks

        const logs = await db.getHabitLogs(firstHabit.id, startDate, endDate);
        setHabitLogs(logs);
      }
    } catch (error) {
      console.error("Error loading calendar data:", error);
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

  const handleHabitSelect = async (habit: Habit) => {
    setSelectedHabit(habit);

    try {
      const endDate = format(new Date(), "yyyy-MM-dd");
      const startDate = format(subDays(new Date(), 84), "yyyy-MM-dd");

      const logs = await db.getHabitLogs(habit.id, startDate, endDate);
      setHabitLogs(logs);
    } catch (error) {
      console.error("Error loading habit logs:", error);
    }
  };

  const getCompletionRate = () => {
    if (habitLogs.length === 0) return 0;
    const completedDays = habitLogs.filter((log) => log.completed).length;
    return Math.round((completedDays / habitLogs.length) * 100);
  };

  const getCurrentStreak = useCallback(async () => {
    if (!selectedHabit) return 0;
    const today = format(new Date(), "yyyy-MM-dd");
    return await db.getHabitStreak(selectedHabit.id, today);
  }, [selectedHabit, db]);

  const [currentStreak, setCurrentStreak] = useState(0);

  React.useEffect(() => {
    if (selectedHabit) {
      getCurrentStreak().then(setCurrentStreak);
    }
  }, [selectedHabit, getCurrentStreak]);

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
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.subtitle}>Visualize your habit journey</Text>
        </View>

        {habits.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyText}>No habits to display</Text>
            <Text style={styles.emptySubtext}>
              Add some habits to see your progress calendar
            </Text>
          </GlassCard>
        ) : (
          <>
            {/* Habit Selector */}
            <GlassCard style={styles.selectorCard}>
              <Text style={styles.cardTitle}>Select Habit</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.habitSelector}>
                  {habits.map((habit) => (
                    <View
                      key={habit.id}
                      style={[
                        styles.habitChip,
                        selectedHabit?.id === habit.id &&
                          styles.habitChipSelected,
                      ]}
                      onTouchEnd={() => handleHabitSelect(habit)}
                    >
                      <Text
                        style={[
                          styles.habitChipText,
                          selectedHabit?.id === habit.id &&
                            styles.habitChipTextSelected,
                        ]}
                      >
                        {habit.title}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </GlassCard>

            {selectedHabit && (
              <>
                {/* Stats Summary */}
                <GlassCard style={styles.statsCard}>
                  <Text style={styles.cardTitle}>{selectedHabit.title}</Text>

                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{currentStreak}</Text>
                      <Text style={styles.statLabel}>Current Streak</Text>
                    </View>

                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>
                        {getCompletionRate()}%
                      </Text>
                      <Text style={styles.statLabel}>Completion Rate</Text>
                    </View>

                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>
                        {habitLogs.filter((log) => log.completed).length}
                      </Text>
                      <Text style={styles.statLabel}>Total Completed</Text>
                    </View>
                  </View>
                </GlassCard>

                {/* Heatmap */}
                <GlassCard style={styles.heatmapCard}>
                  <StreakHeatmap habitLogs={habitLogs} weeks={12} />
                </GlassCard>

                {/* Legend */}
                <GlassCard style={styles.legendCard}>
                  <Text style={styles.cardTitle}>How to read the calendar</Text>

                  <View style={styles.legendInfo}>
                    <Text style={styles.legendText}>
                      • Each square represents one day
                    </Text>
                    <Text style={styles.legendText}>
                      • Darker colors indicate habit completion
                    </Text>
                    <Text style={styles.legendText}>
                      • Gray squares are days without completion
                    </Text>
                    <Text style={styles.legendText}>
                      • Build streaks by completing habits daily!
                    </Text>
                  </View>
                </GlassCard>
              </>
            )}
          </>
        )}
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
  selectorCard: {
    margin: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    marginBottom: 12,
  },
  habitSelector: {
    flexDirection: "row",
    gap: 8,
  },
  habitChip: {
    backgroundColor: Colors.dark.clay.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.clay.border,
  },
  habitChipSelected: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  habitChipText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  habitChipTextSelected: {
    color: Colors.dark.textPrimary,
    fontWeight: "bold",
  },
  statsCard: {
    margin: 16,
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
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  heatmapCard: {
    margin: 16,
    marginBottom: 8,
  },
  legendCard: {
    margin: 16,
    padding: 20,
    marginBottom: 100,
  },
  legendInfo: {
    gap: 8,
  },
  legendText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
});
