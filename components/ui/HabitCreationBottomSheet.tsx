import { Colors, clayStyles } from "@/constants/Colors";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated from "react-native-reanimated";
import { TimePicker } from "./TimePicker";

interface HabitTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  defaultTime: string;
}

interface Category {
  id: string;
  name: string;
  emoji: string;
  templates: HabitTemplate[];
}

interface HabitCreationBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreateHabit: (habit: {
    title: string;
    description: string;
    emoji: string;
    category: string;
    time: string;
  }) => void;
}

const CATEGORIES: Category[] = [
  {
    id: "health-fitness",
    name: "Health & Fitness",
    emoji: "🏋️‍♂️",
    templates: [
      {
        id: "1",
        name: "Morning Workout",
        description: "Start your day with exercise",
        emoji: "🏃‍♂️",
        defaultTime: "07:00",
      },
      {
        id: "2",
        name: "Gym Session",
        description: "Strength training at the gym",
        emoji: "💪",
        defaultTime: "18:00",
      },
      {
        id: "3",
        name: "Yoga Practice",
        description: "Mindful movement and stretching",
        emoji: "🧘‍♀️",
        defaultTime: "06:30",
      },
      {
        id: "4",
        name: "Evening Walk",
        description: "Relaxing walk to unwind",
        emoji: "🚶‍♂️",
        defaultTime: "19:00",
      },
      {
        id: "5",
        name: "Drink Water",
        description: "Stay hydrated throughout the day",
        emoji: "💧",
        defaultTime: "09:00",
      },
    ],
  },
  {
    id: "study-learning",
    name: "Study & Learning",
    emoji: "📚",
    templates: [
      {
        id: "6",
        name: "Read Books",
        description: "Daily reading for knowledge",
        emoji: "📖",
        defaultTime: "20:00",
      },
      {
        id: "7",
        name: "Language Practice",
        description: "Learn a new language",
        emoji: "🗣️",
        defaultTime: "08:00",
      },
      {
        id: "8",
        name: "Online Course",
        description: "Complete course modules",
        emoji: "💻",
        defaultTime: "19:00",
      },
      {
        id: "9",
        name: "Practice Coding",
        description: "Improve programming skills",
        emoji: "👨‍💻",
        defaultTime: "21:00",
      },
      {
        id: "10",
        name: "Study Notes",
        description: "Review and organize notes",
        emoji: "📝",
        defaultTime: "17:00",
      },
    ],
  },
  {
    id: "sleep-recovery",
    name: "Sleep & Recovery",
    emoji: "😴",
    templates: [
      {
        id: "11",
        name: "Early Bedtime",
        description: "Get to bed early for better rest",
        emoji: "��️",
        defaultTime: "22:00",
      },
      {
        id: "12",
        name: "Morning Stretch",
        description: "Gentle stretching after waking",
        emoji: "🤸‍♀️",
        defaultTime: "07:30",
      },
      {
        id: "13",
        name: "No Screens Before Bed",
        description: "Digital detox before sleep",
        emoji: "📱",
        defaultTime: "21:00",
      },
      {
        id: "14",
        name: "Power Nap",
        description: "Short afternoon rest",
        emoji: "😴",
        defaultTime: "14:00",
      },
      {
        id: "15",
        name: "Sleep Routine",
        description: "Consistent bedtime routine",
        emoji: "🌙",
        defaultTime: "21:30",
      },
    ],
  },
  {
    id: "mindfulness-mental",
    name: "Mindfulness & Mental Health",
    emoji: "🧠",
    templates: [
      {
        id: "16",
        name: "Meditation",
        description: "Daily mindfulness practice",
        emoji: "🧘",
        defaultTime: "07:00",
      },
      {
        id: "17",
        name: "Gratitude Journal",
        description: "Write down things you're grateful for",
        emoji: "📔",
        defaultTime: "21:00",
      },
      {
        id: "18",
        name: "Deep Breathing",
        description: "Breathing exercises for calm",
        emoji: "🌬️",
        defaultTime: "12:00",
      },
      {
        id: "19",
        name: "Positive Affirmations",
        description: "Start day with positive thoughts",
        emoji: "💭",
        defaultTime: "06:00",
      },
      {
        id: "20",
        name: "Mindful Walking",
        description: "Walking meditation practice",
        emoji: "🚶‍♀️",
        defaultTime: "16:00",
      },
    ],
  },
  {
    id: "nutrition-diet",
    name: "Nutrition & Diet",
    emoji: "🍽️",
    templates: [
      {
        id: "21",
        name: "Healthy Breakfast",
        description: "Start day with nutritious meal",
        emoji: "🥗",
        defaultTime: "08:00",
      },
      {
        id: "22",
        name: "Meal Prep",
        description: "Prepare healthy meals in advance",
        emoji: "🥘",
        defaultTime: "18:00",
      },
      {
        id: "23",
        name: "Take Vitamins",
        description: "Daily vitamin supplements",
        emoji: "💊",
        defaultTime: "09:00",
      },
      {
        id: "24",
        name: "No Junk Food",
        description: "Avoid processed foods",
        emoji: "🚫",
        defaultTime: "12:00",
      },
      {
        id: "25",
        name: "Cook at Home",
        description: "Prepare meals instead of ordering",
        emoji: "👨‍🍳",
        defaultTime: "19:00",
      },
    ],
  },
  {
    id: "productivity-work",
    name: "Productivity & Work",
    emoji: "💼",
    templates: [
      {
        id: "26",
        name: "Plan Tomorrow",
        description: "Organize next day's tasks",
        emoji: "📅",
        defaultTime: "20:00",
      },
      {
        id: "27",
        name: "Deep Work Session",
        description: "Focused work without distractions",
        emoji: "🎯",
        defaultTime: "09:00",
      },
      {
        id: "28",
        name: "Email Inbox Zero",
        description: "Clear and organize emails",
        emoji: "📧",
        defaultTime: "17:00",
      },
      {
        id: "29",
        name: "Skill Development",
        description: "Learn new professional skills",
        emoji: "📈",
        defaultTime: "19:00",
      },
      {
        id: "30",
        name: "Network Building",
        description: "Connect with professionals",
        emoji: "🤝",
        defaultTime: "18:00",
      },
    ],
  },
  {
    id: "personal-organization",
    name: "Personal Organization",
    emoji: "🧹",
    templates: [
      {
        id: "31",
        name: "Clean Room",
        description: "Tidy up living space",
        emoji: "🧽",
        defaultTime: "10:00",
      },
      {
        id: "32",
        name: "Organize Desk",
        description: "Keep workspace clean",
        emoji: "🗂️",
        defaultTime: "17:00",
      },
      {
        id: "33",
        name: "Do Laundry",
        description: "Wash and fold clothes",
        emoji: "👕",
        defaultTime: "14:00",
      },
      {
        id: "34",
        name: "Declutter",
        description: "Remove unnecessary items",
        emoji: "📦",
        defaultTime: "15:00",
      },
      {
        id: "35",
        name: "File Documents",
        description: "Organize important papers",
        emoji: "📄",
        defaultTime: "16:00",
      },
    ],
  },
  {
    id: "spiritual-growth",
    name: "Spiritual & Personal Growth",
    emoji: "🛐",
    templates: [
      {
        id: "36",
        name: "Prayer/Worship",
        description: "Connect with your spirituality",
        emoji: "🙏",
        defaultTime: "06:00",
      },
      {
        id: "37",
        name: "Self Reflection",
        description: "Think about personal growth",
        emoji: "🪞",
        defaultTime: "21:00",
      },
      {
        id: "38",
        name: "Read Scripture",
        description: "Study religious texts",
        emoji: "📜",
        defaultTime: "07:00",
      },
      {
        id: "39",
        name: "Volunteer Work",
        description: "Help others in community",
        emoji: "❤️",
        defaultTime: "14:00",
      },
      {
        id: "40",
        name: "Practice Compassion",
        description: "Show kindness to others",
        emoji: "🤗",
        defaultTime: "12:00",
      },
    ],
  },
  {
    id: "creativity-hobbies",
    name: "Creativity & Hobbies",
    emoji: "💡",
    templates: [
      {
        id: "41",
        name: "Draw/Paint",
        description: "Express creativity through art",
        emoji: "🎨",
        defaultTime: "19:00",
      },
      {
        id: "42",
        name: "Play Music",
        description: "Practice musical instrument",
        emoji: "🎵",
        defaultTime: "20:00",
      },
      {
        id: "43",
        name: "Write Journal",
        description: "Document thoughts and experiences",
        emoji: "✍️",
        defaultTime: "21:00",
      },
      {
        id: "44",
        name: "Photography",
        description: "Capture moments and practice",
        emoji: "📸",
        defaultTime: "16:00",
      },
      {
        id: "45",
        name: "Craft Project",
        description: "Work on creative projects",
        emoji: "🧵",
        defaultTime: "18:00",
      },
    ],
  },
  {
    id: "relationships-social",
    name: "Relationships & Social",
    emoji: "🧑‍🤝‍🧑",
    templates: [
      {
        id: "46",
        name: "Call Family",
        description: "Stay connected with loved ones",
        emoji: "📞",
        defaultTime: "19:00",
      },
      {
        id: "47",
        name: "Text Friends",
        description: "Reach out to friends",
        emoji: "💬",
        defaultTime: "18:00",
      },
      {
        id: "48",
        name: "Date Night",
        description: "Quality time with partner",
        emoji: "💕",
        defaultTime: "19:30",
      },
      {
        id: "49",
        name: "Social Activity",
        description: "Engage in group activities",
        emoji: "🎉",
        defaultTime: "15:00",
      },
      {
        id: "50",
        name: "Listen Actively",
        description: "Practice being present with others",
        emoji: "👂",
        defaultTime: "12:00",
      },
    ],
  },
  {
    id: "finance-self-reliance",
    name: "Finance & Self Reliance",
    emoji: "🌱",
    templates: [
      {
        id: "51",
        name: "Track Expenses",
        description: "Monitor daily spending",
        emoji: "💰",
        defaultTime: "21:00",
      },
      {
        id: "52",
        name: "Save Money",
        description: "Put aside money for goals",
        emoji: "🏦",
        defaultTime: "20:00",
      },
      {
        id: "53",
        name: "Learn Investing",
        description: "Study financial markets",
        emoji: "📊",
        defaultTime: "19:00",
      },
      {
        id: "54",
        name: "Budget Review",
        description: "Analyze monthly budget",
        emoji: "📋",
        defaultTime: "18:00",
      },
      {
        id: "55",
        name: "Side Hustle",
        description: "Work on additional income",
        emoji: "💼",
        defaultTime: "20:00",
      },
    ],
  },
  {
    id: "other-custom",
    name: "Other / Custom",
    emoji: "🐾",
    templates: [
      {
        id: "56",
        name: "Pet Care",
        description: "Take care of your pets",
        emoji: "🐕",
        defaultTime: "08:00",
      },
      {
        id: "57",
        name: "Garden Work",
        description: "Tend to plants and garden",
        emoji: "🌿",
        defaultTime: "17:00",
      },
      {
        id: "58",
        name: "Learn New Skill",
        description: "Practice something new",
        emoji: "🎓",
        defaultTime: "19:00",
      },
      {
        id: "59",
        name: "Random Act of Kindness",
        description: "Do something nice for others",
        emoji: "🌟",
        defaultTime: "14:00",
      },
      {
        id: "60",
        name: "Personal Project",
        description: "Work on personal goals",
        emoji: "🚀",
        defaultTime: "20:00",
      },
    ],
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const HabitCreationBottomSheet: React.FC<
  HabitCreationBottomSheetProps
> = ({ visible, onClose, onCreateHabit }) => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<HabitTemplate | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Custom habit form state
  const [customHabitName, setCustomHabitName] = useState("");
  const [customHabitDescription, setCustomHabitDescription] = useState("");
  const [customHabitEmoji, setCustomHabitEmoji] = useState("⭐");
  const [customHabitTime, setCustomHabitTime] = useState("09:00");

  // Snap points for the bottom sheet
  const snapPoints = useMemo(() => {
    if (!selectedCategory) {
      return ["30%"]; // Category selection
    }
    return ["95%"]; // Template selection and form
  }, [selectedCategory]);

  // Handle sheet changes
  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        // Sheet is closed
        onClose();
        // Reset state
        setTimeout(() => {
          setSelectedCategory(null);
          setSelectedTemplate(null);
          setIsCustomMode(false);
          setCustomHabitName("");
          setCustomHabitDescription("");
          setCustomHabitEmoji("⭐");
          setCustomHabitTime("09:00");
        }, 300);
      }
    },
    [onClose]
  );

  // Control the bottom sheet based on visible prop
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setSelectedTemplate(null);
    setIsCustomMode(false);
  };

  const handleTemplateSelect = (template: HabitTemplate) => {
    setSelectedTemplate(template);
    setIsCustomMode(false);
  };

  const handleCustomHabitMode = () => {
    setIsCustomMode(true);
    setSelectedTemplate(null);
  };

  const handleCreateHabit = () => {
    if (isCustomMode) {
      if (!customHabitName.trim()) return;

      onCreateHabit({
        title: customHabitName.trim(),
        description: customHabitDescription.trim(),
        emoji: customHabitEmoji,
        category: selectedCategory?.name || "Other / Custom",
        time: customHabitTime,
      });
    } else if (selectedTemplate && selectedCategory) {
      onCreateHabit({
        title: selectedTemplate.name,
        description: selectedTemplate.description,
        emoji: selectedTemplate.emoji,
        category: selectedCategory.name,
        time: selectedTemplate.defaultTime,
      });
    }
  };

  const canCreateHabit = () => {
    if (isCustomMode) {
      return customHabitName.trim().length > 0;
    }
    return selectedTemplate !== null;
  };

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {!selectedCategory ? (
            // Step 1: Category Selection
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Choose a Category</Text>
                <Text style={styles.subtitle}>
                  Select the type of habit you want to build
                </Text>
              </View>

              <View style={styles.categoriesGrid}>
                {CATEGORIES.map((category) => (
                  <Pressable
                    key={category.id}
                    style={styles.categoryCard}
                    onPress={() => handleCategorySelect(category)}
                  >
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            // Step 2: Template Selection or Custom Creation
            <>
              <View style={styles.header}>
                <Text style={styles.title}>
                  ✨ {selectedCategory.name} selected!
                </Text>
                <Text style={styles.subtitle}>
                  Choose a habit below or create your own
                </Text>
              </View>

              <View style={styles.templatesContainer}>
                {selectedCategory.templates.map((template) => (
                  <Pressable
                    key={template.id}
                    style={[
                      styles.templateCard,
                      selectedTemplate?.id === template.id &&
                        styles.templateCardSelected,
                    ]}
                    onPress={() => handleTemplateSelect(template)}
                  >
                    <Text style={styles.templateEmoji}>{template.emoji}</Text>
                    <View style={styles.templateInfo}>
                      <Text style={styles.templateName}>{template.name}</Text>
                      <Text style={styles.templateDescription}>
                        {template.description}
                      </Text>
                      <Text style={styles.templateTime}>
                        Default time: {template.defaultTime}
                      </Text>
                    </View>
                  </Pressable>
                ))}

                {/* Custom Habit Option */}
                <Pressable
                  style={[
                    styles.templateCard,
                    styles.customTemplateCard,
                    isCustomMode && styles.templateCardSelected,
                  ]}
                  onPress={handleCustomHabitMode}
                >
                  <Text style={styles.templateEmoji}>✨</Text>
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>Create Custom Habit</Text>
                    <Text style={styles.templateDescription}>
                      Design your own unique habit
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* Custom Habit Form */}
              {isCustomMode && (
                <View style={styles.customForm}>
                  <Text style={styles.formTitle}>Custom Habit Details</Text>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Habit Name *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={customHabitName}
                      onChangeText={setCustomHabitName}
                      placeholder="Enter habit name"
                      placeholderTextColor={Colors.dark.textMuted}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>
                      Description (Optional)
                    </Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={customHabitDescription}
                      onChangeText={setCustomHabitDescription}
                      placeholder="Describe your habit"
                      placeholderTextColor={Colors.dark.textMuted}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formField, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Emoji</Text>
                      <TextInput
                        style={styles.emojiInput}
                        value={customHabitEmoji}
                        onChangeText={setCustomHabitEmoji}
                        maxLength={2}
                      />
                    </View>

                    <View style={[styles.formField, { flex: 2 }]}>
                      <Text style={styles.fieldLabel}>Time</Text>
                      <Pressable
                        style={styles.timeButton}
                        onPress={() => setShowTimePicker(true)}
                      >
                        <Text style={styles.timeButtonText}>
                          {customHabitTime}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <AnimatedPressable
                  style={[styles.actionButton, styles.backButton]}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Text style={styles.backButtonText}>← Back</Text>
                </AnimatedPressable>

                <AnimatedPressable
                  style={[
                    styles.actionButton,
                    styles.createButton,
                    !canCreateHabit() && styles.createButtonDisabled,
                  ]}
                  onPress={handleCreateHabit}
                  disabled={!canCreateHabit()}
                >
                  <Text
                    style={[
                      styles.createButtonText,
                      !canCreateHabit() && styles.createButtonTextDisabled,
                    ]}
                  >
                    Add Habit
                  </Text>
                </AnimatedPressable>
              </View>
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Time Picker Modal */}
      <TimePicker
        visible={showTimePicker}
        initialTime={customHabitTime}
        onTimeSelect={setCustomHabitTime}
        onClose={() => setShowTimePicker(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: Colors.dark.background2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: Colors.dark.textMuted,
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  categoryCard: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: Colors.dark.background3,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    ...clayStyles.button,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
    textAlign: "center",
    lineHeight: 14,
  },
  templatesContainer: {
    gap: 12,
  },
  templateCard: {
    flexDirection: "row",
    backgroundColor: Colors.dark.background3,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  templateCardSelected: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.background3,
  },
  customTemplateCard: {
    borderWidth: 2,
    borderColor: Colors.dark.textMuted,
    borderStyle: "dashed",
  },
  templateEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 4,
  },
  templateTime: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  customForm: {
    backgroundColor: Colors.dark.background3,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    marginBottom: 16,
  },
  formField: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    gap: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.dark.background2,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: Colors.dark.textPrimary,
    borderWidth: 1,
    borderColor: Colors.dark.clay.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  emojiInput: {
    backgroundColor: Colors.dark.background2,
    borderRadius: 12,
    padding: 12,
    fontSize: 20,
    color: Colors.dark.textPrimary,
    borderWidth: 1,
    borderColor: Colors.dark.clay.border,
    textAlign: "center",
  },
  timeButton: {
    backgroundColor: Colors.dark.background2,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.dark.clay.border,
    alignItems: "center",
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    paddingBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    ...clayStyles.button,
  },
  backButton: {
    backgroundColor: Colors.dark.clay.background,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
  },
  createButton: {
    backgroundColor: Colors.dark.primary,
  },
  createButtonDisabled: {
    backgroundColor: Colors.dark.clay.shadow,
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
  },
  createButtonTextDisabled: {
    color: Colors.dark.textMuted,
  },
});
