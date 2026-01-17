import { renderHook, act } from '@testing-library/react-native';
import { useOnboarding } from '../useOnboarding';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('useOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.getItem.mockResolvedValue(null);
  });

  describe('markOnboardingComplete', () => {
    it('markOnboardingComplete_WhenCalled_SavesToAsyncStorage', async () => {
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        await result.current.markOnboardingComplete();
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@onboarding_completed',
        'true'
      );
    });

    it('markOnboardingComplete_WithStorageError_DoesNotThrow', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        await expect(result.current.markOnboardingComplete()).resolves.not.toThrow();
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('markOnboardingComplete_WithMultipleCalls_CallsStorageMultipleTimes', async () => {
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        await result.current.markOnboardingComplete();
        await result.current.markOnboardingComplete();
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('checkOnboardingStatus', () => {
    it('checkOnboardingStatus_WhenOnboardingCompleted_ReturnsTrue', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('true');

      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        const status = await result.current.checkOnboardingStatus();
        expect(status).toBe(true);
      });
    });

    it('checkOnboardingStatus_WhenOnboardingNotCompleted_ReturnsFalse', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        const status = await result.current.checkOnboardingStatus();
        expect(status).toBe(false);
      });
    });

    it('checkOnboardingStatus_WhenStorageHasDifferentValue_ReturnsFalse', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('false');

      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        const status = await result.current.checkOnboardingStatus();
        expect(status).toBe(false);
      });
    });

    it('checkOnboardingStatus_WhenCalled_QueriesCorrectKey', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('true');

      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        await result.current.checkOnboardingStatus();
      });

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@onboarding_completed');
    });

    it('checkOnboardingStatus_WithStorageError_ReturnsFalse', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        const status = await result.current.checkOnboardingStatus();
        expect(status).toBe(false);
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('checkOnboardingStatus_WithMultipleCalls_QueriesStorageEachTime', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('true');

      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        await result.current.checkOnboardingStatus();
        await result.current.checkOnboardingStatus();
      });

      expect(mockAsyncStorage.getItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('integration', () => {
    it('useOnboarding_AfterMarkingComplete_CheckStatusReturnsTrue', async () => {
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        await result.current.markOnboardingComplete();
      });

      mockAsyncStorage.getItem.mockResolvedValue('true');

      await act(async () => {
        const status = await result.current.checkOnboardingStatus();
        expect(status).toBe(true);
      });
    });
  });

  describe('return values', () => {
    it('useOnboarding_Always_ReturnsExpectedInterface', () => {
      const { result } = renderHook(() => useOnboarding());

      expect(result.current).toHaveProperty('markOnboardingComplete');
      expect(result.current).toHaveProperty('checkOnboardingStatus');
      expect(typeof result.current.markOnboardingComplete).toBe('function');
      expect(typeof result.current.checkOnboardingStatus).toBe('function');
    });
  });
});
