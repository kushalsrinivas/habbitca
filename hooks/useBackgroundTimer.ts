import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

const BACKGROUND_TIME_KEY = '@habbitca_background_time';

interface BackgroundTimerProps {
  isRunning: boolean;
  isPaused: boolean;
  onBackgroundTimeUpdate: (additionalTime: number) => void;
}

export const useBackgroundTimer = ({ 
  isRunning, 
  isPaused, 
  onBackgroundTimeUpdate 
}: BackgroundTimerProps) => {
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        if (isRunning && !isPaused && backgroundTime.current) {
          const timeInBackground = Date.now() - backgroundTime.current;
          const secondsInBackground = Math.floor(timeInBackground / 1000);
          
          if (secondsInBackground > 0) {
            onBackgroundTimeUpdate(secondsInBackground);
          }
          
          // Clear background time
          backgroundTime.current = null;
          await AsyncStorage.removeItem(BACKGROUND_TIME_KEY);
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App is going to the background
        if (isRunning && !isPaused) {
          backgroundTime.current = Date.now();
          await AsyncStorage.setItem(BACKGROUND_TIME_KEY, backgroundTime.current.toString());
        }
      }

      appState.current = nextAppState;
    };

    // Check if there's a saved background time on mount (app restart case)
    const checkBackgroundTime = async () => {
      try {
        const savedBackgroundTime = await AsyncStorage.getItem(BACKGROUND_TIME_KEY);
        if (savedBackgroundTime && isRunning && !isPaused) {
          const timeInBackground = Date.now() - parseInt(savedBackgroundTime);
          const secondsInBackground = Math.floor(timeInBackground / 1000);
          
          if (secondsInBackground > 0) {
            onBackgroundTimeUpdate(secondsInBackground);
          }
          
          await AsyncStorage.removeItem(BACKGROUND_TIME_KEY);
        }
      } catch (error) {
        console.error('Error checking background time:', error);
      }
    };

    checkBackgroundTime();

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [isRunning, isPaused, onBackgroundTimeUpdate]);

  // Cleanup background time when timer stops
  useEffect(() => {
    if (!isRunning) {
      const clearBackgroundTime = async () => {
        try {
          await AsyncStorage.removeItem(BACKGROUND_TIME_KEY);
          backgroundTime.current = null;
        } catch (error) {
          console.error('Error clearing background time:', error);
        }
      };
      clearBackgroundTime();
    }
  }, [isRunning]);
}; 