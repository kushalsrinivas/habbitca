import { Colors } from "@/constants/Colors";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
} from "react-native";
import Animated from "react-native-reanimated";

interface HabitTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  defaultTime: string;
  supportsTimeTracking: boolean;
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
    track_time: boolean;
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
        supportsTimeTracking: true,
      },
      {
        id: "2",
        name: "Gym Session",
        description: "Strength training at the gym",
        emoji: "💪",
        defaultTime: "18:00",
        supportsTimeTracking: true,
      },
      {
        id: "3",
        name: "Yoga Practice",
        description: "Mindful movement and stretching",
        emoji: "🧘‍♀️",
        defaultTime: "06:30",
        supportsTimeTracking: true,
      },
      {
        id: "4",
        name: "Evening Walk",
        description: "Relaxing walk to unwind",
        emoji: "🚶‍♂️",
        defaultTime: "19:00",
        supportsTimeTracking: true,
      },
      {
        id: "5",
        name: "Drink Water",
        description: "Stay hydrated throughout the day",
        emoji: "💧",
        defaultTime: "09:00",
        supportsTimeTracking: false,
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
        supportsTimeTracking: true,
      },
      {
        id: "7",
        name: "Language Practice",
        description: "Learn a new language",
        emoji: "🗣️",
        defaultTime: "08:00",
        supportsTimeTracking: true,
      },
      {
        id: "8",
        name: "Online Course",
        description: "Complete course modules",
        emoji: "💻",
        defaultTime: "19:00",
        supportsTimeTracking: true,
      },
      {
        id: "9",
        name: "Practice Coding",
        description: "Improve programming skills",
        emoji: "👨‍💻",
        defaultTime: "21:00",
        supportsTimeTracking: true,
      },
      {
        id: "10",
        name: "Study Notes",
        description: "Review and organize notes",
        emoji: "📝",
        defaultTime: "17:00",
        supportsTimeTracking: true,
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
        emoji: "🛌",
        defaultTime: "22:00",
        supportsTimeTracking: true,
      },
      {
        id: "12",
        name: "Morning Stretch",
        description: "Gentle stretching after waking",
        emoji: "🤸‍♀️",
        defaultTime: "07:30",
        supportsTimeTracking: true,
      },
      {
        id: "13",
        name: "No Screens Before Bed",
        description: "Digital detox before sleep",
        emoji: "📱",
        defaultTime: "21:00",
        supportsTimeTracking: true,
      },
      {
        id: "14",
        name: "Power Nap",
        description: "Short afternoon rest",
        emoji: "😴",
        defaultTime: "14:00",
        supportsTimeTracking: true,
      },
      {
        id: "15",
        name: "Sleep Routine",
        description: "Consistent bedtime routine",
        emoji: "🌙",
        defaultTime: "21:30",
        supportsTimeTracking: true,
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
        supportsTimeTracking: true,
      },
      {
        id: "17",
        name: "Gratitude Journal",
        description: "Write down things you're grateful for",
        emoji: "📔",
        defaultTime: "21:00",
        supportsTimeTracking: true,
      },
      {
        id: "18",
        name: "Deep Breathing",
        description: "Breathing exercises for calm",
        emoji: "🌬️",
        defaultTime: "12:00",
        supportsTimeTracking: true,
      },
      {
        id: "19",
        name: "Positive Affirmations",
        description: "Start day with positive thoughts",
        emoji: "💭",
        defaultTime: "06:00",
        supportsTimeTracking: true,
      },
      {
        id: "20",
        name: "Mindful Walking",
        description: "Walking meditation practice",
        emoji: "🚶‍♀️",
        defaultTime: "16:00",
        supportsTimeTracking: true,
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
        supportsTimeTracking: true,
      },
      {
        id: "22",
        name: "Meal Prep",
        description: "Prepare healthy meals in advance",
        emoji: "🥘",
        defaultTime: "18:00",
        supportsTimeTracking: true,
      },
      {
        id: "23",
        name: "Take Vitamins",
        description: "Daily vitamin supplements",
        emoji: "💊",
        defaultTime: "09:00",
        supportsTimeTracking: false,
      },
      {
        id: "24",
        name: "No Junk Food",
        description: "Avoid processed foods",
        emoji: "🚫",
        defaultTime: "12:00",
        supportsTimeTracking: false,
      },
      {
        id: "25",
        name: "Cook at Home",
        description: "Prepare meals instead of ordering",
        emoji: "👨‍🍳",
        defaultTime: "19:00",
        supportsTimeTracking: true,
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
        supportsTimeTracking: true,
      },
      {
        id: "27",
        name: "Deep Work Session",
        description: "Focused work without distractions",
        emoji: "🎯",
        defaultTime: "09:00",
        supportsTimeTracking: true,
      },
      {
        id: "28",
        name: "Email Inbox Zero",
        description: "Clear and organize emails",
        emoji: "📧",
        defaultTime: "17:00",
        supportsTimeTracking: true,
      },
      {
        id: "29",
        name: "Skill Development",
        description: "Learn new professional skills",
        emoji: "📈",
        defaultTime: "19:00",
        supportsTimeTracking: true,
      },
      {
        id: "30",
        name: "Network Building",
        description: "Connect with professionals",
        emoji: "🤝",
        defaultTime: "18:00",
        supportsTimeTracking: true,
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
        supportsTimeTracking: true,
      },
      {
        id: "32",
        name: "Organize Desk",
        description: "Keep workspace clean",
        emoji: "🗂️",
        defaultTime: "17:00",
        supportsTimeTracking: true,
      },
      {
        id: "33",
        name: "Do Laundry",
        description: "Wash and fold clothes",
        emoji: "👕",
        defaultTime: "14:00",
        supportsTimeTracking: true,
      },
      {
        id: "34",
        name: "Declutter",
        description: "Remove unnecessary items",
        emoji: "📦",
        defaultTime: "15:00",
        supportsTimeTracking: true,
      },
      {
        id: "35",
        name: "File Documents",
        description: "Organize important papers",
        emoji: "📄",
        defaultTime: "16:00",
        supportsTimeTracking: true,
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
        supportsTimeTracking: true,
      },
      {
        id: "37",
        name: "Self Reflection",
        description: "Think about personal growth",
        emoji: "🪞",
        defaultTime: "21:00",
        supportsTimeTracking: true,
      },
      {
        id: "38",
        name: "Read Scripture",
        description: "Study religious texts",
        emoji: "📜",
        defaultTime: "07:00",
        supportsTimeTracking: true,
      },
      {
        id: "39",
        name: "Volunteer Work",
        description: "Help others in community",
        emoji: "❤️",
        defaultTime: "14:00",
        supportsTimeTracking: true,
      },
      {
        id: "40",
        name: "Practice Compassion",
        description: "Show kindness to others",
        emoji: "🤗",
        defaultTime: "12:00",
        supportsTimeTracking: true,
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
        supportsTimeTracking: true,
      },
      {
        id: "42",
        name: "Play Music",
        description: "Practice musical instrument",
        emoji: "🎵",
        defaultTime: "20:00",
        supportsTimeTracking: true,
      },
      {
        id: "43",
        name: "Write Journal",
        description: "Document thoughts and experiences",
        emoji: "✍️",
        defaultTime: "21:00",
        supportsTimeTracking: true,
      },
      {
        id: "44",
        name: "Photography",
        description: "Capture moments and practice",
        emoji: "📸",
        defaultTime: "16:00",
        supportsTimeTracking: true,
      },
      {
        id: "45",
        name: "Craft Project",
        description: "Work on creative projects",
        emoji: "🧵",
        defaultTime: "18:00",
        supportsTimeTracking: true,
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
        supportsTimeTracking: true,
      },
      {
        id: "47",
        name: "Text Friends",
        description: "Reach out to friends",
        emoji: "💬",
        defaultTime: "18:00",
        supportsTimeTracking: true,
      },
      {
        id: "48",
        name: "Date Night",
        description: "Quality time with partner",
        emoji: "💕",
        defaultTime: "19:30",
        supportsTimeTracking: true,
      },
      {
        id: "49",
        name: "Social Activity",
        description: "Engage in group activities",
        emoji: "🎉",
        defaultTime: "15:00",
        supportsTimeTracking: true,
      },
      {
        id: "50",
        name: "Listen Actively",
        description: "Practice being present with others",
        emoji: "👂",
        defaultTime: "12:00",
        supportsTimeTracking: true,
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
        supportsTimeTracking: true,
      },
      {
        id: "52",
        name: "Save Money",
        description: "Put aside money for goals",
        emoji: "🏦",
        defaultTime: "20:00",
        supportsTimeTracking: true,
      },
      {
        id: "53",
        name: "Learn Investing",
        description: "Study financial markets",
        emoji: "📊",
        defaultTime: "19:00",
        supportsTimeTracking: true,
      },
      {
        id: "54",
        name: "Budget Review",
        description: "Analyze monthly budget",
        emoji: "📋",
        defaultTime: "18:00",
        supportsTimeTracking: true,
      },
      {
        id: "55",
        name: "Side Hustle",
        description: "Work on additional income",
        emoji: "💼",
        defaultTime: "20:00",
        supportsTimeTracking: true,
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
        supportsTimeTracking: true,
      },
      {
        id: "57",
        name: "Garden Work",
        description: "Tend to plants and garden",
        emoji: "🌿",
        defaultTime: "17:00",
        supportsTimeTracking: true,
      },
      {
        id: "58",
        name: "Learn New Skill",
        description: "Practice something new",
        emoji: "🎓",
        defaultTime: "19:00",
        supportsTimeTracking: true,
      },
      {
        id: "59",
        name: "Random Act of Kindness",
        description: "Do something nice for others",
        emoji: "🌟",
        defaultTime: "14:00",
        supportsTimeTracking: true,
      },
      {
        id: "60",
        name: "Personal Project",
        description: "Work on personal goals",
        emoji: "🚀",
        defaultTime: "20:00",
        supportsTimeTracking: true,
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

  // Custom habit form state
  const [customHabitName, setCustomHabitName] = useState("");
  const [customHabitDescription, setCustomHabitDescription] = useState("");
  const [customHabitEmoji, setCustomHabitEmoji] = useState("⭐");
  const [customHabitTime, setCustomHabitTime] = useState("09:00");
  const [customTrackTime, setCustomTrackTime] = useState(false);

  const scrollViewRef = useRef<any>(null);

  // Time validation and formatting
  const formatTime = (input: string): string => {
    // Remove all non-digit characters
    const digits = input.replace(/\D/g, "");

    if (digits.length === 0) return "";
    if (digits.length === 1) return digits;
    if (digits.length === 2) return digits;
    if (digits.length === 3) {
      const hours = digits.slice(0, 1);
      const minutes = digits.slice(1, 3);
      return `${hours}:${minutes}`;
    }
    if (digits.length >= 4) {
      const hours = digits.slice(0, 2);
      const minutes = digits.slice(2, 4);
      return `${hours}:${minutes}`;
    }
    return digits;
  };

  const validateAndFormatTime = (timeString: string): string => {
    // If empty, return default
    if (!timeString.trim()) return "09:00";

    // Remove spaces and convert to uppercase for AM/PM handling
    let cleaned = timeString.trim().toUpperCase();

    // Handle AM/PM format
    const hasAMPM = cleaned.includes("AM") || cleaned.includes("PM");
    const isPM = cleaned.includes("PM");
    cleaned = cleaned.replace(/[AP]M/g, "").trim();

    // Try to parse the time
    let hours: number, minutes: number;

    if (cleaned.includes(":")) {
      const parts = cleaned.split(":");
      hours = parseInt(parts[0]) || 0;
      minutes = parseInt(parts[1]) || 0;
    } else {
      // Handle formats like "930" -> "9:30" or "15" -> "15:00"
      const digits = cleaned.replace(/\D/g, "");
      if (digits.length <= 2) {
        hours = parseInt(digits) || 0;
        minutes = 0;
      } else if (digits.length === 3) {
        hours = parseInt(digits.slice(0, 1)) || 0;
        minutes = parseInt(digits.slice(1, 3)) || 0;
      } else {
        hours = parseInt(digits.slice(0, 2)) || 0;
        minutes = parseInt(digits.slice(2, 4)) || 0;
      }
    }

    // Handle AM/PM conversion
    if (hasAMPM) {
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
    }

    // Validate and clamp values
    hours = Math.max(0, Math.min(23, hours));
    minutes = Math.max(0, Math.min(59, minutes));

    // Format as HH:MM
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const handleTimeChange = (text: string) => {
    // Allow user to type freely, format on the fly for better UX
    const formatted = formatTime(text);
    setCustomHabitTime(formatted);
  };

  const handleTimeBlur = () => {
    // Validate and format when user finishes editing
    const validated = validateAndFormatTime(customHabitTime);
    setCustomHabitTime(validated);
  };

  // Snap points for the bottom sheet - dynamic based on keyboard state
  const snapPoints = useMemo(() => {
    if (!selectedCategory) {
      return ["30%"]; // Category selection
    }
    if (isCustomMode) {
      // When custom form is open, always use maximum available height
      return ["98%"];
    }
    return ["95%"]; // Template selection and form
  }, [selectedCategory, isCustomMode]);

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
          setCustomTrackTime(false);
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
        track_time: customTrackTime,
      });
    } else if (selectedTemplate && selectedCategory) {
      onCreateHabit({
        title: selectedTemplate.name,
        description: selectedTemplate.description,
        emoji: selectedTemplate.emoji,
        category: selectedCategory.name,
        time: selectedTemplate.defaultTime,
        track_time: selectedTemplate.supportsTimeTracking,
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
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetScrollView
          ref={scrollViewRef}
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: isCustomMode ? 100 : 50,
          }}
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
                <KeyboardAvoidingView
                  behavior={Platform.OS === "ios" ? "padding" : "height"}
                  keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
                >
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
                        <TextInput
                          style={styles.timeInput}
                          value={customHabitTime}
                          onChangeText={handleTimeChange}
                          onBlur={handleTimeBlur}
                          placeholder="09:00"
                          placeholderTextColor={Colors.dark.textMuted}
                          keyboardType="numeric"
                          maxLength={5}
                          autoCorrect={false}
                          autoCapitalize="none"
                        />
                        <Text style={styles.timeHint}>
                          Format: HH:MM (24h) or use AM/PM
                        </Text>
                      </View>
                    </View>

                    {/* Time Tracking Switch */}
                    <View style={styles.formField}>
                      <View style={styles.switchContainer}>
                        <View style={styles.switchLabelContainer}>
                          <Text style={styles.fieldLabel}>
                            Track time spent
                          </Text>
                          <Text style={styles.switchDescription}>
                            Use a timer to track how long you spend on this
                            habit
                          </Text>
                        </View>
                        <Pressable
                          style={[
                            styles.switchButton,
                            customTrackTime && styles.switchButtonActive,
                          ]}
                          onPress={() => setCustomTrackTime(!customTrackTime)}
                        >
                          <View
                            style={[
                              styles.switchThumb,
                              customTrackTime && styles.switchThumbActive,
                            ]}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </KeyboardAvoidingView>
              )}

              {/* Action Buttons */}
              <View
                style={[
                  styles.actionButtons,
                  {
                    marginTop: isCustomMode ? 32 : 24,
                  },
                ]}
              >
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
    shadowColor: Colors.dark.clay.shadow,
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
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
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.textPrimary,
    marginBottom: 16,
  },
  formField: {
    marginBottom: 20,
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
  timeInput: {
    backgroundColor: Colors.dark.background2,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: Colors.dark.textPrimary,
    borderWidth: 1,
    borderColor: Colors.dark.clay.border,
  } as TextStyle,
  timeHint: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    textAlign: "right",
    marginTop: 4,
  } as TextStyle,
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    paddingBottom: 40,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: Colors.dark.clay.shadow,
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
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
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.dark.background2,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.dark.clay.border,
  },
  switchLabelContainer: {
    flex: 1,
  },
  switchDescription: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 4,
  },
  switchButton: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.clay.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.clay.border,
  },
  switchButtonActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dark.textPrimary,
  },
  switchThumbActive: {
    backgroundColor: Colors.dark.textPrimary,
  },
});
