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
      Auth: 'auth',
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

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);

      // Check if user needs onboarding (check user metadata)
      if (session?.user?.user_metadata?.onboarding_completed === false) {
        setNeedsOnboarding(true);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);

      if (event === 'SIGNED_IN' && session?.user) {
        // Check onboarding status
        if (session.user.user_metadata?.onboarding_completed === false) {
          setNeedsOnboarding(true);
        }
      }

      if (event === 'SIGNED_OUT') {
        setNeedsOnboarding(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading or splash screen while checking auth
  if (isAuthenticated === null) {
    return null; // Or <SplashScreen />
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
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
