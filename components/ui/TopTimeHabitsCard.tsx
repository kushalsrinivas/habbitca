import { Colors } from "@/constants/Colors";
import { useDatabase } from "@/hooks/useDatabase";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface TopTimeHabitsCardProps {
  daysCount?: number;
  limit?: number;
}

type TimePeriod = "7" | "30";

interface TopHabitData {
  habitId: number;
  habitTitle: string;
  habitEmoji: string;
  totalTime: number;
  previousTime: number;
  change: number;
}

export const TopTimeHabitsCard: React.FC<TopTimeHabitsCardProps> = ({
  daysCount = 7,
  limit = 3,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("7");
  const [data, setData] = useState<TopHabitData[]>([]);
  const [loading, setLoading] = useState(true);

  const db = useDatabase();

  const loadData = async (period: TimePeriod) => {
    setLoading(true);
    try {
      const days = period === "7" ? 7 : 30;
      const topHabits = await db.getTopTimeHabits(days, limit);
      setData(topHabits);
    } catch (error) {
      console.error("Error loading top time habits:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedPeriod);
  }, [selectedPeriod]);

  // Listen for database changes
  useEffect(() => {
    const handleDataChange = () => {
      loadData(selectedPeriod);
    };

    db.onDataChange(handleDataChange);
    return () => db.offDataChange(handleDataChange);
  }, [selectedPeriod, db]);

  const formatTime = (seconds: number): string => {
    if (seconds === 0) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getChangeIcon = (change: number): string => {
    if (change > 0) return "📈";
    if (change < 0) return "📉";
    return "➡️";
  };

  const getChangeColor = (change: number): string => {
    if (change > 0) return Colors.dark.success;
    if (change < 0) return Colors.dark.warning;
    return Colors.dark.textSecondary;
  };

  const getPeriodTitle = () => {
    switch (selectedPeriod) {
      case "7":
        return "Last 7 Days";
      case "30":
        return "Last 30 Days";
    }
  };

  const getRankEmoji = (index: number): string => {
    const emojis = ["🥇", "🥈", "🥉"];
    return emojis[index] || "🏅";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Top Time Habits</Text>
        <Text style={styles.subtitle}>{getPeriodTitle()}</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(["7", "30"] as TimePeriod[]).map((period) => (
          <Pressable
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}
            >
              {period === "7" ? "This Week" : "This Month"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Top Habits List */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
            <Text style={styles.loadingText}>Loading top habits...</Text>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No time data yet</Text>
            <Text style={styles.emptySubtext}>
              Start tracking time for your habits to see the top performers!
            </Text>
          </View>
        ) : (
          <View style={styles.habitsList}>
            {data.map((habit, index) => (
              <View key={habit.habitId} style={styles.habitItem}>
                <View style={styles.habitRank}>
                  <Text style={styles.rankEmoji}>{getRankEmoji(index)}</Text>
                </View>

                <View style={styles.habitInfo}>
                  <View style={styles.habitHeader}>
                    <Text style={styles.habitEmoji}>{habit.habitEmoji}</Text>
                    <Text style={styles.habitTitle}>{habit.habitTitle}</Text>
                  </View>

                  <View style={styles.habitStats}>
                    <Text style={styles.habitTime}>
                      {formatTime(habit.totalTime)}
                    </Text>

                    {habit.change !== 0 && (
                      <View style={styles.changeContainer}>
                        <Text style={styles.changeIcon}>
                          {getChangeIcon(habit.change)}
                        </Text>
                        <Text
                          style={[
                            styles.changeText,
                            { color: getChangeColor(habit.change) },
                          ]}
                        >
                          {Math.abs(habit.change).toFixed(0)}%
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Summary Stats */}
      {data.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {formatTime(
                data.reduce((sum, habit) => sum + habit.totalTime, 0)
              )}
            </Text>
            <Text style={styles.summaryLabel}>Total Time</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {formatTime(
                data.reduce((sum, habit) => sum + habit.totalTime, 0) /
                  data.length
              )}
            </Text>
            <Text style={styles.summaryLabel}>Average</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {data.filter((habit) => habit.change > 0).length}
            </Text>
            <Text style={styles.summaryLabel}>Improving</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.clay.background,
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  periodSelector: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: Colors.dark.clay.border,
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  periodButtonActive: {
    backgroundColor: Colors.dark.primary,
  },
  periodButtonText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontWeight: "500",
  },
  periodButtonTextActive: {
    color: Colors.dark.textPrimary,
    fontWeight: "bold",
  },
  content: {
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: Colors.dark.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  habitsList: {
    gap: 12,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.background3,
    borderRadius: 12,
    padding: 16,
  },
  habitRank: {
    marginRight: 12,
  },
  rankEmoji: {
    fontSize: 24,
  },
  habitInfo: {
    flex: 1,
  },
  habitHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  habitEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
    flex: 1,
  },
  habitStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  habitTime: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.primary,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.clay.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  changeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.clay.border,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.dark.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
});
