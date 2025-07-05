import { router } from 'expo-router';
import { useCallback } from 'react';
import { useTimer } from './useTimer';

export const useTimerNavigation = () => {
  const { getActiveSession } = useTimer();

  const navigateToActiveSession = useCallback(() => {
    const activeSession = getActiveSession();
    
    if (activeSession && activeSession.habitId) {
      // Navigate to the timer screen with the active habit ID
      router.push({
        pathname: '/timer',
        params: { habitId: activeSession.habitId.toString() }
      });
    } else {
      // If no active session, navigate to home
      router.push('/(tabs)');
    }
  }, [getActiveSession]);

  return {
    navigateToActiveSession,
  };
}; 