/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    
    // Habit Tracker Dark Theme
    primary: '#6366F1', // Indigo
    secondary: '#8B5CF6', // Purple
    accent: '#10B981', // Emerald
    warning: '#F59E0B', // Amber
    error: '#EF4444', // Red
    success: '#22C55E', // Green
    
    // Background layers
    background1: '#0F0F0F', // Deepest background
    background2: '#1A1A1A', // Card backgrounds
    background3: '#262626', // Elevated elements
    
    // Glass effects
    glass: {
      background: 'rgba(26, 26, 26, 0.7)',
      border: 'rgba(255, 255, 255, 0.1)',
      shadow: 'rgba(0, 0, 0, 0.3)',
    },
    
    // Clay effects
    clay: {
      background: '#2A2A2A',
      highlight: '#3A3A3A',
      shadow: '#1A1A1A',
      border: '#404040',
    },
    
    // Text colors
    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    
    // XP and Level colors
    xp: {
      background: '#1E293B',
      fill: '#3B82F6',
      text: '#60A5FA',
    },
    
    // Streak colors
    streak: {
      none: '#374151',
      low: '#059669',
      medium: '#10B981',
      high: '#34D399',
      max: '#6EE7B7',
    },
  },
};

// Glassmorphism styles
export const glassStyles = {
  container: {
    backgroundColor: Colors.dark.glass.background,
    borderWidth: 1,
    borderColor: Colors.dark.glass.border,
    backdropFilter: 'blur(10px)',
    shadowColor: Colors.dark.glass.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    backgroundColor: 'rgba(42, 42, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
};

// Claymorphism styles
export const clayStyles = {
  button: {
    backgroundColor: Colors.dark.clay.background,
    borderRadius: 20,
    shadowColor: Colors.dark.clay.shadow,
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonPressed: {
    backgroundColor: Colors.dark.clay.background,
    borderRadius: 20,
    shadowColor: Colors.dark.clay.highlight,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  card: {
    backgroundColor: Colors.dark.clay.background,
    borderRadius: 24,
    shadowColor: Colors.dark.clay.shadow,
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 12,
  },
  inset: {
    backgroundColor: Colors.dark.clay.background,
    borderRadius: 16,
    shadowColor: Colors.dark.clay.highlight,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: -6,
  },
};
