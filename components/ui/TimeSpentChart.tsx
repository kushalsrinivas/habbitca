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
import { CartesianChart, Line } from "victory-native";

interface TimeSpentChartProps {
  habitId: number;
  habitTitle: string;
  habitEmoji: string;
  daysCount?: number;
  height?: number;
}

export const TimeSpentChart: React.FC<TimeSpentChartProps> = ({
  habitId,
  habitTitle,
  habitEmoji,
  daysCount = 14,
  height = 150,
}) => {
  const [data, setData] = useState<{ date: string; timeSpent: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  // Disabled interactive tooltips to avoid SharedValue issues
  // const { state, isActive } = useChartPressState({ x: 0, y: { timeSpent: 0 } });

  const db = useDatabase();

  const loadData = async () => {
    setLoading(true);
    try {
      const timeData = await db.getHabitTimeData(habitId, daysCount);

      // Fill in missing days with 0 values for better visualization
      const filledData = fillMissingDays(timeData, daysCount);
      setData(filledData);
    } catch (error) {
      console.error("Error loading time data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fillMissingDays = (
    data: { date: string; timeSpent: number }[],
    days: number
  ): { date: string; timeSpent: number }[] => {
    const result: { date: string; timeSpent: number }[] = [];
    const dataMap = new Map(data.map((d) => [d.date, d.timeSpent]));

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      result.push({
        date: dateStr,
        timeSpent: dataMap.get(dateStr) || 0,
      });
    }

    return result;
  };

  useEffect(() => {
    loadData();
  }, [habitId, daysCount]);

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

  // Transform data for Victory Native
  const chartData = data.map((point, index) => ({
    x: index,
    timeSpent: point.timeSpent / 60, // Convert to minutes for better scaling
    date: point.date,
  }));

  const totalTime = data.reduce((sum, point) => sum + point.timeSpent, 0);
  const averageTime = data.length > 0 ? totalTime / data.length : 0;
  const maxTime = Math.max(...data.map((d) => d.timeSpent), 0);

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={() => setExpanded(!expanded)}>
        <View style={styles.titleRow}>
          <Text style={styles.emoji}>{habitEmoji}</Text>
          <Text style={styles.title}>{habitTitle}</Text>
          <Text style={styles.expandIcon}>{expanded ? "▼" : "▶"}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Total: {formatTime(totalTime)}</Text>
          <Text style={styles.summaryText}>Avg: {formatTime(averageTime)}</Text>
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.expandedContent}>
          <View style={[styles.chartContainer, { height }]}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.dark.primary} />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : data.length === 0 || totalTime === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No time data yet</Text>
                <Text style={styles.emptySubtext}>
                  Start tracking time for this habit!
                </Text>
              </View>
            ) : (
              <View style={styles.chart}>
                <CartesianChart
                  data={chartData}
                  xKey="x"
                  yKeys={["timeSpent"]}
                  domainPadding={{ left: 10, right: 10, top: 10, bottom: 10 }}
                >
                  {({ points }) => (
                    <Line
                      points={points.timeSpent}
                      color={Colors.dark.primary}
                      strokeWidth={2}
                      animate={{ type: "timing", duration: 800 }}
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

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(totalTime)}</Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(averageTime)}</Text>
              <Text style={styles.statLabel}>Daily Average</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(maxTime)}</Text>
              <Text style={styles.statLabel}>Longest Session</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.clay.background,
    borderRadius: 12,
    marginVertical: 12,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  header: {
    padding: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  emoji: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
    flex: 1,
  },
  expandIcon: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: Colors.dark.clay.border,
  },
  chartContainer: {
    padding: 16,
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
    marginTop: 8,
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
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
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.clay.border,
    paddingTop: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.dark.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
  },
});
