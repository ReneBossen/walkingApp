import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PermissionsScreen from '../PermissionsScreen';
import { usePermissions } from '../hooks/usePermissions';

// Mock dependencies
jest.mock('../hooks/usePermissions');

jest.mock('react-native-paper', () => {
  const RN = jest.requireActual('react-native');
  return {
    Text: ({ children, ...props }: any) => <RN.Text {...props}>{children}</RN.Text>,
    Button: ({ children, onPress, testID, mode }: any) => (
      <RN.TouchableOpacity onPress={onPress} testID={testID || `button-${mode}`}>
        <RN.Text>{children}</RN.Text>
      </RN.TouchableOpacity>
    ),
    useTheme: () => ({
      colors: {
        onBackground: '#000000',
        onSurfaceVariant: '#49454F',
      },
    }),
  };
});

jest.mock('react-native', () => {
  const actualRN = jest.requireActual('react-native');
  return {
    ...actualRN,
    ScrollView: ({ children, ...props }: any) => {
      const React = require('react');
      return React.createElement(actualRN.View, props, children);
    },
  };
});

jest.mock('../components/OnboardingLayout', () => {
  const RN = jest.requireActual('react-native');
  return ({ children }: any) => <RN.View testID="onboarding-layout">{children}</RN.View>;
});

jest.mock('../components/PermissionCard', () => {
  const RN = jest.requireActual('react-native');
  return ({ emoji, title, description, status, onRequestPermission }: any) => (
    <RN.View testID="permission-card">
      <RN.Text>{emoji}</RN.Text>
      <RN.Text>{title}</RN.Text>
      <RN.Text>{description}</RN.Text>
      <RN.Text>{status}</RN.Text>
      <RN.TouchableOpacity onPress={onRequestPermission} testID="request-permission-button">
        <RN.Text>Request Permission</RN.Text>
      </RN.TouchableOpacity>
    </RN.View>
  );
});

const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>;

describe('PermissionsScreen', () => {
  const mockNavigate = jest.fn();
  const mockNavigation = {
    navigate: mockNavigate,
    goBack: jest.fn(),
    setOptions: jest.fn(),
  } as any;

  const mockRoute = {} as any;

  const mockRequestNotificationPermission = jest.fn();
  const mockRequestActivityPermission = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePermissions.mockReturnValue({
      notificationPermissionStatus: 'undetermined',
      activityPermissionStatus: 'undetermined',
      requestNotificationPermission: mockRequestNotificationPermission,
      requestActivityPermission: mockRequestActivityPermission,
    });
  });

  describe('rendering', () => {
    it('PermissionsScreen_OnMount_RendersOnboardingLayout', () => {
      const { getByTestId } = render(
        <PermissionsScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByTestId('onboarding-layout')).toBeTruthy();
    });

    it('PermissionsScreen_OnMount_RendersTitle', () => {
      const { getByText } = render(
        <PermissionsScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('We Need Permissions')).toBeTruthy();
    });

    it('PermissionsScreen_OnMount_RendersSubtitle', () => {
      const { getByText } = render(
        <PermissionsScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('To provide the best experience')).toBeTruthy();
    });

    it('PermissionsScreen_OnMount_RendersPermissionCard', () => {
      const { getByTestId } = render(
        <PermissionsScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByTestId('permission-card')).toBeTruthy();
    });

    it('PermissionsScreen_OnMount_RendersContinueButton', () => {
      const { getByText } = render(
        <PermissionsScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Continue')).toBeTruthy();
    });

    it('PermissionsScreen_OnMount_RendersSkipButton', () => {
      const { getByText } = render(
        <PermissionsScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Skip for now')).toBeTruthy();
    });
  });

  describe('permission card content', () => {
    it('PermissionsScreen_Always_ShowsNotificationPermissionCard', () => {
      const { getByText } = render(
        <PermissionsScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('🔔')).toBeTruthy();
      expect(getByText('Notifications')).toBeTruthy();
      expect(getByText('Get updates on friend requests and achievements')).toBeTruthy();
    });

    it('PermissionsScreen_WithUndeterminedStatus_PassesStatusToCard', () => {
      const { getByText } = render(
        <PermissionsScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('undetermined')).toBeTruthy();
    });

    it('PermissionsScreen_WithGrantedStatus_PassesStatusToCard', () => {
      mockUsePermissions.mockReturnValue({
        notificationPermissionStatus: 'granted',
        activityPermissionStatus: 'undetermined',
        requestNotificationPermission: mockRequestNotificationPermission,
        requestActivityPermission: mockRequestActivityPermission,
      });

      const { getByText } = render(
        <PermissionsScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('granted')).toBeTruthy();
    });

    it('PermissionsScreen_WithDeniedStatus_PassesStatusToCard', () => {
      mockUsePermissions.mockReturnValue({
        notificationPermissionStatus: 'denied',
        activityPermissionStatus: 'undetermined',
        requestNotificationPermission: mockRequestNotificationPermission,
        requestActivityPermission: mockRequestActivityPermission,
      });

      const { getByText } = render(
        <PermissionsScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('denied')).toBeTruthy();
    });
  });

  describe('permission request', () => {
    it('PermissionsScreen_WhenRequestButtonPressed_CallsRequestPermission', () => {
      const { getByTestId } = render(
        <PermissionsScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('request-permission-button'));

      expect(mockRequestNotificationPermission).toHaveBeenCalledTimes(1);
    });
  });

  describe('continue button', () => {
    it('PermissionsScreen_WhenContinuePressed_NavigatesToProfileSetup', () => {
      const { getByText } = render(
        <PermissionsScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByText('Continue'));

      expect(mockNavigate).toHaveBeenCalledWith('ProfileSetup');
    });

    it('PermissionsScreen_WhenContinuePressed_CallsNavigateOnce', () => {
      const { getByText } = render(
        <PermissionsScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByText('Continue'));

      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('skip button', () => {
    it('PermissionsScreen_WhenSkipPressed_NavigatesToProfileSetup', () => {
      const { getByText } = render(
        <PermissionsScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByText('Skip for now'));

      expect(mockNavigate).toHaveBeenCalledWith('ProfileSetup');
    });

    it('PermissionsScreen_WhenSkipPressed_CallsNavigateOnce', () => {
      const { getByText } = render(
        <PermissionsScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByText('Skip for now'));

      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('hook integration', () => {
    it('PermissionsScreen_OnMount_CallsUsePermissionsHook', () => {
      render(<PermissionsScreen navigation={mockNavigation} route={mockRoute} />);

      expect(mockUsePermissions).toHaveBeenCalled();
    });

    it('PermissionsScreen_WhenPermissionStatusChanges_UpdatesDisplay', () => {
      const { getByText, rerender } = render(
        <PermissionsScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('undetermined')).toBeTruthy();

      mockUsePermissions.mockReturnValue({
        notificationPermissionStatus: 'granted',
        activityPermissionStatus: 'undetermined',
        requestNotificationPermission: mockRequestNotificationPermission,
        requestActivityPermission: mockRequestActivityPermission,
      });

      rerender(<PermissionsScreen navigation={mockNavigation} route={mockRoute} />);

      expect(getByText('granted')).toBeTruthy();
    });
  });

  describe('navigation integration', () => {
    it('PermissionsScreen_WithValidNavigation_ReceivesNavigationProp', () => {
      const { getByText } = render(
        <PermissionsScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('We Need Permissions')).toBeTruthy();
    });
  });

  describe('multiple button presses', () => {
    it('PermissionsScreen_WhenContinuePressedMultipleTimes_NavigatesMultipleTimes', () => {
      const { getByText } = render(
        <PermissionsScreen navigation={mockNavigation} route={mockRoute} />
      );

      const continueButton = getByText('Continue');
      fireEvent.press(continueButton);
      fireEvent.press(continueButton);

      expect(mockNavigate).toHaveBeenCalledTimes(2);
    });
  });
});
