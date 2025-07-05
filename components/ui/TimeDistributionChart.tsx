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

interface TimeDistributionChartProps {
  height?: number;
}

type TimePeriod = "7" | "30" | "all";

interface DistributionData {
  habitId: number;
  habitTitle: string;
  habitEmoji: string;
  totalTime: number;
  percentage: number;
}

export const TimeDistributionChart: React.FC<TimeDistributionChartProps> = ({
  height = 300,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("7");
  const [data, setData] = useState<DistributionData[]>([]);
  const [loading, setLoading] = useState(true);

  const db = useDatabase();

  const loadData = async (period: TimePeriod) => {
    setLoading(true);
    try {
      let daysCount = 7;
      if (period === "30") daysCount = 30;
      else if (period === "all") daysCount = 365; // Use 1 year as "all time"

      const distributionData = await db.getTimeDistributionData(daysCount);
      setData(distributionData);
    } catch (error) {
      console.error("Error loading time distribution data:", error);
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

  const getPeriodTitle = () => {
    switch (selectedPeriod) {
      case "7":
        return "Last 7 Days";
      case "30":
        return "Last 30 Days";
      case "all":
        return "All Time";
    }
  };

  const getColorForIndex = (index: number): string => {
    const colors = [
      Colors.dark.primary,
      Colors.dark.success,
      Colors.dark.warning,
      Colors.dark.info,
      Colors.dark.streak.high,
      Colors.dark.streak.medium,
      Colors.dark.streak.low,
    ];
    return colors[index % colors.length];
  };

  const totalTime = data.reduce((sum, item) => sum + item.totalTime, 0);

  // Simple pie chart using View components (since we don't have a pie chart library)
  const renderPieChart = () => {
    if (data.length === 0) return null;

    const radius = 80;
    const centerX = radius;
    const centerY = radius;

    return (
      <View
        style={[styles.pieContainer, { width: radius * 2, height: radius * 2 }]}
      >
        <View style={styles.pieCenter}>
          <Text style={styles.pieCenterText}>{formatTime(totalTime)}</Text>
          <Text style={styles.pieCenterLabel}>Total Time</Text>
        </View>

        {/* Simplified representation using colored bars */}
        <View style={styles.pieSegments}>
          {data.map((item, index) => (
            <View
              key={item.habitId}
              style={[
                styles.pieSegment,
                {
                  backgroundColor: getColorForIndex(index),
                  flex: item.percentage,
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🥧 Time Distribution</Text>
        <Text style={styles.subtitle}>{getPeriodTitle()}</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(["7", "30", "all"] as TimePeriod[]).map((period) => (
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
              {period === "7"
                ? "7 Days"
                : period === "30"
                ? "30 Days"
                : "All Time"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Chart */}
      <View style={[styles.chartContainer, { height }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
            <Text style={styles.loadingText}>Loading distribution data...</Text>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No time data yet</Text>
            <Text style={styles.emptySubtext}>
              Start tracking time for your habits to see the distribution!
            </Text>
          </View>
        ) : (
          <View style={styles.chartContent}>
            {renderPieChart()}

            {/* Legend */}
            <View style={styles.legend}>
              {data.map((item, index) => (
                <View key={item.habitId} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendColor,
                      { backgroundColor: getColorForIndex(index) },
                    ]}
                  />
                  <Text style={styles.legendEmoji}>{item.habitEmoji}</Text>
                  <View style={styles.legendText}>
                    <Text style={styles.legendTitle}>{item.habitTitle}</Text>
                    <Text style={styles.legendStats}>
                      {formatTime(item.totalTime)} •{" "}
                      {item.percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
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
  chartContainer: {
    marginBottom: 20,
  },
  chartContent: {
    flex: 1,
    alignItems: "center",
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
  pieContainer: {
    position: "relative",
    marginBottom: 20,
  },
  pieCenter: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -40 }, { translateY: -20 }],
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 40,
  },
  pieCenterText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
  },
  pieCenterLabel: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
  },
  pieSegments: {
    flexDirection: "row",
    height: 20,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 60,
  },
  pieSegment: {
    minWidth: 2,
  },
  legend: {
    width: "100%",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.dark.background3,
    borderRadius: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
    marginBottom: 2,
  },
  legendStats: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
});
