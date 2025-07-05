import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useBackgroundTimer } from './useBackgroundTimer';

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  pausedTime: number;
  elapsedTime: number;
  sessionId: number | null;
  habitId: number | null;
}

const TIMER_STORAGE_KEY = '@habbitca_timer_state';

const initialTimerState: TimerState = {
  isRunning: false,
  isPaused: false,
  startTime: null,
  pausedTime: 0,
  elapsedTime: 0,
  sessionId: null,
  habitId: null,
};

// --------------------
// Context Setup
// --------------------

type TimerContextType = {
  timer: TimerState;
  isLoaded: boolean;
  startTimer: (habitId: number, sessionId: number) => void;
  continueTimer: (
    habitId: number,
    sessionId: number,
    existingElapsedSeconds: number
  ) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => Promise<void>;
  resetTimer: () => Promise<void>;
  clearPersistedState: () => Promise<void>;
  getActiveSession: () =>
    | {
        sessionId: number;
        habitId: number;
        elapsedTime: number;
        isRunning: boolean;
        isPaused: boolean;
      }
    | null;
  formatTime: (seconds: number) => string;
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

// --------------------
// Internal Hook (previous implementation)
// --------------------

const useTimerInternal = () => {
  const [timer, setTimer] = useState<TimerState>(initialTimerState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load timer state from storage on mount
  useEffect(() => {
    const loadTimerState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState) as TimerState;
          
          // Check if the timer was running and calculate elapsed time
          if (parsedState.isRunning && parsedState.startTime) {
            const now = Date.now();
            const elapsed = Math.floor((now - parsedState.startTime + parsedState.pausedTime) / 1000);
            
            setTimer({
              ...parsedState,
              elapsedTime: elapsed,
            });
          } else {
            setTimer(parsedState);
          }
        }
      } catch (error) {
        console.error('Error loading timer state:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadTimerState();
  }, []);

  // Save timer state to storage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      const saveTimerState = async () => {
        try {
          await AsyncStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timer));
        } catch (error) {
          console.error('Error saving timer state:', error);
        }
      };

      saveTimerState();
    }
  }, [timer, isLoaded]);

  // Background timer support
  const handleBackgroundTimeUpdate = useCallback((additionalSeconds: number) => {
    setTimer((prev) => ({
      ...prev,
      elapsedTime: prev.elapsedTime + additionalSeconds,
      pausedTime: prev.pausedTime + (additionalSeconds * 1000),
    }));
  }, []);

  useBackgroundTimer({
    isRunning: timer.isRunning,
    isPaused: timer.isPaused,
    onBackgroundTimeUpdate: handleBackgroundTimeUpdate,
  });

  // Timer update effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timer.isRunning && !timer.isPaused && timer.startTime) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev.startTime) {
            const now = Date.now();
            const elapsed = Math.floor((now - prev.startTime + prev.pausedTime) / 1000);
            return { ...prev, elapsedTime: elapsed };
          }
          return prev;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timer.isRunning, timer.isPaused, timer.startTime]);

  const startTimer = useCallback((habitId: number, sessionId: number) => {
    const now = Date.now();
    setTimer({
      isRunning: true,
      isPaused: false,
      startTime: now,
      pausedTime: 0,
      elapsedTime: 0,
      sessionId,
      habitId,
    });
  }, []);

  const continueTimer = useCallback((habitId: number, sessionId: number, existingElapsedSeconds: number) => {
    const now = Date.now();
    console.log('🔄 Continuing timer with existing elapsed time:', existingElapsedSeconds);
    setTimer({
      isRunning: true,
      isPaused: false,
      startTime: now,
      pausedTime: existingElapsedSeconds * 1000, // Convert to milliseconds
      elapsedTime: existingElapsedSeconds,
      sessionId,
      habitId,
    });
  }, []);

  const pauseTimer = useCallback(() => {
    setTimer((prev) => {
      if (prev.isRunning && !prev.isPaused && prev.startTime) {
        return {
          ...prev,
          isPaused: true,
          pausedTime: prev.pausedTime + (Date.now() - prev.startTime),
        };
      }
      return prev;
    });
  }, []);

  const resumeTimer = useCallback(() => {
    setTimer((prev) => {
      if (prev.isPaused) {
        return {
          ...prev,
          isPaused: false,
          startTime: Date.now(),
        };
      }
      return prev;
    });
  }, []);

  const stopTimer = useCallback(async () => {
    // Clear persisted state from AsyncStorage
    try {
      await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing timer state:', error);
    }
    
    // Reset timer state
    setTimer(initialTimerState);
  }, []);

  const resetTimer = useCallback(async () => {
    // Clear persisted state from AsyncStorage
    try {
      await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing timer state:', error);
    }
    
    // Reset timer state
    setTimer(initialTimerState);
  }, []);

  const clearPersistedState = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
      setTimer(initialTimerState);
    } catch (error) {
      console.error('Error clearing timer state:', error);
    }
  }, []);

  const getActiveSession = useCallback(() => {
    if (timer.isRunning && timer.sessionId && timer.habitId) {
      return {
        sessionId: timer.sessionId,
        habitId: timer.habitId,
        elapsedTime: timer.elapsedTime,
        isRunning: timer.isRunning,
        isPaused: timer.isPaused,
      };
    }
    return null;
  }, [timer]);

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // Always show hours in hh:mm:ss format
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    timer,
    isLoaded,
    startTimer,
    continueTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    clearPersistedState,
    getActiveSession,
    formatTime,
  };
};

// --------------------
// Timer Provider
// --------------------

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const timerContext = useTimerInternal();

  return (
    <TimerContext.Provider value={timerContext}>
      {children}
    </TimerContext.Provider>
  );
};

// --------------------
// Custom Hook (for components)
// --------------------

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}; 