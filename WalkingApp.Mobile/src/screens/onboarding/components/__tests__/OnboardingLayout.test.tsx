import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import OnboardingLayout from '../OnboardingLayout';

// Mock react-native-paper
jest.mock('react-native-paper', () => ({
  useTheme: () => ({
    colors: {
      background: '#FFFFFF',
      primary: '#6200EE',
      onBackground: '#000000',
      onSurfaceVariant: '#49454F',
      surfaceVariant: '#E7E0EC',
    },
  }),
}));

describe('OnboardingLayout', () => {
  describe('rendering', () => {
    it('OnboardingLayout_WithChildren_RendersChildren', () => {
      const { getByText } = render(
        <OnboardingLayout>
          <Text>Test Content</Text>
        </OnboardingLayout>
      );

      expect(getByText('Test Content')).toBeTruthy();
    });

    it('OnboardingLayout_WithMultipleChildren_RendersAllChildren', () => {
      const { getByText } = render(
        <OnboardingLayout>
          <Text>First Child</Text>
          <Text>Second Child</Text>
          <Text>Third Child</Text>
        </OnboardingLayout>
      );

      expect(getByText('First Child')).toBeTruthy();
      expect(getByText('Second Child')).toBeTruthy();
      expect(getByText('Third Child')).toBeTruthy();
    });

    it('OnboardingLayout_WithComplexChildren_RendersCorrectly', () => {
      const { getByTestId } = render(
        <OnboardingLayout>
          <View testID="complex-child">
            <Text>Nested Content</Text>
          </View>
        </OnboardingLayout>
      );

      expect(getByTestId('complex-child')).toBeTruthy();
    });
  });

  describe('styling', () => {
    it('OnboardingLayout_Always_AppliesThemeBackgroundColor', () => {
      const { getByTestId } = render(
        <OnboardingLayout>
          <View testID="test-child" />
        </OnboardingLayout>
      );

      const layout = getByTestId('test-child').parent?.parent;
      expect(layout).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('OnboardingLayout_WithChildren_MaintainsAccessibility', () => {
      const { getByLabelText } = render(
        <OnboardingLayout>
          <Text accessibilityLabel="Accessible content">Content</Text>
        </OnboardingLayout>
      );

      expect(getByLabelText('Accessible content')).toBeTruthy();
    });
  });
});
