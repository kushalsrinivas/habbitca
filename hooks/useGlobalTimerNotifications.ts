import { useEffect, useState } from 'react';
import { useDatabase } from './useDatabase';
import { useTimer } from './useTimer';
import { useTimerNavigation } from './useTimerNavigation';
import { useTimerNotifications } from './useTimerNotifications';

export const useGlobalTimerNotifications = () => {
  const { timer } = useTimer();
  const { navigateToActiveSession } = useTimerNavigation();
  const db = useDatabase();

  console.log('🌍 Global timer notifications hook called with timer:', timer);

  // Get habit title for the active session
  const getHabitTitle = async (habitId: number | null): Promise<string> => {
    if (!habitId) return "Habit Timer";
    
    try {
      const habits = await db.getHabits();
      const habit = habits.find(h => h.id === habitId);
      const title = habit?.title || "Habit Timer";
      console.log('🌍 Got habit title:', title, 'for habitId:', habitId);
      return title;
    } catch (error) {
      console.error("🌍 Error getting habit title:", error);
      return "Habit Timer";
    }
  };

  const [habitTitle, setHabitTitle] = useState("Habit Timer");

  // Update habit title when timer changes
  useEffect(() => {
    if (timer.habitId) {
      console.log('🌍 Updating habit title for habitId:', timer.habitId);
      getHabitTitle(timer.habitId).then(title => {
        console.log('🌍 Setting habit title to:', title);
        setHabitTitle(title);
      });
    } else {
      console.log('🌍 No habitId, using default title');
      setHabitTitle("Habit Timer");
    }
  }, [timer.habitId]);

  // Use timer notifications
  console.log('🌍 Calling useTimerNotifications with:', {
    isRunning: timer.isRunning,
    isPaused: timer.isPaused,
    habitTitle,
    elapsedTime: timer.elapsedTime,
  });

  useTimerNotifications({
    isRunning: timer.isRunning,
    isPaused: timer.isPaused,
    habitTitle,
    elapsedTime: timer.elapsedTime,
    onNotificationTap: navigateToActiveSession,
  });

  return {
    hasActiveSession: timer.isRunning,
    activeSessionHabitId: timer.habitId,
  };
}; 