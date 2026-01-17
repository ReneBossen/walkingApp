import { renderHook, act, waitFor } from '@testing-library/react-native';
import { usePermissions } from '../usePermissions';
import * as Notifications from 'expo-notifications';

// Mock expo-notifications
jest.mock('expo-notifications');

const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;

describe('usePermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('usePermissions_OnMount_StartsWithUndeterminedStatus', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'undetermined' as any,
      } as any);

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.notificationPermissionStatus).toBe('undetermined');
      });
    });
  });

  describe('checkNotificationPermission', () => {
    it('usePermissions_WhenPermissionGranted_SetsStatusToGranted', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'granted',
      } as any);

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.notificationPermissionStatus).toBe('granted');
      });
    });

    it('usePermissions_WhenPermissionDenied_SetsStatusToDenied', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'denied',
      } as any);

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.notificationPermissionStatus).toBe('denied');
      });
    });

    it('usePermissions_OnMount_ChecksPermissionStatus', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'granted',
      } as any);

      renderHook(() => usePermissions());

      await waitFor(() => {
        expect(mockNotifications.getPermissionsAsync).toHaveBeenCalledTimes(1);
      });
    });

    it('usePermissions_WithUndeterminedPermission_SetsStatusToUndetermined', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'undetermined',
      } as any);

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.notificationPermissionStatus).toBe('undetermined');
      });
    });
  });

  describe('requestNotificationPermission', () => {
    it('requestNotificationPermission_WhenUserGrants_SetsStatusToGranted', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'undetermined',
      } as any);
      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        status: 'granted',
      } as any);

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.notificationPermissionStatus).toBe('undetermined');
      });

      await act(async () => {
        await result.current.requestNotificationPermission();
      });

      await waitFor(() => {
        expect(result.current.notificationPermissionStatus).toBe('granted');
      });
    });

    it('requestNotificationPermission_WhenUserDenies_SetsStatusToDenied', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'undetermined',
      } as any);
      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        status: 'denied',
      } as any);

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.notificationPermissionStatus).toBe('undetermined');
      });

      await act(async () => {
        await result.current.requestNotificationPermission();
      });

      await waitFor(() => {
        expect(result.current.notificationPermissionStatus).toBe('denied');
      });
    });

    it('requestNotificationPermission_WhenCalled_CallsExpoRequestPermissions', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'undetermined',
      } as any);
      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        status: 'granted',
      } as any);

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.notificationPermissionStatus).toBe('undetermined');
      });

      await act(async () => {
        await result.current.requestNotificationPermission();
      });

      expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    it('requestNotificationPermission_WithMultipleCalls_UpdatesStatusEachTime', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'undetermined',
      } as any);

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.notificationPermissionStatus).toBe('undetermined');
      });

      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        status: 'denied',
      } as any);

      await act(async () => {
        await result.current.requestNotificationPermission();
      });

      await waitFor(() => {
        expect(result.current.notificationPermissionStatus).toBe('denied');
      });

      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        status: 'granted',
      } as any);

      await act(async () => {
        await result.current.requestNotificationPermission();
      });

      await waitFor(() => {
        expect(result.current.notificationPermissionStatus).toBe('granted');
      });
    });
  });

  describe('return values', () => {
    it('usePermissions_Always_ReturnsExpectedInterface', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'undetermined',
      } as any);

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current).toHaveProperty('notificationPermissionStatus');
        expect(result.current).toHaveProperty('requestNotificationPermission');
      });

      expect(typeof result.current.requestNotificationPermission).toBe('function');
      expect(['undetermined', 'granted', 'denied']).toContain(
        result.current.notificationPermissionStatus
      );
    });
  });
});
