import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.primary,
        tabBarInactiveTintColor: Colors.dark.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          backgroundColor: Colors.dark.background2,
          borderTopColor: Colors.dark.clay.border,
          ...Platform.select({
            ios: {
              position: "absolute",
            },
            default: {},
          }),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Habits",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="checkmark.circle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: "Achievements",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="trophy.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="chart.bar.fill" color={color} />
          ),
        }}
      />
     </Tabs>
  );
}
