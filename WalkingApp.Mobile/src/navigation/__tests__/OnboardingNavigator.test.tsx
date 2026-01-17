import React from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import OnboardingNavigator from '../OnboardingNavigator';

// Mock navigation components
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children, screenOptions }: any) => (
      <View testID="stack-navigator">{children}</View>
    ),
    Screen: ({ name, component: Component }: any) => {
      if (!Component) return null;
      return <Component testID={`screen-${name}`} />;
    },
  }),
}));

// Mock screens
jest.mock('@screens/onboarding/WelcomeCarousel', () => ({
  __esModule: true,
  default: () => <View testID="welcome-carousel-screen" />,
}));

jest.mock('@screens/onboarding/PermissionsScreen', () => ({
  __esModule: true,
  default: () => <View testID="permissions-screen" />,
}));

jest.mock('@screens/onboarding/ProfileSetupScreen', () => ({
  __esModule: true,
  default: () => <View testID="profile-setup-screen" />,
}));

jest.mock('@screens/onboarding/PreferencesSetupScreen', () => ({
  __esModule: true,
  default: () => <View testID="preferences-setup-screen" />,
}));

describe('OnboardingNavigator', () => {
  describe('rendering', () => {
    it('OnboardingNavigator_OnMount_RendersStackNavigator', () => {
      const { getByTestId } = render(<OnboardingNavigator />);

      expect(getByTestId('stack-navigator')).toBeTruthy();
    });

    it('OnboardingNavigator_OnMount_RendersAllScreens', () => {
      const { getByTestId } = render(<OnboardingNavigator />);

      expect(getByTestId('welcome-carousel-screen')).toBeTruthy();
      expect(getByTestId('permissions-screen')).toBeTruthy();
      expect(getByTestId('profile-setup-screen')).toBeTruthy();
      expect(getByTestId('preferences-setup-screen')).toBeTruthy();
    });

    it('OnboardingNavigator_OnMount_RendersWelcomeCarousel', () => {
      const { getByTestId } = render(<OnboardingNavigator />);

      expect(getByTestId('welcome-carousel-screen')).toBeTruthy();
    });

    it('OnboardingNavigator_OnMount_RendersPermissionsScreen', () => {
      const { getByTestId } = render(<OnboardingNavigator />);

      expect(getByTestId('permissions-screen')).toBeTruthy();
    });

    it('OnboardingNavigator_OnMount_RendersProfileSetupScreen', () => {
      const { getByTestId } = render(<OnboardingNavigator />);

      expect(getByTestId('profile-setup-screen')).toBeTruthy();
    });

    it('OnboardingNavigator_OnMount_RendersPreferencesSetupScreen', () => {
      const { getByTestId } = render(<OnboardingNavigator />);

      expect(getByTestId('preferences-setup-screen')).toBeTruthy();
    });
  });

  describe('screen count', () => {
    it('OnboardingNavigator_Always_RendersFourScreens', () => {
      const { getByTestId } = render(<OnboardingNavigator />);

      expect(getByTestId('welcome-carousel-screen')).toBeTruthy();
      expect(getByTestId('permissions-screen')).toBeTruthy();
      expect(getByTestId('profile-setup-screen')).toBeTruthy();
      expect(getByTestId('preferences-setup-screen')).toBeTruthy();
    });
  });
});
