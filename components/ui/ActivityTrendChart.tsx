import { Colors } from "@/constants/Colors";
import { useDatabase, type ActivityDataPoint } from "@/hooks/useDatabase";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CartesianChart, Line, useChartPressState } from "victory-native";

type TimePeriod = "daily" | "weekly" | "monthly" | "yearly";

interface ActivityTrendChartProps {
  height?: number;
}

export const ActivityTrendChart: React.FC<ActivityTrendChartProps> = ({
  height = 250,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("weekly");
  const [data, setData] = useState<ActivityDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const { state, isActive } = useChartPressState({ x: 0, y: { value: 0 } });

  const db = useDatabase();

  const loadData = async (period: TimePeriod) => {
    setLoading(true);
    try {
      let activityData: ActivityDataPoint[] = [];

      switch (period) {
        case "daily":
          activityData = await db.getDailyActivityData(30);
          break;
        case "weekly":
          activityData = await db.getWeeklyActivityData(12);
          break;
        case "monthly":
          activityData = await db.getMonthlyActivityData(12);
          break;
        case "yearly":
          activityData = await db.getYearlyActivityData(3);
          break;
      }

      // Fill in missing data points with 0 values for better visualization
      const filledData = fillMissingDataPoints(activityData, period);
      setData(filledData);
    } catch (error) {
      console.error("Error loading activity data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fillMissingDataPoints = (
    data: ActivityDataPoint[],
    period: TimePeriod
  ): ActivityDataPoint[] => {
    if (data.length === 0) return [];

    const result: ActivityDataPoint[] = [];
    const endDate = new Date();
    let currentDate = new Date();
    let count = 0;
    let maxCount = 0;

    switch (period) {
      case "daily":
        currentDate.setDate(currentDate.getDate() - 29);
        maxCount = 30;
        break;
      case "weekly":
        currentDate.setDate(currentDate.getDate() - 12 * 7);
        maxCount = 12;
        break;
      case "monthly":
        currentDate.setMonth(currentDate.getMonth() - 11);
        maxCount = 12;
        break;
      case "yearly":
        currentDate.setFullYear(currentDate.getFullYear() - 2);
        maxCount = 3;
        break;
    }

    while (count < maxCount) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const existingData = data.find(
        (d) => d.date === dateStr || d.date.startsWith(dateStr.substring(0, 7))
      );

      if (existingData) {
        result.push(existingData);
      } else {
        let label = "";
        switch (period) {
          case "daily":
            label = currentDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            break;
          case "weekly":
            label = `Week ${Math.floor(count / 7) + 1}`;
            break;
          case "monthly":
            label = currentDate.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            });
            break;
          case "yearly":
            label = currentDate.getFullYear().toString();
            break;
        }

        result.push({
          date: dateStr,
          value: 0,
          label,
        });
      }

      // Increment date based on period
      switch (period) {
        case "daily":
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case "weekly":
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case "monthly":
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case "yearly":
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }

      count++;
    }

    return result;
  };

  useEffect(() => {
    // Add a small delay to ensure database is ready
    const timer = setTimeout(() => {
      loadData(selectedPeriod);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [selectedPeriod]);

  // Listen for database changes
  useEffect(() => {
    const handleDataChange = () => {
      loadData(selectedPeriod);
    };

    db.onDataChange(handleDataChange);
    return () => db.offDataChange(handleDataChange);
  }, [selectedPeriod, db]);

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
  };

  const getPeriodTitle = () => {
    switch (selectedPeriod) {
      case "daily":
        return "Daily Activity (Last 30 Days)";
      case "weekly":
        return "Weekly Activity (Last 12 Weeks)";
      case "monthly":
        return "Monthly Activity (Last 12 Months)";
      case "yearly":
        return "Yearly Activity (Last 3 Years)";
    }
  };

  // Transform data for Victory Native
  const chartData =
    data.length > 0
      ? data.map((point, index) => ({
    x: index,
    y: point.value,
    label: point.label,
        }))
      : [{ x: 0, y: 0, label: "No data" }];

  const maxValue =
    data.length > 0 ? Math.max(...data.map((d) => d.value), 1) : 1;
  const totalCompleted = data.reduce((sum, point) => sum + point.value, 0);
  const averageCompleted =
    data.length > 0 ? Math.round(totalCompleted / data.length) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📈 Activity Trends</Text>
        <Text style={styles.subtitle}>{getPeriodTitle()}</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(["daily", "weekly", "monthly", "yearly"] as TimePeriod[]).map(
          (period) => (
            <Pressable
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => handlePeriodChange(period)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive,
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </Pressable>
          )
        )}
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
            <Text style={styles.loadingText}>Loading activity data...</Text>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No activity data yet</Text>
            <Text style={styles.emptySubtext}>
              Complete some habits to see your progress trends!
            </Text>
          </View>
        ) : (
          <View style={styles.chart}>
            <CartesianChart
              data={chartData}
              xKey="x"
              yKeys={["y"]}
              domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
            >
              {({ points, chartBounds }) => (
                <Line
                  points={points.y}
                  color={Colors.dark.primary}
                  strokeWidth={3}
                  animate={{ type: "timing", duration: 1000 }}
                  connectMissingData={false}
                />
              )}
            </CartesianChart>

            {/* Active point indicator */}
            {isActive && (
              <View style={styles.activePointContainer}>
                <Text style={styles.activePointText}>
                  {data[Math.floor(state.x)]?.label}:{" "}
                  {Math.round(state.y.value)} habits
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalCompleted}</Text>
          <Text style={styles.summaryLabel}>Total Completed</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{averageCompleted}</Text>
          <Text style={styles.summaryLabel}>Average</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {Math.max(...data.map((d) => d.value), 0)}
          </Text>
          <Text style={styles.summaryLabel}>
            Best {selectedPeriod.slice(0, -2)}
          </Text>
        </View>
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
    height: 250,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activePointText: {
    color: Colors.dark.textPrimary,
    fontSize: 12,
    fontWeight: "bold",
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
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.dark.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
});
