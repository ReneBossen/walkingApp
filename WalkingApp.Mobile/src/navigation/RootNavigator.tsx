import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OnboardingScreen from '@screens/onboarding/OnboardingScreen';
import { supabase } from '@services/supabase';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: ['walkingapp://', 'https://walkingapp.com'],
  config: {
    screens: {
      Auth: {
        path: '',
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
        },
      },
      Main: {
        path: 'main',
        screens: {
          Tabs: {
            screens: {
              FriendsTab: {
                screens: {
                  FriendsList: 'friends',
                  FriendDiscovery: 'friends/discover',
                  UserProfile: 'user/:userId',
                },
              },
              GroupsTab: {
                screens: {
                  GroupsList: 'groups',
                  GroupDetail: 'group/:groupId',
                  JoinGroup: 'join/:inviteCode',
                  CreateGroup: 'groups/create',
                  GroupManagement: 'group/:groupId/manage',
                },
              },
              HomeTab: {
                screens: {
                  Home: 'home',
                },
              },
              StepsTab: {
                screens: {
                  StepsHistory: 'steps',
                },
              },
              SettingsTab: {
                screens: {
                  Settings: 'settings',
                  Profile: 'settings/profile',
                  EditProfile: 'settings/profile/edit',
                },
              },
            },
          },
          Notifications: 'notifications',
        },
      },
      Onboarding: 'onboarding',
    },
  },
};

export default function RootNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);

  useEffect(() => {
    // Check initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setAuthError(error);
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(!!session);
        setAuthError(null);

        // Check if user needs onboarding (check user metadata)
        if (session?.user?.user_metadata?.onboarding_completed === false) {
          setNeedsOnboarding(true);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setAuthError(error instanceof Error ? error : new Error('Unknown auth error'));
        setIsAuthenticated(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    let subscription: { unsubscribe: () => void } | null = null;

    try {
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        try {
          setIsAuthenticated(!!session);
          setAuthError(null);

          if (event === 'SIGNED_IN' && session?.user) {
            // Check onboarding status
            if (session.user.user_metadata?.onboarding_completed === false) {
              setNeedsOnboarding(true);
            }
          }

          if (event === 'SIGNED_OUT') {
            setNeedsOnboarding(false);
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
          setAuthError(error instanceof Error ? error : new Error('Auth state change error'));
        }
      });

      subscription = authSubscription;
    } catch (error) {
      console.error('Failed to subscribe to auth changes:', error);
      setAuthError(error instanceof Error ? error : new Error('Auth subscription error'));
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Show loading or splash screen while checking auth
  if (isAuthenticated === null && !authError) {
    return null; // Or <SplashScreen />
  }

  // Show auth screen on error to allow retry
  // The auth screen can handle login/registration which will reset the error state
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated || authError ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : needsOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
