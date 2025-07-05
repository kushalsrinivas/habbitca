import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useDatabase } from "@/hooks/useDatabase";
import { useEffect } from "react";

// Database initialization component
function DatabaseInitializer({ children }: { children: React.ReactNode }) {
  const db = useDatabase();

  useEffect(() => {
    const initializeDb = async () => {
      try {
        await db.initializeDatabase();
        console.log("Database initialized successfully");
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
    };

    initializeDb();
  }, [db]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        <LinearGradient
          colors={[
            "#0F0F0F", // Deep black
            "#1A1A2E", // Dark blue-purple
            "#16213E", // Navy blue
            "#0F3460", // Deep blue
            "#1A1A2E", // Back to dark blue-purple
            "#0F0F0F", // Deep black
          ]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <SQLiteProvider databaseName="habittracker.db">
          <DatabaseInitializer>
            <ThemeProvider value={DarkTheme}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="celebration"
                  options={{
                    headerShown: false,
                    presentation: "fullScreenModal",
                    animation: "slide_from_bottom",
                  }}
                />
                <Stack.Screen
                  name="timer"
                  options={{
                    headerShown: false,
                    presentation: "card",
                    animation: "slide_from_right",
                  }}
                />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="light" />
            </ThemeProvider>
          </DatabaseInitializer>
        </SQLiteProvider>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
