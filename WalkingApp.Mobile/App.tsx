import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '@theme/ThemeProvider';
import { useAppTheme } from '@hooks/useAppTheme';
import RootNavigator from '@navigation/RootNavigator';
import { supabase } from '@services/supabase';
import { useAuthStore } from '@store/authStore';
import { useUserStore } from '@store/userStore';
import { validateConfig } from '@config/supabase.config';
import * as SplashScreen from 'expo-splash-screen';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { navigationTheme } = useAppTheme();
  const [isReady, setIsReady] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const fetchCurrentUser = useUserStore((state) => state.fetchCurrentUser);

  useEffect(() => {
    async function prepare() {
      try {
        // Validate configuration
        if (!validateConfig()) {
          console.error('Invalid app configuration');
        }

        // Check initial session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        // Fetch user profile if authenticated
        if (session) {
          await fetchCurrentUser();
        }

        // Setup auth state listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          setSession(session);

          if (event === 'SIGNED_IN' && session) {
            await fetchCurrentUser();
          }
        });

        setIsReady(true);
        await SplashScreen.hideAsync();

        // Cleanup
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('App initialization error:', error);
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
