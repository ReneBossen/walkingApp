import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ProfilePhotoUploader from '../ProfilePhotoUploader';
import * as ImagePicker from 'expo-image-picker';

// Mock expo-image-picker
jest.mock('expo-image-picker');

// Mock react-native-paper
jest.mock('react-native-paper', () => {
  const RN = jest.requireActual('react-native');
  return {
    Avatar: {
      Image: ({ source, testID }: any) => (
        <RN.View testID={testID || 'avatar-image'}>
          <RN.Text>{source.uri}</RN.Text>
        </RN.View>
      ),
      Icon: ({ icon, testID }: any) => (
        <RN.View testID={testID || 'avatar-icon'}>
          <RN.Text>{icon}</RN.Text>
        </RN.View>
      ),
    },
    IconButton: ({ onPress, disabled, testID, icon }: any) => (
      <RN.TouchableOpacity onPress={onPress} disabled={disabled} testID={testID || 'icon-button'}>
        <RN.Text>{icon}</RN.Text>
      </RN.TouchableOpacity>
    ),
    ActivityIndicator: ({ testID }: any) => <RN.View testID={testID || 'activity-indicator'} />,
    useTheme: () => ({
      colors: {
        primary: '#6200EE',
      },
    }),
  };
});

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockImagePicker = ImagePicker as jest.Mocked<typeof ImagePicker>;

describe('ProfilePhotoUploader', () => {
  const defaultProps = {
    onImageSelected: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Alert.alert as jest.Mock).mockClear();
  });

  describe('rendering without avatar', () => {
    it('ProfilePhotoUploader_WithoutAvatarUrl_ShowsIconAvatar', () => {
      const { getByTestId, getByText } = render(<ProfilePhotoUploader {...defaultProps} />);

      expect(getByTestId('avatar-icon')).toBeTruthy();
      expect(getByText('account')).toBeTruthy();
    });

    it('ProfilePhotoUploader_WithoutAvatarUrl_ShowsCameraButton', () => {
      const { getByText } = render(<ProfilePhotoUploader {...defaultProps} />);

      expect(getByText('camera')).toBeTruthy();
    });

    it('ProfilePhotoUploader_WithNullAvatarUrl_ShowsIconAvatar', () => {
      const { getByTestId } = render(<ProfilePhotoUploader {...defaultProps} avatarUrl={null} />);

      expect(getByTestId('avatar-icon')).toBeTruthy();
    });
  });

  describe('rendering with avatar', () => {
    it('ProfilePhotoUploader_WithAvatarUrl_ShowsImageAvatar', () => {
      const avatarUrl = 'https://example.com/avatar.jpg';
      const { getByTestId, getByText } = render(
        <ProfilePhotoUploader {...defaultProps} avatarUrl={avatarUrl} />
      );

      expect(getByTestId('avatar-image')).toBeTruthy();
      expect(getByText(avatarUrl)).toBeTruthy();
    });

    it('ProfilePhotoUploader_WithLocalAvatarUri_ShowsImageAvatar', () => {
      const avatarUri = 'file:///local/path/avatar.jpg';
      const { getByTestId, getByText } = render(
        <ProfilePhotoUploader {...defaultProps} avatarUrl={avatarUri} />
      );

      expect(getByTestId('avatar-image')).toBeTruthy();
      expect(getByText(avatarUri)).toBeTruthy();
    });
  });

  describe('uploading state', () => {
    it('ProfilePhotoUploader_WhenUploading_ShowsLoadingIndicator', () => {
      const { getByTestId } = render(<ProfilePhotoUploader {...defaultProps} isUploading={true} />);

      expect(getByTestId('activity-indicator')).toBeTruthy();
    });

    it('ProfilePhotoUploader_WhenUploading_DisablesButtons', () => {
      const { getByTestId } = render(<ProfilePhotoUploader {...defaultProps} isUploading={true} />);

      const iconButton = getByTestId('icon-button');
      expect(iconButton.props.disabled).toBe(true);
    });

    it('ProfilePhotoUploader_WhenNotUploading_EnablesButtons', () => {
      const { getByTestId } = render(
        <ProfilePhotoUploader {...defaultProps} isUploading={false} />
      );

      const iconButton = getByTestId('icon-button');
      expect(iconButton.props.disabled).toBe(false);
    });

    it('ProfilePhotoUploader_WhenNotUploading_HidesLoadingIndicator', () => {
      const { queryByTestId } = render(
        <ProfilePhotoUploader {...defaultProps} isUploading={false} />
      );

      expect(queryByTestId('activity-indicator')).toBeNull();
    });
  });

  describe('showing image options', () => {
    it('ProfilePhotoUploader_WhenCameraButtonPressed_ShowsAlert', () => {
      const { getByTestId } = render(<ProfilePhotoUploader {...defaultProps} />);

      fireEvent.press(getByTestId('icon-button'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Profile Photo',
        'Choose an option',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Take Photo' }),
          expect.objectContaining({ text: 'Choose from Library' }),
          expect.objectContaining({ text: 'Cancel' }),
        ]),
        { cancelable: true }
      );
    });

    it('ProfilePhotoUploader_WhenAvatarPressed_ShowsAlert', () => {
      const { getByTestId } = render(<ProfilePhotoUploader {...defaultProps} />);

      fireEvent.press(getByTestId('avatar-icon'));

      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  describe('picking from library', () => {
    it('ProfilePhotoUploader_WhenLibraryPermissionGranted_LaunchesImagePicker', async () => {
      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        granted: true,
        canAskAgain: true,
        expires: 'never',
      });
      mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///selected/image.jpg' }],
      } as any);

      const { getByTestId } = render(<ProfilePhotoUploader {...defaultProps} />);

      fireEvent.press(getByTestId('icon-button'));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const chooseFromLibraryOption = alertCall[2].find(
        (option: any) => option.text === 'Choose from Library'
      );

      await chooseFromLibraryOption.onPress();

      await waitFor(() => {
        expect(mockImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      });
    });

    it('ProfilePhotoUploader_WhenImageSelected_CallsOnImageSelected', async () => {
      const mockOnImageSelected = jest.fn();
      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        granted: true,
        canAskAgain: true,
        expires: 'never',
      });
      mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///selected/image.jpg' }],
      } as any);

      const { getByTestId } = render(
        <ProfilePhotoUploader {...defaultProps} onImageSelected={mockOnImageSelected} />
      );

      fireEvent.press(getByTestId('icon-button'));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const chooseFromLibraryOption = alertCall[2].find(
        (option: any) => option.text === 'Choose from Library'
      );

      await chooseFromLibraryOption.onPress();

      await waitFor(() => {
        expect(mockOnImageSelected).toHaveBeenCalledWith('file:///selected/image.jpg');
      });
    });

    it('ProfilePhotoUploader_WhenLibraryPermissionDenied_ShowsAlert', async () => {
      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
        status: 'denied' as any,
        granted: false,
        canAskAgain: false,
        expires: 'never',
      });

      const { getByTestId } = render(<ProfilePhotoUploader {...defaultProps} />);

      fireEvent.press(getByTestId('icon-button'));

      const firstAlertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const chooseFromLibraryOption = firstAlertCall[2].find(
        (option: any) => option.text === 'Choose from Library'
      );

      await chooseFromLibraryOption.onPress();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Permission Required',
          'We need permission to access your photos.'
        );
      });
    });

    it('ProfilePhotoUploader_WhenImageSelectionCanceled_DoesNotCallCallback', async () => {
      const mockOnImageSelected = jest.fn();
      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        granted: true,
        canAskAgain: true,
        expires: 'never',
      });
      mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: true,
        assets: [],
      } as any);

      const { getByTestId } = render(
        <ProfilePhotoUploader {...defaultProps} onImageSelected={mockOnImageSelected} />
      );

      fireEvent.press(getByTestId('icon-button'));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const chooseFromLibraryOption = alertCall[2].find(
        (option: any) => option.text === 'Choose from Library'
      );

      await chooseFromLibraryOption.onPress();

      await waitFor(() => {
        expect(mockOnImageSelected).not.toHaveBeenCalled();
      });
    });
  });

  describe('taking photo', () => {
    it('ProfilePhotoUploader_WhenCameraPermissionGranted_LaunchesCamera', async () => {
      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        granted: true,
        canAskAgain: true,
        expires: 'never',
      });
      mockImagePicker.launchCameraAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///photo.jpg' }],
      } as any);

      const { getByTestId } = render(<ProfilePhotoUploader {...defaultProps} />);

      fireEvent.press(getByTestId('icon-button'));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const takePhotoOption = alertCall[2].find((option: any) => option.text === 'Take Photo');

      await takePhotoOption.onPress();

      await waitFor(() => {
        expect(mockImagePicker.launchCameraAsync).toHaveBeenCalledWith({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      });
    });

    it('ProfilePhotoUploader_WhenPhotoTaken_CallsOnImageSelected', async () => {
      const mockOnImageSelected = jest.fn();
      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        granted: true,
        canAskAgain: true,
        expires: 'never',
      });
      mockImagePicker.launchCameraAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///photo.jpg' }],
      } as any);

      const { getByTestId } = render(
        <ProfilePhotoUploader {...defaultProps} onImageSelected={mockOnImageSelected} />
      );

      fireEvent.press(getByTestId('icon-button'));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const takePhotoOption = alertCall[2].find((option: any) => option.text === 'Take Photo');

      await takePhotoOption.onPress();

      await waitFor(() => {
        expect(mockOnImageSelected).toHaveBeenCalledWith('file:///photo.jpg');
      });
    });

    it('ProfilePhotoUploader_WhenCameraPermissionDenied_ShowsAlert', async () => {
      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
        status: 'denied' as any,
        granted: false,
        canAskAgain: false,
        expires: 'never',
      });

      const { getByTestId } = render(<ProfilePhotoUploader {...defaultProps} />);

      fireEvent.press(getByTestId('icon-button'));

      const firstAlertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const takePhotoOption = firstAlertCall[2].find(
        (option: any) => option.text === 'Take Photo'
      );

      await takePhotoOption.onPress();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Permission Required',
          'We need permission to access your camera.'
        );
      });
    });

    it('ProfilePhotoUploader_WhenCameraCanceled_DoesNotCallCallback', async () => {
      const mockOnImageSelected = jest.fn();
      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        granted: true,
        canAskAgain: true,
        expires: 'never',
      });
      mockImagePicker.launchCameraAsync.mockResolvedValue({
        canceled: true,
        assets: [],
      } as any);

      const { getByTestId } = render(
        <ProfilePhotoUploader {...defaultProps} onImageSelected={mockOnImageSelected} />
      );

      fireEvent.press(getByTestId('icon-button'));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const takePhotoOption = alertCall[2].find((option: any) => option.text === 'Take Photo');

      await takePhotoOption.onPress();

      await waitFor(() => {
        expect(mockOnImageSelected).not.toHaveBeenCalled();
      });
    });
  });

  describe('cancel option', () => {
    it('ProfilePhotoUploader_WhenCancelPressed_DoesNotCallCallback', async () => {
      const mockOnImageSelected = jest.fn();

      const { getByTestId } = render(
        <ProfilePhotoUploader {...defaultProps} onImageSelected={mockOnImageSelected} />
      );

      fireEvent.press(getByTestId('icon-button'));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const cancelOption = alertCall[2].find((option: any) => option.text === 'Cancel');

      if (cancelOption.onPress) {
        await cancelOption.onPress();
      }

      expect(mockOnImageSelected).not.toHaveBeenCalled();
    });
  });
});
