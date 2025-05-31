import { Colors, clayStyles } from "@/constants/Colors";
import type React from "react";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface TimePickerProps {
  visible: boolean;
  initialTime: string; // HH:MM format
  onTimeSelect: (time: string) => void;
  onClose: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const TimePicker: React.FC<TimePickerProps> = ({
  visible,
  initialTime,
  onTimeSelect,
  onClose,
}) => {
  const [hours, minutes] = initialTime.split(":").map(Number);
  const [selectedHour, setSelectedHour] = useState(hours);
  const [selectedMinute, setSelectedMinute] = useState(minutes);

  const confirmPressed = useSharedValue(false);
  const cancelPressed = useSharedValue(false);

  const confirmAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(confirmPressed.value ? 0.95 : 1) }],
  }));

  const cancelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(cancelPressed.value ? 0.95 : 1) }],
  }));

  const handleConfirm = () => {
    const formattedTime = `${selectedHour
      .toString()
      .padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}`;
    onTimeSelect(formattedTime);
    onClose();
  };

  const renderTimeColumn = (
    values: number[],
    selectedValue: number,
    onSelect: (value: number) => void,
    suffix = ""
  ) => (
    <View style={styles.timeColumn}>
      <ScrollView
        style={styles.timeScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.timeScrollContent}
      >
        {values.map((value) => (
          <Pressable
            key={value}
            style={[
              styles.timeItem,
              selectedValue === value && styles.timeItemSelected,
            ]}
            onPress={() => onSelect(value)}
          >
            <Text
              style={[
                styles.timeText,
                selectedValue === value && styles.timeTextSelected,
              ]}
            >
              {value.toString().padStart(2, "0")}
              {suffix}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Time</Text>
            <Text style={styles.subtitle}>Choose your preferred time</Text>
          </View>

          <View style={styles.timeContainer}>
            {renderTimeColumn(
              Array.from({ length: 24 }, (_, i) => i),
              selectedHour,
              setSelectedHour
            )}

            <Text style={styles.separator}>:</Text>

            {renderTimeColumn(
              Array.from({ length: 60 }, (_, i) => i),
              selectedMinute,
              setSelectedMinute
            )}
          </View>

          <View style={styles.buttonContainer}>
            <AnimatedPressable
              style={[styles.button, styles.cancelButton, cancelAnimatedStyle]}
              onPressIn={() => {
                cancelPressed.value = true;
              }}
              onPressOut={() => {
                cancelPressed.value = false;
              }}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </AnimatedPressable>

            <AnimatedPressable
              style={[
                styles.button,
                styles.confirmButton,
                confirmAnimatedStyle,
              ]}
              onPressIn={() => {
                confirmPressed.value = true;
              }}
              onPressOut={() => {
                confirmPressed.value = false;
              }}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </AnimatedPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: Colors.dark.background2,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    ...clayStyles.card,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    height: 200,
  },
  timeColumn: {
    flex: 1,
    height: "100%",
  },
  timeScroll: {
    flex: 1,
  },
  timeScrollContent: {
    paddingVertical: 80,
  },
  timeItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderRadius: 12,
    marginVertical: 2,
  },
  timeItemSelected: {
    backgroundColor: Colors.dark.primary,
  },
  timeText: {
    fontSize: 18,
    color: Colors.dark.textSecondary,
    fontWeight: "500",
  },
  timeTextSelected: {
    color: Colors.dark.textPrimary,
    fontWeight: "bold",
  },
  separator: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    marginHorizontal: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    ...clayStyles.button,
  },
  cancelButton: {
    backgroundColor: Colors.dark.clay.background,
  },
  confirmButton: {
    backgroundColor: Colors.dark.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
  },
});
