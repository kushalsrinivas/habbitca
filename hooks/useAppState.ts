import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useAppState = () => {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [isBackground, setIsBackground] = useState(false);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      setAppState(nextAppState);
      setIsBackground(nextAppState === 'background' || nextAppState === 'inactive');
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  return {
    appState,
    isBackground,
    isForeground: appState === 'active',
  };
}; 