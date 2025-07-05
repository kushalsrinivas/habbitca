import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

interface TimerNotificationProps {
  isRunning: boolean;
  isPaused: boolean;
  habitTitle: string;
  elapsedTime: number;
  onNotificationAction?: (action: 'pause' | 'stop') => void;
}

export const useTimerNotifications = ({
  isRunning,
  isPaused,
  habitTitle,
  elapsedTime,
  onNotificationAction,
}: TimerNotificationProps) => {
  const notificationId = useRef<string | null>(null);
  const updateInterval = useRef<NodeJS.Timeout | null>(null);

  // Request permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.warn('Notification permissions not granted');
          return;
        }

        // Configure notification channel for Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('timer', {
            name: 'Timer Sessions',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            showBadge: false,
          });
        }
      } catch (error) {
        console.error('Error requesting notification permissions:', error);
      }
    };

    requestPermissions();
  }, []);

  // Format time for notification
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  // Show/update persistent notification
  const showTimerNotification = async () => {
    try {
      const content = {
        title: isPaused ? '⏸️ Timer Paused' : '⏱️ Timer Running',
        body: `${habitTitle} - ${formatTime(elapsedTime)}`,
        data: {
          type: 'timer',
          habitTitle,
          elapsedTime,
          isPaused,
        },
        categoryIdentifier: 'timer',
        sticky: true,
        autoDismiss: false,
      };

      if (notificationId.current) {
        // Update existing notification
        await Notifications.dismissNotificationAsync(notificationId.current);
      }

      const notification = await Notifications.scheduleNotificationAsync({
        content,
        trigger: null, // Show immediately
      });

      notificationId.current = notification;
    } catch (error) {
      console.error('Error showing timer notification:', error);
    }
  };

  // Clear notification
  const clearTimerNotification = async () => {
    try {
      if (notificationId.current) {
        await Notifications.dismissNotificationAsync(notificationId.current);
        notificationId.current = null;
      }
    } catch (error) {
      console.error('Error clearing timer notification:', error);
    }
  };

  // Handle notification interactions
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      if (data?.type === 'timer' && onNotificationAction) {
        // Handle notification actions if implemented
        console.log('Timer notification tapped');
      }
    });

    return () => subscription.remove();
  }, [onNotificationAction]);

  // Show/hide notification based on timer state
  useEffect(() => {
    if (isRunning) {
      showTimerNotification();
      
      // Update notification every 30 seconds while running
      if (!isPaused) {
        updateInterval.current = setInterval(() => {
          showTimerNotification();
        }, 30000);
      } else if (updateInterval.current) {
        clearInterval(updateInterval.current);
        updateInterval.current = null;
      }
    } else {
      clearTimerNotification();
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
        updateInterval.current = null;
      }
    }

    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
        updateInterval.current = null;
      }
    };
  }, [isRunning, isPaused, habitTitle, elapsedTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimerNotification();
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, []);

  return {
    showTimerNotification,
    clearTimerNotification,
  };
}; 