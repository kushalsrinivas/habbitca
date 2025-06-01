import { Colors } from "@/constants/Colors";
import { type HabitLog } from "@/hooks/useDatabase";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfYear,
  format,
  getDay,
  startOfMonth,
  startOfYear,
} from "date-fns";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface HabitHeatmapProps {
  habitLogs: HabitLog[];
  habitCreatedAt: string;
}

type ViewMode = "year" | "month";

export const HabitHeatmap: React.FC<HabitHeatmapProps> = ({
  habitLogs,
  habitCreatedAt,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("year");
  const today = new Date();

  // Create a map for quick lookup of completed dates
  const completedDatesMap = new Map<string, boolean>();
  habitLogs.forEach((log) => {
    if (log.completed) {
      completedDatesMap.set(log.date, true);
    }
  });

  const getIntensityColor = (
    isCompleted: boolean,
    isBeforeCreation: boolean
  ) => {
    if (isBeforeCreation) {
      return Colors.dark.clay.background; // Empty/unavailable
    }
    return isCompleted ? Colors.dark.success : Colors.dark.clay.background;
  };

  const renderYearView = () => {
    const startDate = startOfYear(today);
    const endDate = endOfYear(today);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Group days into weeks (starting from Sunday)
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    // Add empty cells for the first week if it doesn't start on Sunday
    const firstDayOfWeek = getDay(startDate);
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(new Date(0)); // Placeholder for empty cells
    }

    days.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // Add the last partial week if it exists
    if (currentWeek.length > 0) {
      // Fill remaining days with placeholders
      while (currentWeek.length < 7) {
        currentWeek.push(new Date(0));
      }
      weeks.push(currentWeek);
    }

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.yearContainer}>
          {/* Month labels */}
          <View style={styles.monthLabelsContainer}>
            {[
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ].map((month, index) => {
              // Calculate position based on weeks
              const monthStartWeek = Math.floor(index * (weeks.length / 12));
              return (
                <Text
                  key={month}
                  style={[
                    styles.monthLabel,
                    { left: monthStartWeek * 14 + 24 }, // 24 is offset for day labels
                  ]}
                >
                  {month}
                </Text>
              );
            })}
          </View>

          <View style={styles.yearContent}>
            {/* Day labels */}
            <View style={styles.dayLabelsContainer}>
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <Text key={`${day}-${index}`} style={styles.dayLabel}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Heatmap grid */}
            <View style={styles.heatmapGrid}>
              {weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.weekColumn}>
                  {week.map((day, dayIndex) => {
                    if (day.getTime() === 0) {
                      // Empty placeholder cell
                      return (
                        <View
                          key={`empty-${weekIndex}-${dayIndex}`}
                          style={styles.emptyCell}
                        />
                      );
                    }

                    const dateStr = format(day, "yyyy-MM-dd");
                    const isCompleted = completedDatesMap.has(dateStr);
                    const isBeforeCreation = day < new Date(habitCreatedAt);
                    const isFuture = day > today;

                    return (
                      <View
                        key={dateStr}
                        style={[
                          styles.heatmapCell,
                          {
                            backgroundColor: isFuture
                              ? Colors.dark.clay.background
                              : getIntensityColor(
                                  isCompleted,
                                  isBeforeCreation
                                ),
                            opacity: isBeforeCreation || isFuture ? 0.3 : 1,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderMonthView = () => {
    const startDate = startOfMonth(today);
    const endDate = endOfMonth(today);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Group days into weeks for calendar layout
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    // Add empty cells for the first week
    const firstDayOfWeek = getDay(startDate);
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(new Date(0));
    }

    days.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // Add the last partial week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(new Date(0));
      }
      weeks.push(currentWeek);
    }

    return (
      <View style={styles.monthContainer}>
        {/* Month title */}
        <Text style={styles.monthTitle}>{format(today, "MMMM yyyy")}</Text>

        {/* Day headers */}
        <View style={styles.monthDayHeaders}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <Text key={day} style={styles.monthDayHeader}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.monthWeekRow}>
            {week.map((day, dayIndex) => {
              if (day.getTime() === 0) {
                return (
                  <View
                    key={`empty-${weekIndex}-${dayIndex}`}
                    style={styles.monthEmptyCell}
                  />
                );
              }

              const dateStr = format(day, "yyyy-MM-dd");
              const isCompleted = completedDatesMap.has(dateStr);
              const isBeforeCreation = day < new Date(habitCreatedAt);
              const isFuture = day > today;

              return (
                <View key={dateStr} style={styles.monthCellContainer}>
                  <View
                    style={[
                      styles.monthCell,
                      {
                        backgroundColor: isFuture
                          ? Colors.dark.clay.background
                          : getIntensityColor(isCompleted, isBeforeCreation),
                        opacity: isBeforeCreation || isFuture ? 0.3 : 1,
                        borderWidth: isCompleted ? 2 : 1,
                        borderColor: isCompleted
                          ? Colors.dark.success
                          : Colors.dark.clay.border,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.monthCellText,
                      {
                        color: isCompleted
                          ? Colors.dark.textPrimary
                          : Colors.dark.textSecondary,
                      },
                    ]}
                  >
                    {format(day, "d")}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* View Toggle */}
      <View style={styles.toggleContainer}>
        <Pressable
          style={[
            styles.toggleButton,
            viewMode === "year" && styles.toggleButtonActive,
          ]}
          onPress={() => setViewMode("year")}
        >
          <Text
            style={[
              styles.toggleButtonText,
              viewMode === "year" && styles.toggleButtonTextActive,
            ]}
          >
            Year
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.toggleButton,
            viewMode === "month" && styles.toggleButtonActive,
          ]}
          onPress={() => setViewMode("month")}
        >
          <Text
            style={[
              styles.toggleButtonText,
              viewMode === "month" && styles.toggleButtonTextActive,
            ]}
          >
            Month
          </Text>
        </Pressable>
      </View>

      {/* Heatmap */}
      <View style={styles.heatmapContainer}>
        {viewMode === "year" ? renderYearView() : renderMonthView()}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        <View style={styles.legendColors}>
          <View
            style={[
              styles.legendCell,
              { backgroundColor: Colors.dark.clay.background },
            ]}
          />
          <View
            style={[
              styles.legendCell,
              { backgroundColor: Colors.dark.success, opacity: 0.4 },
            ]}
          />
          <View
            style={[
              styles.legendCell,
              { backgroundColor: Colors.dark.success, opacity: 0.7 },
            ]}
          />
          <View
            style={[
              styles.legendCell,
              { backgroundColor: Colors.dark.success },
            ]}
          />
        </View>
        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: Colors.dark.clay.background,
    borderRadius: 8,
    padding: 2,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: Colors.dark.primary,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.dark.textSecondary,
  },
  toggleButtonTextActive: {
    color: Colors.dark.textPrimary,
  },
  heatmapContainer: {
    marginBottom: 16,
  },

  // Year view styles
  yearContainer: {
    minWidth: 300,
  },
  monthLabelsContainer: {
    height: 20,
    marginBottom: 8,
    position: "relative",
  },
  monthLabel: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    position: "absolute",
    top: 0,
  },
  yearContent: {
    flexDirection: "row",
  },
  dayLabelsContainer: {
    width: 20,
    marginRight: 4,
  },
  dayLabel: {
    fontSize: 9,
    color: Colors.dark.textSecondary,
    height: 12,
    textAlign: "center",
    marginBottom: 2,
    lineHeight: 10,
  },
  heatmapGrid: {
    flexDirection: "row",
  },
  weekColumn: {
    marginRight: 2,
  },
  heatmapCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginBottom: 2,
    borderWidth: 0.5,
    borderColor: Colors.dark.clay.border,
  },
  emptyCell: {
    width: 10,
    height: 10,
    marginBottom: 2,
  },

  // Month view styles
  monthContainer: {
    backgroundColor: Colors.dark.clay.background,
    borderRadius: 12,
    padding: 16,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  monthDayHeaders: {
    flexDirection: "row",
    marginBottom: 8,
  },
  monthDayHeader: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  monthWeekRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  monthCellContainer: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  monthCell: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 4,
  },
  monthEmptyCell: {
    flex: 1,
  },
  monthCellText: {
    fontSize: 10,
    fontWeight: "500",
    position: "absolute",
    top: 9,
  },

  // Legend styles
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  legendText: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
  },
  legendColors: {
    flexDirection: "row",
    gap: 3,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: Colors.dark.clay.border,
  },
});
