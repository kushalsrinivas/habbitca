import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useAppState = () => {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [isBackground, setIsBackground] = useState(false);

  useEffect(() => {
    console.log('📱 Initial app state:', AppState.currentState);
    
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('📱 App state changed:', { from: appState, to: nextAppState });
      
      setAppState(nextAppState);
      const newIsBackground = nextAppState === 'background' || nextAppState === 'inactive';
      setIsBackground(newIsBackground);
      
      console.log('📱 Background state:', newIsBackground);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [appState]);

  return {
    appState,
    isBackground,
    isForeground: appState === 'active',
  };
}; 