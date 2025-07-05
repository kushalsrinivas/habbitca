import { Colors } from "@/constants/Colors";
import { useDatabase } from "@/hooks/useDatabase";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { CartesianChart, Line } from "victory-native";

interface TimeConsistencyChartProps {
  daysCount?: number;
  height?: number;
}

export const TimeConsistencyChart: React.FC<TimeConsistencyChartProps> = ({
  daysCount = 30,
  height = 250,
}) => {
  const [data, setData] = useState<{ date: string; totalTime: number }[]>([]);
  const [consistencyStats, setConsistencyStats] = useState({
    daysWithTime: 0,
    totalDays: 0,
    consistencyPercentage: 0,
    currentStreak: 0,
  });
  const [loading, setLoading] = useState(true);
  // Disabled interactive tooltips to avoid SharedValue issues
  // const { state, isActive } = useChartPressState({ x: 0, y: { totalTime: 0 } });

  const db = useDatabase();

  const loadData = async () => {
    setLoading(true);
    try {
      const [timeData, stats] = await Promise.all([
        db.getDailyTotalTimeData(daysCount),
        db.getTimeConsistencyStats(daysCount),
      ]);

      // Fill in missing days with 0 values for better visualization
      const filledData = fillMissingDays(timeData, daysCount);
      setData(filledData);
      setConsistencyStats(stats);
    } catch (error) {
      console.error("Error loading time consistency data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fillMissingDays = (
    data: { date: string; totalTime: number }[],
    days: number
  ): { date: string; totalTime: number }[] => {
    const result: { date: string; totalTime: number }[] = [];
    const dataMap = new Map(data.map((d) => [d.date, d.totalTime]));

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      result.push({
        date: dateStr,
        totalTime: dataMap.get(dateStr) || 0,
      });
    }

    return result;
  };

  useEffect(() => {
    loadData();
  }, [daysCount]);

  // Listen for database changes
  useEffect(() => {
    const handleDataChange = () => {
      loadData();
    };

    db.onDataChange(handleDataChange);
    return () => db.offDataChange(handleDataChange);
  }, [db]);

  const formatTime = (seconds: number): string => {
    if (seconds === 0) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getConsistencyColor = (percentage: number): string => {
    if (percentage >= 80) return Colors.dark.success;
    if (percentage >= 60) return Colors.dark.warning;
    return Colors.dark.streak.low;
  };

  const getStreakEmoji = (streak: number): string => {
    if (streak >= 30) return "🔥🔥🔥";
    if (streak >= 14) return "🔥🔥";
    if (streak >= 7) return "🔥";
    if (streak >= 3) return "⚡";
    return "🌱";
  };

  // Transform data for Victory Native
  const chartData = data.map((point, index) => ({
    x: index,
    totalTime: point.totalTime / 60, // Convert to minutes for better scaling
    date: point.date,
  }));

  const totalTime = data.reduce((sum, point) => sum + point.totalTime, 0);
  const averageTime = data.length > 0 ? totalTime / data.length : 0;
  const maxTime = Math.max(...data.map((d) => d.totalTime), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Time Consistency</Text>
        <Text style={styles.subtitle}>Daily time logged across all habits</Text>
      </View>

      {/* Consistency Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statValue,
              {
                color: getConsistencyColor(
                  consistencyStats.consistencyPercentage
                ),
              },
            ]}
          >
            {consistencyStats.consistencyPercentage.toFixed(0)}%
          </Text>
          <Text style={styles.statLabel}>Consistency</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {consistencyStats.currentStreak}{" "}
            {getStreakEmoji(consistencyStats.currentStreak)}
          </Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {consistencyStats.daysWithTime}/{consistencyStats.totalDays}
          </Text>
          <Text style={styles.statLabel}>Active Days</Text>
        </View>
      </View>

      {/* Chart */}
      <View style={[styles.chartContainer, { height }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
            <Text style={styles.loadingText}>Loading consistency data...</Text>
          </View>
        ) : data.length === 0 || totalTime === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No time data yet</Text>
            <Text style={styles.emptySubtext}>
              Start tracking time to see your consistency patterns!
            </Text>
          </View>
        ) : (
          <View style={styles.chart}>
            <CartesianChart
              data={chartData}
              xKey="x"
              yKeys={["totalTime"]}
              domainPadding={{ left: 10, right: 10, top: 20, bottom: 10 }}
            >
              {({ points }) => (
                <Line
                  points={points.totalTime}
                  color={Colors.dark.primary}
                  strokeWidth={3}
                  animate={{ type: "timing", duration: 1000 }}
                  connectMissingData={false}
                />
              )}
            </CartesianChart>

            {/* Active point indicator - disabled to avoid SharedValue issues */}
            {/* {isActive && (
              <View style={styles.activePointContainer}>
                <Text style={styles.activePointText}>
                  Active point data
                </Text>
              </View>
            )} */}
          </View>
        )}
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatTime(totalTime)}</Text>
          <Text style={styles.summaryLabel}>Total Time</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatTime(averageTime)}</Text>
          <Text style={styles.summaryLabel}>Daily Average</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatTime(maxTime)}</Text>
          <Text style={styles.summaryLabel}>Best Day</Text>
        </View>
      </View>

      {/* Insights */}
      {data.length > 0 && (
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>💡 Insights</Text>
          <View style={styles.insightsList}>
            {consistencyStats.consistencyPercentage >= 80 && (
              <Text style={styles.insightText}>
                🎉 Excellent consistency! You&apos;re logging time{" "}
                {consistencyStats.consistencyPercentage.toFixed(0)}% of days.
              </Text>
            )}
            {consistencyStats.currentStreak >= 7 && (
              <Text style={styles.insightText}>
                🔥 Great streak! You&apos;ve been consistent for{" "}
                {consistencyStats.currentStreak} days.
              </Text>
            )}
            {consistencyStats.consistencyPercentage < 50 && (
              <Text style={styles.insightText}>
                📈 Try to track time more regularly to build better habits!
              </Text>
            )}
            {averageTime > 0 && (
              <Text style={styles.insightText}>
                ⏱️ You average {formatTime(averageTime)} of focused time per
                day.
              </Text>
            )}
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
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    backgroundColor: Colors.dark.background3,
    borderRadius: 12,
    paddingVertical: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  chartContainer: {
    marginBottom: 20,
  },
  chart: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: Colors.dark.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  activePointContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activePointText: {
    color: Colors.dark.textPrimary,
    fontSize: 10,
    fontWeight: "bold",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.clay.border,
    marginBottom: 16,
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
  insightsContainer: {
    backgroundColor: Colors.dark.background3,
    borderRadius: 12,
    padding: 16,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
    marginBottom: 12,
  },
  insightsList: {
    gap: 8,
  },
  insightText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
});
