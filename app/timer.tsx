import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ClayButton } from "@/components/ui/ClayButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/Colors";
import { type Habit, useDatabase } from "@/hooks/useDatabase";
import { useTimerNotifications } from "@/hooks/useTimerNotifications";

export default function TimerScreen() {
  const params = useLocalSearchParams();
  const habitId = parseInt(params.habitId as string);
  const [habit, setHabit] = useState<Habit | null>(null);
  const [notes, setNotes] = useState("");
  const [intensity, setIntensity] = useState(3);
  const [isConfirming, setIsConfirming] = useState(false);
  const [finalDuration, setFinalDuration] = useState(0);

  const db = useDatabase();
  const {
    timer,
    isLoaded,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    formatTime,
  } = useTimer();
  const pulseScale = useSharedValue(1);

  // Timer notifications
  useTimerNotifications({
    isRunning: timer.isRunning,
    isPaused: timer.isPaused,
    habitTitle: habit?.title || "Habit Timer",
    elapsedTime: timer.elapsedTime,
  });

  // Load habit data
  useEffect(() => {
    const loadHabit = async () => {
      try {
        const habits = await db.getHabits();
        const targetHabit = habits.find((h) => h.id === habitId);
        if (targetHabit) {
          setHabit(targetHabit);
        } else {
          Alert.alert("Error", "Habit not found");
          router.back();
        }
      } catch (error) {
        console.error("Error loading habit:", error);
        Alert.alert("Error", "Failed to load habit");
        router.back();
      }
    };

    if (habitId) {
      loadHabit();
    }
  }, [habitId, db]);

  // Timer is now managed by the useTimer hook

  // Pulse animation for running timer
  useEffect(() => {
    if (timer.isRunning && !timer.isPaused) {
      pulseScale.value = withSpring(1.1, { damping: 2, stiffness: 100 });
      const interval = setInterval(() => {
        pulseScale.value = withSpring(1.1, { damping: 2, stiffness: 100 });
        setTimeout(() => {
          pulseScale.value = withSpring(1, { damping: 2, stiffness: 100 });
        }, 500);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      pulseScale.value = withSpring(1, { damping: 2, stiffness: 100 });
    }
  }, [timer.isRunning, timer.isPaused, pulseScale]);

  const handleStart = async () => {
    try {
      const sessionId = await db.startHabitSession(habitId);
      startTimer(habitId, sessionId);
    } catch (error) {
      console.error("Error starting timer:", error);
      Alert.alert("Error", "Failed to start timer");
    }
  };

  const handlePause = () => {
    if (timer.isRunning && !timer.isPaused) {
      pauseTimer();
    }
  };

  const handleResume = () => {
    if (timer.isPaused) {
      resumeTimer();
    }
  };

  const handleStop = () => {
    if (timer.isRunning) {
      setFinalDuration(timer.elapsedTime);
      setIsConfirming(true);
    }
  };

  const handleLog = async () => {
    try {
      if (timer.sessionId) {
        await db.stopHabitSession(timer.sessionId);
      }

      // Reset timer
      stopTimer();

      setIsConfirming(false);
      setNotes("");
      setIntensity(3);

      Alert.alert(
        "Session Logged! 🎉",
        `Great job! You spent ${formatTime(finalDuration)} on ${habit?.title}`,
        [
          {
            text: "Continue",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Error logging session:", error);
      Alert.alert("Error", "Failed to log session");
    }
  };

  const handleCancel = () => {
    setIsConfirming(false);
    setFinalDuration(0);
  };

  const handleEditDuration = (newDuration: string) => {
    const duration = parseInt(newDuration) || 0;
    setFinalDuration(Math.max(0, duration));
  };

  const timerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
    };
  });

  const getTimerColor = () => {
    if (!timer.isRunning) return Colors.dark.textSecondary;
    if (timer.isPaused) return Colors.dark.warning;
    return Colors.dark.success;
  };

  const getIntensityColor = (level: number) => {
    const colors = [
      Colors.dark.textMuted,
      Colors.dark.streak.low,
      Colors.dark.streak.medium,
      Colors.dark.streak.high,
      Colors.dark.streak.max,
    ];
    return colors[level - 1] || Colors.dark.textMuted;
  };

  if (!habit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={Colors.dark.textPrimary}
          />
        </Pressable>
        <Text style={styles.title}>Timer Session</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Habit Info */}
        <GlassCard style={styles.habitCard}>
          <View style={styles.habitHeader}>
            <Text style={styles.habitEmoji}>{habit.emoji}</Text>
            <View style={styles.habitInfo}>
              <Text style={styles.habitTitle}>{habit.title}</Text>
              <Text style={styles.habitDescription}>{habit.description}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Timer Display */}
        <View style={styles.timerSection}>
          <Animated.View style={[styles.timerContainer, timerAnimatedStyle]}>
            <Text style={[styles.timerText, { color: getTimerColor() }]}>
              {formatTime(timer.elapsedTime)}
            </Text>
            <Text style={styles.timerStatus}>
              {!timer.isRunning
                ? "Ready to start"
                : timer.isPaused
                ? "Paused"
                : "Running"}
            </Text>
          </Animated.View>
        </View>

        {/* Timer Controls */}
        <View style={styles.controlsSection}>
          {!timer.isRunning ? (
            <ClayButton
              title="Start Session"
              onPress={handleStart}
              variant="primary"
              size="large"
              style={styles.startButton}
            />
          ) : (
            <View style={styles.activeControls}>
              <ClayButton
                title={timer.isPaused ? "Resume" : "Pause"}
                onPress={timer.isPaused ? handleResume : handlePause}
                variant="secondary"
                size="medium"
                style={styles.controlButton}
              />
              <ClayButton
                title="Stop & Log"
                onPress={handleStop}
                variant="primary"
                size="medium"
                style={styles.controlButton}
              />
            </View>
          )}
        </View>

        {/* Notes Section */}
        <GlassCard style={styles.notesCard}>
          <Text style={styles.notesTitle}>Session Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="How did this session go? Any insights?"
            placeholderTextColor={Colors.dark.textMuted}
            multiline
            numberOfLines={3}
          />
        </GlassCard>

        {/* Intensity Selector */}
        <GlassCard style={styles.intensityCard}>
          <Text style={styles.intensityTitle}>Effort Level</Text>
          <View style={styles.intensitySelector}>
            {[1, 2, 3, 4, 5].map((level) => (
              <Pressable
                key={level}
                style={[
                  styles.intensityButton,
                  {
                    backgroundColor:
                      intensity === level
                        ? getIntensityColor(level)
                        : Colors.dark.background3,
                  },
                ]}
                onPress={() => setIntensity(level)}
              >
                <Text
                  style={[
                    styles.intensityText,
                    {
                      color:
                        intensity === level
                          ? Colors.dark.textPrimary
                          : Colors.dark.textSecondary,
                    },
                  ]}
                >
                  {level}
                </Text>
              </Pressable>
            ))}
          </View>
        </GlassCard>
      </View>

      {/* Confirmation Modal */}
      {isConfirming && (
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.confirmationModal}>
            <Text style={styles.confirmationTitle}>Log Session</Text>
            <Text style={styles.confirmationText}>
              You spent {formatTime(finalDuration)} on {habit.title}
            </Text>

            <View style={styles.durationEditor}>
              <Text style={styles.durationLabel}>
                Adjust duration (minutes):
              </Text>
              <TextInput
                style={styles.durationInput}
                value={Math.floor(finalDuration / 60).toString()}
                onChangeText={(text) =>
                  handleEditDuration((parseInt(text) || 0) * 60)
                }
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>

            <View style={styles.confirmationButtons}>
              <ClayButton
                title="Cancel"
                onPress={handleCancel}
                variant="secondary"
                size="medium"
                style={styles.confirmButton}
              />
              <ClayButton
                title="Log Session"
                onPress={handleLog}
                variant="primary"
                size="medium"
                style={styles.confirmButton}
              />
            </View>
          </GlassCard>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: Colors.dark.textPrimary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  habitCard: {
    padding: 20,
    marginBottom: 20,
  },
  habitHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  habitEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  timerSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  timerContainer: {
    alignItems: "center",
  },
  timerText: {
    fontSize: 48,
    fontWeight: "bold",
    fontFamily: "monospace",
    marginBottom: 8,
  },
  timerStatus: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  controlsSection: {
    marginBottom: 30,
  },
  startButton: {
    alignSelf: "center",
    minWidth: 200,
  },
  activeControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 16,
  },
  controlButton: {
    flex: 1,
  },
  notesCard: {
    padding: 20,
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: Colors.dark.background3,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.dark.textPrimary,
    textAlignVertical: "top",
    minHeight: 80,
  },
  intensityCard: {
    padding: 20,
  },
  intensityTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
    marginBottom: 16,
  },
  intensitySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  intensityButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.dark.clay.border,
  },
  intensityText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  confirmationModal: {
    width: "100%",
    maxWidth: 400,
    padding: 24,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    textAlign: "center",
    marginBottom: 16,
  },
  confirmationText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  durationEditor: {
    marginBottom: 24,
  },
  durationLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 8,
  },
  durationInput: {
    backgroundColor: Colors.dark.background3,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.dark.textPrimary,
    textAlign: "center",
  },
  confirmationButtons: {
    flexDirection: "row",
    gap: 12,
  },
  confirmButton: {
    flex: 1,
  },
});
