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

import { ClayButton } from "@/components/ui/ClayButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/Colors";
import {
  type Habit,
  type HabitSession,
  useDatabase,
} from "@/hooks/useDatabase";
import { useTimer } from "@/hooks/useTimer";

export default function TimerScreen() {
  const params = useLocalSearchParams();
  const habitId = parseInt(params.habitId as string);
  const [habit, setHabit] = useState<Habit | null>(null);
  const [notes, setNotes] = useState("");
  const [intensity, setIntensity] = useState(3);
  const [isConfirming, setIsConfirming] = useState(false);
  const [finalDuration, setFinalDuration] = useState(0);
  const [finalSessionId, setFinalSessionId] = useState<number | null>(null);
  const [existingActiveSession, setExistingActiveSession] =
    useState<HabitSession | null>(null);
  const [allActiveSessions, setAllActiveSessions] = useState<HabitSession[]>(
    []
  );

  const db = useDatabase();
  const {
    timer,
    isLoaded,
    startTimer,
    continueTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    formatTime,
  } = useTimer();

  // Load habit data and check for existing sessions
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load habit details
        const habits = await db.getHabits();
        const targetHabit = habits.find((h) => h.id === habitId);
        if (targetHabit) {
          setHabit(targetHabit);
        } else {
          Alert.alert("Error", "Habit not found");
          router.back();
          return;
        }

        // Check for existing active session for this habit
        const activeSession = await db.getActiveSession(habitId);
        setExistingActiveSession(activeSession);

        // Check for any other active sessions
        const allActive = await db.getAllActiveSessions();
        setAllActiveSessions(allActive);

        console.log("🔍 Session check:", {
          habitId,
          activeSession,
          allActive,
          timerRunning: timer.isRunning,
          timerHabitId: timer.habitId,
        });
      } catch (error) {
        console.error("Error loading data:", error);
        Alert.alert("Error", "Failed to load data");
        router.back();
      }
    };

    if (habitId) {
      loadData();
    }
  }, [habitId, db, timer.isRunning]);

  const handleStart = async () => {
    try {
      // Check if there's already an active session for ANY habit
      const allActive = await db.getAllActiveSessions();

      if (allActive.length > 0) {
        const activeHabit = allActive[0];
        const habits = await db.getHabits();
        const habitName =
          habits.find((h) => h.id === activeHabit.habit_id)?.title ||
          "Unknown Habit";

        Alert.alert(
          "Active Session Found",
          `You already have an active session for "${habitName}". Please finish that session before starting a new one.`,
          [
            {
              text: "Go to Active Session",
              onPress: () => {
                router.push({
                  pathname: "/timer",
                  params: { habitId: activeHabit.habit_id.toString() },
                });
              },
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );
        return;
      }

      // Start new session
      const sessionId = await db.startHabitSession(habitId);
      startTimer(habitId, sessionId);

      // Refresh session data
      const activeSession = await db.getActiveSession(habitId);
      setExistingActiveSession(activeSession);
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

  const handleStop = async () => {
    if (timer.isRunning) {
      // Stop the timer immediately
      setFinalDuration(timer.elapsedTime);
      setFinalSessionId(timer.sessionId);
      await stopTimer();
      setIsConfirming(true);
    }
  };

  const handleLog = async () => {
    try {
      if (finalSessionId) {
        await db.stopHabitSession(finalSessionId, intensity, notes);
      }

      setIsConfirming(false);
      setNotes("");
      setIntensity(3);
      setFinalSessionId(null);
      setFinalDuration(0);

      // Clear existing session data
      setExistingActiveSession(null);
      setAllActiveSessions([]);

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

  const handleCancel = async () => {
    // If we have a session ID, we need to cancel the session in the database
    if (finalSessionId) {
      try {
        // Delete the incomplete session from the database
        await db.deleteHabitSession(finalSessionId);
      } catch (error) {
        console.error("Error canceling session:", error);
      }
    }

    // Reset all state
    setIsConfirming(false);
    setFinalDuration(0);
    setFinalSessionId(null);
    setNotes("");
    setIntensity(3);

    // Clear existing session data
    setExistingActiveSession(null);
    setAllActiveSessions([]);

    // Ensure timer is fully reset
    await stopTimer();
  };

  const handleEditDuration = (newDuration: string) => {
    const duration = parseInt(newDuration) || 0;
    setFinalDuration(Math.max(0, duration));
  };

  const handleContinueExistingSession = async () => {
    if (existingActiveSession) {
      try {
        // Calculate elapsed time from database session
        const startTime = new Date(existingActiveSession.start_time).getTime();
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);

        console.log("🔄 Continuing session:", {
          sessionId: existingActiveSession.id,
          startTime: existingActiveSession.start_time,
          elapsedSeconds,
        });

        // Continue timer with existing session data and correct elapsed time
        continueTimer(habitId, existingActiveSession.id, elapsedSeconds);
      } catch (error) {
        console.error("Error continuing session:", error);
        Alert.alert("Error", "Failed to continue session");
      }
    }
  };

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

  const hasActiveSession = timer.isRunning || existingActiveSession;
  const hasOtherActiveSessions =
    allActiveSessions.length > 0 &&
    !allActiveSessions.some((s) => s.habit_id === habitId);

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

        {/* Session Status Warning */}
        {hasOtherActiveSessions && (
          <GlassCard style={styles.warningCard}>
            <Text style={styles.warningTitle}>⚠️ Active Session Detected</Text>
            <Text style={styles.warningText}>
              You have an active session for another habit. Please finish that
              session before starting a new one.
            </Text>
          </GlassCard>
        )}

        {/* Existing Session Info */}
        {existingActiveSession && !timer.isRunning && (
          <GlassCard style={styles.existingSessionCard}>
            <Text style={styles.existingSessionTitle}>
              📱 Session in Progress
            </Text>
            <Text style={styles.existingSessionText}>
              You have an unfinished session for this habit. Would you like to
              continue it?
            </Text>
            <ClayButton
              title="Continue Session"
              onPress={handleContinueExistingSession}
              variant="primary"
              size="medium"
              style={styles.continueButton}
            />
          </GlassCard>
        )}

        {/* Timer Display */}
        <View style={styles.timerSection}>
          <View style={styles.timerContainer}>
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
          </View>
        </View>

        {/* Timer Controls */}
        <View style={styles.controlsSection}>
          {!hasActiveSession ? (
            <ClayButton
              title="Start Session"
              onPress={handleStart}
              variant="primary"
              size="large"
              style={styles.startButton}
              disabled={hasOtherActiveSessions}
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
                title="Finish"
                onPress={handleStop}
                variant="primary"
                size="medium"
                style={styles.controlButton}
              />
            </View>
          )}
        </View>
      </View>

      {/* Confirmation Modal */}
      {isConfirming && (
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.confirmationModal}>
            <Text style={styles.confirmationTitle}>Session Complete! 🎉</Text>
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
                  handleEditDuration(((parseInt(text) || 0) * 60).toString())
                }
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>

            {/* Intensity Selector */}
            <View style={styles.modalIntensitySection}>
              <Text style={styles.modalIntensityTitle}>
                How was your effort level?
              </Text>
              <View style={styles.modalIntensitySelector}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <Pressable
                    key={level}
                    style={[
                      styles.modalIntensityButton,
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
                        styles.modalIntensityText,
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
              <Text style={styles.intensityHint}>
                1 = Light effort • 5 = Maximum effort
              </Text>
            </View>

            {/* Notes Section */}
            <View style={styles.modalNotesSection}>
              <Text style={styles.modalNotesTitle}>
                Session Notes (Optional)
              </Text>
              <TextInput
                style={styles.modalNotesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="How did this session go? Any insights?"
                placeholderTextColor={Colors.dark.textMuted}
                multiline
                numberOfLines={3}
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

    paddingBottom: 20,
    padding: 20,
    paddingTop: 20,
    marginTop: 30,
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
  warningCard: {
    padding: 20,
    marginBottom: 20,
    backgroundColor: Colors.dark.background2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.warning,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.warning,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  existingSessionCard: {
    padding: 20,
    marginBottom: 20,
    backgroundColor: Colors.dark.background2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.info,
  },
  existingSessionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.info,
    marginBottom: 8,
  },
  existingSessionText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 16,
  },
  continueButton: {
    alignSelf: "center",
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
  modalIntensitySection: {
    marginBottom: 20,
  },
  modalIntensityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  modalIntensitySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalIntensityButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.dark.clay.border,
  },
  modalIntensityText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  intensityHint: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    textAlign: "center",
    fontStyle: "italic",
  },
  modalNotesSection: {
    marginBottom: 20,
  },
  modalNotesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
    marginBottom: 12,
  },
  modalNotesInput: {
    backgroundColor: Colors.dark.background3,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.dark.textPrimary,
    textAlignVertical: "top",
    minHeight: 70,
    borderWidth: 1,
    borderColor: Colors.dark.clay.border,
  },
});
