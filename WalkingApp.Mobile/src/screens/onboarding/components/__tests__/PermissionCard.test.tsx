import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PermissionCard from '../PermissionCard';

// Mock react-native-paper
const actualRN = jest.requireActual('react-native');

jest.mock('react-native-paper', () => {
  const React = require('react');
  const actualRN = require('react-native');

  const CardComponent = ({ children, ...props }: any) => {
    return React.createElement(actualRN.View, props, children);
  };
  CardComponent.Content = ({ children }: any) => {
    return React.createElement(actualRN.View, {}, children);
  };

  return {
    Card: CardComponent,
    Text: ({ children, ...props }: any) => {
      return React.createElement(actualRN.Text, props, children);
    },
    Button: ({ children, onPress, disabled, testID, ...props }: any) => {
      return React.createElement(
        actualRN.TouchableOpacity,
        { onPress, disabled, testID: testID || 'button' },
        React.createElement(actualRN.Text, props, children)
      );
    },
    useTheme: () => ({
      colors: {
        primary: '#6200EE',
        onSurfaceVariant: '#49454F',
      },
    }),
  };
});

describe('PermissionCard', () => {
  const defaultProps = {
    emoji: '🔔',
    title: 'Notifications',
    description: 'Get updates on friend requests',
    status: 'undetermined' as const,
    onRequestPermission: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('PermissionCard_WithAllProps_RendersEmoji', () => {
      const { getByText } = render(<PermissionCard {...defaultProps} />);
      expect(getByText('🔔')).toBeTruthy();
    });

    it('PermissionCard_WithAllProps_RendersTitle', () => {
      const { getByText } = render(<PermissionCard {...defaultProps} />);
      expect(getByText('Notifications')).toBeTruthy();
    });

    it('PermissionCard_WithAllProps_RendersDescription', () => {
      const { getByText } = render(<PermissionCard {...defaultProps} />);
      expect(getByText('Get updates on friend requests')).toBeTruthy();
    });
  });

  describe('button behavior - undetermined status', () => {
    it('PermissionCard_WhenUndetermined_ShowsAllowButton', () => {
      const { getByText } = render(<PermissionCard {...defaultProps} status="undetermined" />);
      expect(getByText('Allow')).toBeTruthy();
    });

    it('PermissionCard_WhenUndetermined_ButtonIsEnabled', () => {
      const { getByTestId } = render(<PermissionCard {...defaultProps} status="undetermined" />);
      const button = getByTestId('button');
      expect(button.props.disabled).toBeFalsy();
    });

    it('PermissionCard_WhenUndeterminedAndPressed_CallsOnRequestPermission', () => {
      const mockRequest = jest.fn();
      const { getByText } = render(
        <PermissionCard {...defaultProps} status="undetermined" onRequestPermission={mockRequest} />
      );

      fireEvent.press(getByText('Allow'));
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('button behavior - granted status', () => {
    it('PermissionCard_WhenGranted_ShowsGrantedButton', () => {
      const { getByText } = render(<PermissionCard {...defaultProps} status="granted" />);
      expect(getByText('Granted')).toBeTruthy();
    });

    it('PermissionCard_WhenGranted_ButtonIsDisabled', () => {
      const { getByTestId } = render(<PermissionCard {...defaultProps} status="granted" />);
      const button = getByTestId('button');
      expect(button.props.disabled).toBe(true);
    });

    it('PermissionCard_WhenGrantedAndPressed_DoesNotCallCallback', () => {
      const mockRequest = jest.fn();
      const { getByText } = render(
        <PermissionCard {...defaultProps} status="granted" onRequestPermission={mockRequest} />
      );

      fireEvent.press(getByText('Granted'));
      expect(mockRequest).not.toHaveBeenCalled();
    });
  });

  describe('button behavior - denied status', () => {
    it('PermissionCard_WhenDenied_ShowsDeniedButton', () => {
      const { getByText } = render(<PermissionCard {...defaultProps} status="denied" />);
      expect(getByText('Denied')).toBeTruthy();
    });

    it('PermissionCard_WhenDenied_ButtonIsDisabled', () => {
      const { getByTestId } = render(<PermissionCard {...defaultProps} status="denied" />);
      const button = getByTestId('button');
      expect(button.props.disabled).toBe(true);
    });

    it('PermissionCard_WhenDeniedAndPressed_DoesNotCallCallback', () => {
      const mockRequest = jest.fn();
      const { getByText } = render(
        <PermissionCard {...defaultProps} status="denied" onRequestPermission={mockRequest} />
      );

      fireEvent.press(getByText('Denied'));
      expect(mockRequest).not.toHaveBeenCalled();
    });
  });

  describe('status changes', () => {
    it('PermissionCard_WhenStatusChangesFromUndeterminedToGranted_UpdatesButtonText', () => {
      const { getByText, rerender } = render(
        <PermissionCard {...defaultProps} status="undetermined" />
      );

      expect(getByText('Allow')).toBeTruthy();

      rerender(<PermissionCard {...defaultProps} status="granted" />);

      expect(getByText('Granted')).toBeTruthy();
    });

    it('PermissionCard_WhenStatusChangesFromUndeterminedToDenied_UpdatesButtonText', () => {
      const { getByText, rerender } = render(
        <PermissionCard {...defaultProps} status="undetermined" />
      );

      expect(getByText('Allow')).toBeTruthy();

      rerender(<PermissionCard {...defaultProps} status="denied" />);

      expect(getByText('Denied')).toBeTruthy();
    });

    it('PermissionCard_WhenStatusChangesToGranted_DisablesButton', () => {
      const { getByTestId, rerender } = render(
        <PermissionCard {...defaultProps} status="undetermined" />
      );

      expect(getByTestId('button').props.disabled).toBeFalsy();

      rerender(<PermissionCard {...defaultProps} status="granted" />);

      expect(getByTestId('button').props.disabled).toBe(true);
    });
  });

  describe('different permission types', () => {
    it('PermissionCard_WithLocationPermission_RendersCorrectly', () => {
      const { getByText } = render(
        <PermissionCard
          emoji="📍"
          title="Location"
          description="Access your location"
          status="undetermined"
          onRequestPermission={jest.fn()}
        />
      );

      expect(getByText('📍')).toBeTruthy();
      expect(getByText('Location')).toBeTruthy();
      expect(getByText('Access your location')).toBeTruthy();
    });

    it('PermissionCard_WithCameraPermission_RendersCorrectly', () => {
      const { getByText } = render(
        <PermissionCard
          emoji="📷"
          title="Camera"
          description="Take photos"
          status="undetermined"
          onRequestPermission={jest.fn()}
        />
      );

      expect(getByText('📷')).toBeTruthy();
      expect(getByText('Camera')).toBeTruthy();
    });
  });

  describe('multiple presses', () => {
    it('PermissionCard_WithMultiplePresses_CallsCallbackMultipleTimes', () => {
      const mockRequest = jest.fn();
      const { getByText } = render(
        <PermissionCard {...defaultProps} status="undetermined" onRequestPermission={mockRequest} />
      );

      const button = getByText('Allow');
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);

      expect(mockRequest).toHaveBeenCalledTimes(3);
    });
  });
});
