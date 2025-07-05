import { Colors } from "@/constants/Colors";
import type { Habit } from "@/hooks/useDatabase";
import { Ionicons } from "@expo/vector-icons";
import type React from "react";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ClayButton } from "./ClayButton";

interface Category {
  id: string;
  name: string;
  emoji: string;
}

interface HabitEditBottomSheetProps {
  visible: boolean;
  habit: Habit | null;
  onClose: () => void;
  onUpdateHabit: (habit: {
    title: string;
    description: string;
    emoji: string;
    category: string;
    time: string;
    track_time: boolean;
  }) => void;
  onDeleteHabit: (habitId: number) => void;
}

const CATEGORIES: Category[] = [
  {
    id: "health-fitness",
    name: "Health & Fitness",
    emoji: "🏋️‍♂️",
  },
  {
    id: "study-learning",
    name: "Study & Learning",
    emoji: "📚",
  },
  {
    id: "mindfulness-mental-health",
    name: "Mindfulness & Mental Health",
    emoji: "🧠",
  },
  {
    id: "nutrition-diet",
    name: "Nutrition & Diet",
    emoji: "🍽️",
  },
  {
    id: "productivity-work",
    name: "Productivity & Work",
    emoji: "💼",
  },
  {
    id: "personal-organization",
    name: "Personal Organization",
    emoji: "🧹",
  },
  {
    id: "spiritual-growth",
    name: "Spiritual & Personal Growth",
    emoji: "🛐",
  },
  {
    id: "creativity-hobbies",
    name: "Creativity & Hobbies",
    emoji: "💡",
  },
  {
    id: "relationships-social",
    name: "Relationships & Social",
    emoji: "🧑‍🤝‍🧑",
  },
  {
    id: "other-custom",
    name: "Other / Custom",
    emoji: "⭐",
  },
];

export const HabitEditBottomSheet: React.FC<HabitEditBottomSheetProps> = ({
  visible,
  habit,
  onClose,
  onUpdateHabit,
  onDeleteHabit,
}) => {
  const [habitName, setHabitName] = useState("");
  const [habitDescription, setHabitDescription] = useState("");
  const [habitEmoji, setHabitEmoji] = useState("⭐");
  const [habitTime, setHabitTime] = useState("09:00");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [trackTime, setTrackTime] = useState(false);

  // Initialize form with existing habit data
  useEffect(() => {
    console.log("HabitEditBottomSheet useEffect triggered", { visible, habit });
    if (habit) {
      console.log("Initializing edit form with habit:", habit);
      setHabitName(habit.title || "");
      setHabitDescription(habit.description || "");
      setHabitEmoji(habit.emoji || "⭐");
      setHabitTime(habit.time || "09:00");
      setTrackTime(habit.track_time ?? false);

      // Find the matching category
      const category =
        CATEGORIES.find((cat) => cat.name === habit.category) ||
        CATEGORIES[CATEGORIES.length - 1];
      console.log("Found category:", category);
      setSelectedCategory(category);
    }
  }, [habit, visible]);

  const resetForm = () => {
    setHabitName("");
    setHabitDescription("");
    setHabitEmoji("⭐");
    setHabitTime("09:00");
    setSelectedCategory(null);
    setTrackTime(false);
  };

  const handleClose = () => {
    console.log("HabitEditBottomSheet handleClose called");
    resetForm();
    onClose();
  };

  const handleUpdateHabit = () => {
    if (!habitName.trim()) {
      Alert.alert("Error", "Please enter a habit name");
      return;
    }

    console.log("Updating habit with data:", {
      title: habitName.trim(),
      description: habitDescription.trim(),
      emoji: habitEmoji,
      category: selectedCategory?.name || "Other / Custom",
      time: habitTime,
    });

    onUpdateHabit({
      title: habitName.trim(),
      description: habitDescription.trim(),
      emoji: habitEmoji,
      category: selectedCategory?.name || "Other / Custom",
      time: habitTime,
      track_time: trackTime,
    });

    handleClose();
  };

  const handleDeleteHabit = () => {
    if (!habit) return;

    Alert.alert(
      "Delete Habit",
      `Are you sure you want to delete "${habit.title}"? This will remove all your progress and cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            onDeleteHabit(habit.id);
            handleClose();
          },
        },
      ]
    );
  };

  const canUpdateHabit = () => {
    return habitName.trim().length > 0;
  };

  console.log("HabitEditBottomSheet render", { visible, habit: !!habit });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Enhanced Header with Gradient */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Ionicons
                name="close"
                size={24}
                color={Colors.dark.textPrimary}
              />
            </Pressable>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Edit Habit</Text>
              <Text style={styles.subtitle}>Customize your habit details</Text>
            </View>
            <Pressable onPress={handleDeleteHabit} style={styles.deleteButton}>
              <Ionicons name="trash" size={20} color={Colors.dark.error} />
            </Pressable>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Enhanced Form Card */}
          <View style={styles.formCard}>
            {/* Habit Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Habit Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={habitName}
                  onChangeText={setHabitName}
                  placeholder="Enter habit name"
                  placeholderTextColor={Colors.dark.textSecondary}
                  maxLength={50}
                />
              </View>
            </View>

            {/* Habit Description */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={habitDescription}
                  onChangeText={setHabitDescription}
                  placeholder="Why is this habit important to you?"
                  placeholderTextColor={Colors.dark.textSecondary}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
              </View>
            </View>

            {/* Emoji Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Choose an Emoji</Text>
              <View style={styles.emojiContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.emojiScrollContent}
                >
                  {[
                    "⭐",
                    "🎯",
                    "💪",
                    "🏃‍♂️",
                    "🧘",
                    "📖",
                    "💧",
                    "🥗",
                    "😴",
                    "🎨",
                    "🎵",
                    "💼",
                    "🧹",
                    "🙏",
                    "❤️",
                    "🔥",
                    "⚡",
                    "🌟",
                    "🎉",
                    "🏆",
                  ].map((emoji) => (
                    <Pressable
                      key={emoji}
                      style={[
                        styles.emojiButton,
                        habitEmoji === emoji && styles.emojiButtonSelected,
                      ]}
                      onPress={() => setHabitEmoji(emoji)}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Category Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryRow}>
                  {CATEGORIES.map((category) => (
                    <Pressable
                      key={category.id}
                      style={[
                        styles.categoryButton,
                        selectedCategory?.id === category.id &&
                          styles.categoryButtonSelected,
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                      <Text
                        style={[
                          styles.categoryText,
                          selectedCategory?.id === category.id &&
                            styles.categoryTextSelected,
                        ]}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Time Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Reminder Time</Text>
              <View style={styles.timeContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={Colors.dark.textSecondary}
                    style={styles.timeIcon}
                  />
                  <TextInput
                    style={styles.timeInput}
                    value={habitTime}
                    onChangeText={setHabitTime}
                    placeholder="HH:MM"
                    placeholderTextColor={Colors.dark.textSecondary}
                    maxLength={5}
                  />
                </View>
              </View>
            </View>

            {/* Time Tracking Switch */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Time Tracking</Text>
              <View style={styles.switchContainer}>
                <View style={styles.switchLabelContainer}>
                  <Text style={styles.switchLabel}>Track time spent</Text>
                  <Text style={styles.switchDescription}>
                    Use a timer to track how long you spend on this habit
                  </Text>
                </View>
                <Pressable
                  style={[
                    styles.switchButton,
                    trackTime && styles.switchButtonActive,
                  ]}
                  onPress={() => setTrackTime(!trackTime)}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      trackTime && styles.switchThumbActive,
                    ]}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Enhanced Footer */}
        <View style={styles.footer}>
          <ClayButton
            title="Save Changes"
            onPress={handleUpdateHabit}
            variant="primary"
            size="large"
            disabled={!canUpdateHabit()}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background1,
  },
  header: {
    backgroundColor: Colors.dark.background2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.clay.border,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.dark.clay.background,
    borderWidth: 1,
    borderColor: Colors.dark.clay.border,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  titleContainer: {
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formCard: {
    marginTop: 24,
    paddingBottom: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
    marginBottom: 12,
  },
  inputWrapper: {
    backgroundColor: Colors.dark.clay.background,
    borderWidth: 1,
    borderColor: Colors.dark.clay.border,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.dark.textPrimary,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  emojiContainer: {
    backgroundColor: Colors.dark.clay.background,
    borderWidth: 1,
    borderColor: Colors.dark.clay.border,
    borderRadius: 16,
    padding: 8,
  },
  emojiScrollContent: {
    paddingHorizontal: 8,
  },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.dark.background1,
    borderWidth: 1,
    borderColor: Colors.dark.clay.border,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  emojiButtonSelected: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
    transform: [{ scale: 1.1 }],
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emojiText: {
    fontSize: 24,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 12,
    paddingRight: 16,
    paddingVertical: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.dark.clay.background,
    borderWidth: 1,
    borderColor: Colors.dark.clay.border,
    alignItems: "center",
    minWidth: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryButtonSelected: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
    transform: [{ scale: 1.05 }],
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },
  categoryTextSelected: {
    color: Colors.dark.textPrimary,
    fontWeight: "600",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeIcon: {
    marginLeft: 16,
    marginRight: 8,
  },
  timeInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.dark.textPrimary,
  },
  footer: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.clay.border,
    backgroundColor: Colors.dark.background2,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.dark.clay.background,
    borderWidth: 1,
    borderColor: Colors.dark.clay.border,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  switchLabelContainer: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  switchButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.dark.clay.border,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  switchButtonActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.textPrimary,
  },
  switchThumbActive: {
    backgroundColor: Colors.dark.textPrimary,
  },
});
