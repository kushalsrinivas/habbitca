import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useAppState } from './useAppState';

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
  onNotificationTap?: () => void;
}

export const useTimerNotifications = ({
  isRunning,
  isPaused,
  habitTitle,
  elapsedTime,
  onNotificationTap,
}: TimerNotificationProps) => {
  const notificationId = useRef<string | null>(null);
  const updateInterval = useRef<NodeJS.Timeout | null>(null);
  const { isBackground } = useAppState();
  const permissionsGranted = useRef<boolean>(false);
  const isInitialized = useRef<boolean>(false);

  // Debug logs
  useEffect(() => {
    console.log('🔔 Timer Notifications State:', {
      isRunning,
      isPaused,
      habitTitle,
      elapsedTime,
      isBackground,
      permissionsGranted: permissionsGranted.current,
      isInitialized: isInitialized.current,
    });
  }, [isRunning, isPaused, habitTitle, elapsedTime, isBackground]);

  // Request permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      if (isInitialized.current) return;
      
      try {
        console.log('🔔 Requesting notification permissions...');
        
        // First check current permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        console.log('🔔 Existing permission status:', existingStatus);
        
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          console.log('🔔 Requesting new permissions...');
          const { status } = await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: false,
              allowSound: false,
              allowDisplayInCarPlay: false,
              allowCriticalAlerts: false,
              provideAppNotificationSettings: false,
              allowProvisional: false,
              allowAnnouncements: false,
            },
            android: {
              allowAlert: true,
              allowBadge: false,
              allowSound: false,
            },
          });
          finalStatus = status;
          console.log('🔔 New permission status:', status);
        }
        
        if (finalStatus !== 'granted') {
          console.warn('🔔 Notification permissions not granted:', finalStatus);
          permissionsGranted.current = false;
          return;
        }

        permissionsGranted.current = true;
        console.log('🔔 Notification permissions granted successfully');

        // Configure notification channel for Android
        if (Platform.OS === 'android') {
          console.log('🔔 Setting up Android notification channel...');
          await Notifications.setNotificationChannelAsync('timer', {
            name: 'Timer Sessions',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            showBadge: false,
            sound: null,
          });
          console.log('🔔 Android notification channel configured');
        }
        
        isInitialized.current = true;
      } catch (error) {
        console.error('🔔 Error requesting notification permissions:', error);
        permissionsGranted.current = false;
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

  // Show persistent notification for active sessions
  const showTimerNotification = async () => {
    if (!permissionsGranted.current) {
      console.log('🔔 Skipping notification - permissions not granted');
      return;
    }

    if (!isInitialized.current) {
      console.log('🔔 Skipping notification - not initialized');
      return;
    }

    try {
      console.log('🔔 Showing timer notification...');
      
      const content = {
        title: isPaused ? `⏸️ ${habitTitle} - Paused` : `⏱️ ${habitTitle} - In Progress`,
        body: 'Tap to return to session',
        data: {
          type: 'timer',
          habitTitle,
          elapsedTime,
          isPaused,
          action: 'return_to_session',
        },
        categoryIdentifier: 'timer',
        sticky: true,
        autoDismiss: false,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      };

      console.log('🔔 Notification content:', content);

      if (notificationId.current) {
        console.log('🔔 Dismissing existing notification:', notificationId.current);
        await Notifications.dismissNotificationAsync(notificationId.current);
      }

      const notification = await Notifications.scheduleNotificationAsync({
        content,
        trigger: null, // Show immediately
      });

      notificationId.current = notification;
      console.log('🔔 Notification scheduled successfully:', notification);
    } catch (error) {
      console.error('🔔 Error showing timer notification:', error);
    }
  };

  // Clear notification
  const clearTimerNotification = async () => {
    try {
      if (notificationId.current) {
        console.log('🔔 Clearing timer notification:', notificationId.current);
        await Notifications.dismissNotificationAsync(notificationId.current);
        notificationId.current = null;
      }
    } catch (error) {
      console.error('🔔 Error clearing timer notification:', error);
    }
  };

  // Handle notification interactions
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('🔔 Notification response received:', response);
      const data = response.notification.request.content.data;
      
      if (data?.type === 'timer' && data?.action === 'return_to_session') {
        console.log('🔔 Timer notification tapped, navigating...');
        
        // Call the callback to handle navigation
        if (onNotificationTap) {
          onNotificationTap();
        }
      }
    });

    return () => subscription.remove();
  }, [onNotificationTap]);

  // Show/hide notification based on timer state
  useEffect(() => {
    console.log('🔔 Timer notification effect triggered:', {
      isRunning,
      permissionsGranted: permissionsGranted.current,
      isInitialized: isInitialized.current,
    });

    if (isRunning && permissionsGranted.current && isInitialized.current) {
      console.log('🔔 Session is running - showing notification');
      // Show notification immediately when session starts
      showTimerNotification();
      
      // No need to update notification periodically since we removed elapsed time
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
        updateInterval.current = null;
      }
    } else {
      console.log('🔔 Session not running - clearing notification');
      // Clear notification when timer stops
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
      console.log('🔔 Cleaning up timer notifications');
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