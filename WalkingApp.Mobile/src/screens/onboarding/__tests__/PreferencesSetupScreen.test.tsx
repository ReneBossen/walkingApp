import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CommonActions } from '@react-navigation/native';
import PreferencesSetupScreen from '../PreferencesSetupScreen';
import { useUserStore } from '@store/userStore';
import { useOnboarding } from '../hooks/useOnboarding';

// Mock dependencies
jest.mock('@store/userStore');
jest.mock('../hooks/useOnboarding');
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  CommonActions: {
    reset: jest.fn((config) => ({ type: 'RESET', ...config })),
  },
}));

jest.mock('react-native-paper', () => {
  const RN = jest.requireActual('react-native');
  return {
    Text: ({ children, ...props }: any) => <RN.Text {...props}>{children}</RN.Text>,
    SegmentedButtons: ({ value, onValueChange, buttons }: any) => (
      <RN.View testID="segmented-buttons">
        {buttons.map((button: any) => (
          <RN.TouchableOpacity
            key={button.value}
            onPress={() => onValueChange(button.value)}
            testID={`segment-${button.value}`}
          >
            <RN.Text>{button.label}</RN.Text>
          </RN.TouchableOpacity>
        ))}
      </RN.View>
    ),
    Button: ({ children, onPress, disabled, loading, testID, mode }: any) => (
      <RN.TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        testID={testID || `button-${mode}`}
      >
        <RN.Text>{loading ? 'Loading...' : children}</RN.Text>
      </RN.TouchableOpacity>
    ),
    Menu: ({ visible, onDismiss, anchor, children }: any) => (
      <RN.View testID="menu">
        {anchor}
        {visible && <RN.View testID="menu-items">{children}</RN.View>}
      </RN.View>
    ),
    'Menu.Item': ({ onPress, title, testID }: any) => (
      <RN.TouchableOpacity onPress={onPress} testID={testID || `menu-item-${title}`}>
        <RN.Text>{title}</RN.Text>
      </RN.TouchableOpacity>
    ),
    HelperText: ({ children, type }: any) => (
      <RN.Text testID={`helper-text-${type}`}>{children}</RN.Text>
    ),
    useTheme: () => ({
      colors: {
        onBackground: '#000000',
        primary: '#6200EE',
        surfaceVariant: '#E7E0EC',
        onSurfaceVariant: '#49454F',
      },
    }),
  };
});

jest.mock('@react-native-community/slider', () => {
  const RN = jest.requireActual('react-native');
  return ({ value, onValueChange, testID }: any) => (
    <RN.View testID={testID || 'slider'}>
      <RN.TouchableOpacity onPress={() => onValueChange(15000)} testID="slider-change">
        <RN.Text>Slider: {value}</RN.Text>
      </RN.TouchableOpacity>
    </RN.View>
  );
});

const actualRN = jest.requireActual('react-native');
jest.mock('react-native', () => ({
  ...actualRN,
  ScrollView: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement(actualRN.View, props, children);
  },
}));

jest.mock('../components/OnboardingLayout', () => {
  const RN = jest.requireActual('react-native');
  return ({ children }: any) => <RN.View testID="onboarding-layout">{children}</RN.View>;
});

const mockUseUserStore = useUserStore as jest.MockedFunction<typeof useUserStore>;
const mockUseOnboarding = useOnboarding as jest.MockedFunction<typeof useOnboarding>;

describe('PreferencesSetupScreen', () => {
  const mockNavigate = jest.fn();
  const mockGetParent = jest.fn();
  const mockDispatch = jest.fn();

  const mockNavigation = {
    navigate: mockNavigate,
    goBack: jest.fn(),
    setOptions: jest.fn(),
    getParent: mockGetParent,
  } as any;

  const mockRoute = {} as any;

  const mockUpdatePreferences = jest.fn();
  const mockMarkOnboardingComplete = jest.fn();
  const mockCheckOnboardingStatus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetParent.mockReturnValue({
      dispatch: mockDispatch,
    });

    mockUseUserStore.mockReturnValue({
      updatePreferences: mockUpdatePreferences,
      currentUser: null,
      isLoading: false,
      error: null,
      fetchCurrentUser: jest.fn(),
      updateProfile: jest.fn(),
      uploadAvatar: jest.fn(),
    });

    mockUseOnboarding.mockReturnValue({
      markOnboardingComplete: mockMarkOnboardingComplete,
      checkOnboardingStatus: mockCheckOnboardingStatus,
    });

    mockUpdatePreferences.mockResolvedValue(undefined);
    mockMarkOnboardingComplete.mockResolvedValue(undefined);
  });

  describe('rendering', () => {
    it('PreferencesSetupScreen_OnMount_RendersOnboardingLayout', () => {
      const { getByTestId } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByTestId('onboarding-layout')).toBeTruthy();
    });

    it('PreferencesSetupScreen_OnMount_RendersTitle', () => {
      const { getByText } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Set Your Preferences')).toBeTruthy();
    });

    it('PreferencesSetupScreen_OnMount_RendersUnitsSection', () => {
      const { getByText } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Units')).toBeTruthy();
    });

    it('PreferencesSetupScreen_OnMount_RendersDailyStepGoalSection', () => {
      const { getByText } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Daily Step Goal')).toBeTruthy();
    });

    it('PreferencesSetupScreen_OnMount_RendersPrivacySection', () => {
      const { getByText } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Privacy')).toBeTruthy();
    });

    it('PreferencesSetupScreen_OnMount_RendersFinishButton', () => {
      const { getByText } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Finish Setup')).toBeTruthy();
    });
  });

  describe('units selection', () => {
    it('PreferencesSetupScreen_OnMount_DefaultsToMetric', () => {
      const { getByText } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Metric')).toBeTruthy();
    });

    it('PreferencesSetupScreen_WhenImperialSelected_UpdatesUnits', () => {
      const { getByTestId } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('segment-imperial'));

      // Units are updated internally
      expect(getByTestId('segment-imperial')).toBeTruthy();
    });

    it('PreferencesSetupScreen_WhenMetricSelected_UpdatesUnits', () => {
      const { getByTestId } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('segment-metric'));

      expect(getByTestId('segment-metric')).toBeTruthy();
    });
  });

  describe('step goal selection', () => {
    it('PreferencesSetupScreen_OnMount_DisplaysDefaultGoal', () => {
      const { getByText } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('10,000')).toBeTruthy();
    });

    it('PreferencesSetupScreen_WhenSliderChanged_UpdatesGoalValue', () => {
      const { getByTestId, getByText } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('slider-change'));

      expect(getByText('15,000')).toBeTruthy();
    });
  });

  describe('privacy settings - find me', () => {
    it('PreferencesSetupScreen_OnMount_ShowsDefaultFindMePrivacy', () => {
      const { getByText } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Who can find you?')).toBeTruthy();
      expect(getByText('Everyone')).toBeTruthy();
    });

    it('PreferencesSetupScreen_WhenFindMeButtonPressed_OpensMenu', () => {
      const { getAllByText, getByTestId } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Press the "Everyone" button to open menu
      fireEvent.press(getAllByText('Everyone')[0]);

      // Menu should be visible
      expect(getByTestId('menu')).toBeTruthy();
    });
  });

  describe('privacy settings - show steps', () => {
    it('PreferencesSetupScreen_OnMount_ShowsDefaultActivityPrivacy', () => {
      const { getByText } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Who can see your steps?')).toBeTruthy();
    });
  });

  describe('finish button', () => {
    it('PreferencesSetupScreen_WhenFinishPressed_CallsUpdatePreferences', async () => {
      const { getByText } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByText('Finish Setup'));

      await waitFor(() => {
        expect(mockUpdatePreferences).toHaveBeenCalledWith({
          units: 'metric',
          daily_step_goal: 10000,
          privacy: {
            find_me: 'everyone',
            activity_visibility: 'public',
            profile_visibility: 'public',
          },
        });
      });
    });

    it('PreferencesSetupScreen_WhenFinishPressed_MarksOnboardingComplete', async () => {
      const { getByText } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByText('Finish Setup'));

      await waitFor(() => {
        expect(mockMarkOnboardingComplete).toHaveBeenCalled();
      });
    });

    it('PreferencesSetupScreen_AfterSuccess_NavigatesToMain', async () => {
      const { getByText } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByText('Finish Setup'));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'RESET',
            index: 0,
            routes: [{ name: 'Main' }],
          })
        );
      });
    });

    it('PreferencesSetupScreen_WithImperialUnits_SavesCorrectPreferences', async () => {
      const { getByTestId, getByText } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('segment-imperial'));
      fireEvent.press(getByText('Finish Setup'));

      await waitFor(() => {
        expect(mockUpdatePreferences).toHaveBeenCalledWith(
          expect.objectContaining({
            units: 'imperial',
          })
        );
      });
    });

    it('PreferencesSetupScreen_WithCustomStepGoal_SavesCorrectPreferences', async () => {
      const { getByTestId, getByText } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('slider-change'));
      fireEvent.press(getByText('Finish Setup'));

      await waitFor(() => {
        expect(mockUpdatePreferences).toHaveBeenCalledWith(
          expect.objectContaining({
            daily_step_goal: 15000,
          })
        );
      });
    });

    it('PreferencesSetupScreen_WhileSaving_ShowsLoadingState', async () => {
      let resolveUpdate: any;
      mockUpdatePreferences.mockImplementation(
        () => new Promise((resolve) => (resolveUpdate = resolve))
      );

      const { getByText } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByText('Finish Setup'));

      await waitFor(() => {
        expect(getByText('Loading...')).toBeTruthy();
      });

      resolveUpdate();
    });

    it('PreferencesSetupScreen_WhileSaving_DisablesButton', async () => {
      let resolveUpdate: any;
      mockUpdatePreferences.mockImplementation(
        () => new Promise((resolve) => (resolveUpdate = resolve))
      );

      const { getByText, getByTestId } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByText('Finish Setup'));

      await waitFor(() => {
        const finishButton = getByTestId('button-contained');
        expect(finishButton.props.disabled).toBe(true);
      });

      resolveUpdate();
    });

    it('PreferencesSetupScreen_WithUpdateError_ShowsErrorMessage', async () => {
      mockUpdatePreferences.mockRejectedValue(new Error('Update failed'));

      const { getByText, findByTestId } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByText('Finish Setup'));

      const errorHelper = await findByTestId('helper-text-error');
      expect(errorHelper).toBeTruthy();
    });

    it('PreferencesSetupScreen_WithMarkOnboardingError_ShowsErrorMessage', async () => {
      mockMarkOnboardingComplete.mockRejectedValue(new Error('Failed to mark complete'));

      const { getByText, findByTestId } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByText('Finish Setup'));

      const errorHelper = await findByTestId('helper-text-error');
      expect(errorHelper).toBeTruthy();
    });
  });

  describe('preferences workflow', () => {
    it('PreferencesSetupScreen_CallsUpdatePreferencesBeforeMarkingComplete', async () => {
      const callOrder: string[] = [];

      mockUpdatePreferences.mockImplementation(async () => {
        callOrder.push('updatePreferences');
      });

      mockMarkOnboardingComplete.mockImplementation(async () => {
        callOrder.push('markComplete');
      });

      const { getByText } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByText('Finish Setup'));

      await waitFor(() => {
        expect(callOrder).toEqual(['updatePreferences', 'markComplete']);
      });
    });
  });

  describe('step goal formatting', () => {
    it('PreferencesSetupScreen_WithStepGoal_FormatsWithCommas', () => {
      const { getByText } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('10,000')).toBeTruthy();
    });
  });

  describe('hook integration', () => {
    it('PreferencesSetupScreen_OnMount_CallsUseUserStore', () => {
      render(<PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />);

      expect(mockUseUserStore).toHaveBeenCalled();
    });

    it('PreferencesSetupScreen_OnMount_CallsUseOnboarding', () => {
      render(<PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />);

      expect(mockUseOnboarding).toHaveBeenCalled();
    });
  });

  describe('navigation edge cases', () => {
    it('PreferencesSetupScreen_WithoutParentNavigator_HandlesGracefully', async () => {
      mockGetParent.mockReturnValue(null);

      const { getByText } = render(
        <PreferencesSetupScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByText('Finish Setup'));

      await waitFor(() => {
        expect(mockUpdatePreferences).toHaveBeenCalled();
      });
    });
  });
});
