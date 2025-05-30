import { Colors } from "@/constants/Colors";
import { addDays, isSameDay, startOfWeek, subDays } from "date-fns";
import type React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

interface StreakHeatmapProps {
  habitLogs: Array<{ date: string; completed: boolean }>;
  weeks?: number;
}

export const StreakHeatmap: React.FC<StreakHeatmapProps> = ({
  habitLogs,
  weeks = 12,
}) => {
  const today = new Date();
  const startDate = subDays(today, weeks * 7);

  const getCompletionLevel = (date: Date): number => {
    const log = habitLogs.find((log) => isSameDay(new Date(log.date), date));
    return log?.completed ? 1 : 0;
  };

  const getColorForLevel = (level: number): string => {
    if (level === 0) return Colors.dark.streak.none;
    return Colors.dark.streak.high;
  };

  const generateWeeks = () => {
    const weeks = [];
    let currentDate = startOfWeek(startDate);

    for (let week = 0; week < 12; week++) {
      const days = [];
      for (let day = 0; day < 7; day++) {
        const date = addDays(currentDate, day);
        const level = getCompletionLevel(date);
        days.push({
          date,
          level,
          color: getColorForLevel(level),
        });
      }
      weeks.push(days);
      currentDate = addDays(currentDate, 7);
    }

    return weeks;
  };

  const weeks_data = generateWeeks();
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.heatmap}>
          <View style={styles.dayLabels}>
            {dayLabels.map((label, index) => (
              <Text key={`day-label-${index}-${label}`} style={styles.dayLabel}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.weeksContainer}>
            {weeks_data.map((week) => (
              <View key={`week-${week[0].date.getTime()}`} style={styles.week}>
                {week.map((day) => (
                  <View
                    key={`day-${day.date.getTime()}`}
                    style={[styles.day, { backgroundColor: day.color }]}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        <View style={styles.legendColors}>
          <View
            style={[
              styles.legendSquare,
              { backgroundColor: Colors.dark.streak.none },
            ]}
          />
          <View
            style={[
              styles.legendSquare,
              { backgroundColor: Colors.dark.streak.low },
            ]}
          />
          <View
            style={[
              styles.legendSquare,
              { backgroundColor: Colors.dark.streak.medium },
            ]}
          />
          <View
            style={[
              styles.legendSquare,
              { backgroundColor: Colors.dark.streak.high },
            ]}
          />
          <View
            style={[
              styles.legendSquare,
              { backgroundColor: Colors.dark.streak.max },
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
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    marginBottom: 12,
  },
  heatmap: {
    flexDirection: "row",
  },
  dayLabels: {
    marginRight: 8,
  },
  dayLabel: {
    fontSize: 10,
    color: Colors.dark.textMuted,
    height: 12,
    lineHeight: 12,
    marginBottom: 2,
    textAlign: "center",
  },
  weeksContainer: {
    flexDirection: "row",
  },
  week: {
    marginRight: 2,
  },
  day: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginBottom: 2,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  legendText: {
    fontSize: 10,
    color: Colors.dark.textMuted,
    marginHorizontal: 8,
  },
  legendColors: {
    flexDirection: "row",
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginHorizontal: 1,
  },
});
