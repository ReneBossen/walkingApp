import {
  usersApi,
  UserProfileData,
  PublicUserProfile,
  UserStats,
  WeeklyActivity,
  Achievement,
  MutualGroup,
} from '../usersApi';
import { apiClient } from '../client';
import { supabase } from '@services/supabase';

// Mock the apiClient
jest.mock('../client', () => ({
  apiClient: {
    get: jest.fn(),
    put: jest.fn(),
    upload: jest.fn(),
  },
}));

// Mock the supabase client for methods that still use it
const mockGetUser = jest.fn();

jest.mock('@services/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: () => mockGetUser(),
    },
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('usersApi', () => {
  // UserProfileData no longer includes preferences - they are in a separate table
  const mockUserProfile: UserProfileData = {
    id: '123',
    display_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    onboarding_completed: true,
    created_at: '2024-01-01T00:00:00Z',
  };

  // Backend response format (camelCase)
  const mockBackendProfile = {
    id: '123',
    displayName: 'Test User',
    avatarUrl: 'https://example.com/avatar.jpg',
    onboardingCompleted: true,
    createdAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for authenticated user (for Supabase methods)
    mockGetUser.mockResolvedValue({
      data: { user: { id: '123' } },
      error: null,
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user successfully via backend API', async () => {
      mockApiClient.get.mockResolvedValue(mockBackendProfile);

      const result = await usersApi.getCurrentUser();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/users/me');
      expect(result).toEqual(mockUserProfile);
    });

    it('should map camelCase response to snake_case', async () => {
      mockApiClient.get.mockResolvedValue({
        id: '456',
        displayName: 'Another User',
        avatarUrl: 'https://example.com/other.jpg',
        onboardingCompleted: false,
        createdAt: '2024-02-15T10:30:00Z',
      });

      const result = await usersApi.getCurrentUser();

      expect(result).toEqual({
        id: '456',
        display_name: 'Another User',
        avatar_url: 'https://example.com/other.jpg',
        onboarding_completed: false,
        created_at: '2024-02-15T10:30:00Z',
      });
    });

    it('should throw error when API call fails', async () => {
      const apiError = new Error('Network error');
      mockApiClient.get.mockRejectedValue(apiError);

      await expect(usersApi.getCurrentUser()).rejects.toThrow('Network error');
    });

    it('should handle missing avatar_url', async () => {
      mockApiClient.get.mockResolvedValue({
        id: '123',
        displayName: 'Test User',
        avatarUrl: undefined,
        onboardingCompleted: true,
        createdAt: '2024-01-01T00:00:00Z',
      });

      const result = await usersApi.getCurrentUser();

      expect(result.avatar_url).toBeUndefined();
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully via backend API', async () => {
      const updates = { display_name: 'Updated Name' };
      const updatedBackendProfile = { ...mockBackendProfile, displayName: 'Updated Name' };

      mockApiClient.put.mockResolvedValue(updatedBackendProfile);

      const result = await usersApi.updateProfile(updates);

      expect(mockApiClient.put).toHaveBeenCalledWith('/api/v1/users/me', { displayName: 'Updated Name' });
      expect(result.display_name).toBe('Updated Name');
    });

    it('should map snake_case updates to camelCase request', async () => {
      const updates = {
        display_name: 'New Name',
        avatar_url: 'https://new-avatar.jpg',
        onboarding_completed: true,
      };

      mockApiClient.put.mockResolvedValue({
        id: '123',
        displayName: 'New Name',
        avatarUrl: 'https://new-avatar.jpg',
        onboardingCompleted: true,
        createdAt: '2024-01-01T00:00:00Z',
      });

      await usersApi.updateProfile(updates);

      expect(mockApiClient.put).toHaveBeenCalledWith('/api/v1/users/me', {
        displayName: 'New Name',
        avatarUrl: 'https://new-avatar.jpg',
        onboardingCompleted: true,
      });
    });

    it('should handle partial updates', async () => {
      const updates = { display_name: 'New Name Only' };

      mockApiClient.put.mockResolvedValue({
        ...mockBackendProfile,
        displayName: 'New Name Only',
      });

      const result = await usersApi.updateProfile(updates);

      expect(mockApiClient.put).toHaveBeenCalledWith('/api/v1/users/me', { displayName: 'New Name Only' });
      expect(result.display_name).toBe('New Name Only');
    });

    it('should throw error when update fails', async () => {
      const apiError = new Error('Update failed');
      mockApiClient.put.mockRejectedValue(apiError);

      await expect(usersApi.updateProfile({ display_name: 'Test' })).rejects.toThrow('Update failed');
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar successfully via backend API', async () => {
      const avatarUri = 'file://path/to/avatar.jpg';
      const publicUrl = 'https://storage.example.com/avatars/123/avatar.jpg';

      mockApiClient.upload.mockResolvedValue({ avatarUrl: publicUrl });

      const result = await usersApi.uploadAvatar(avatarUri);

      expect(mockApiClient.upload).toHaveBeenCalledWith(
        '/api/v1/users/me/avatar',
        expect.any(FormData)
      );
      expect(result).toBe(publicUrl);
    });

    it('should throw error when upload fails', async () => {
      const apiError = new Error('Upload failed');
      mockApiClient.upload.mockRejectedValue(apiError);

      await expect(usersApi.uploadAvatar('file://avatar.jpg')).rejects.toThrow('Upload failed');
    });

    it('should handle different file extensions', async () => {
      mockApiClient.upload.mockResolvedValue({ avatarUrl: 'https://example.com/avatar.png' });

      await usersApi.uploadAvatar('file://path/to/avatar.png');

      expect(mockApiClient.upload).toHaveBeenCalled();
      const formData = mockApiClient.upload.mock.calls[0][1];
      expect(formData).toBeInstanceOf(FormData);
    });
  });

  describe('getUserProfile', () => {
    const mockPublicProfile = {
      id: '456',
      display_name: 'Sarah Johnson',
      avatar_url: 'https://example.com/sarah.jpg',
      created_at: '2024-12-10T08:00:00Z',
    };

    it('should fetch user profile successfully (still uses Supabase)', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockPublicProfile,
        error: null,
      });

      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      // Mock preferences query for privacy check
      const mockPrefsSelect = jest.fn().mockReturnThis();
      const mockPrefsEq = jest.fn().mockReturnThis();
      const mockPrefsSingle = jest.fn().mockResolvedValue({
        data: { privacy_find_me: 'public' },
        error: null,
      });

      // Second call to from() for user_preferences
      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect,
        })
        .mockReturnValueOnce({
          select: mockPrefsSelect,
        });

      mockPrefsSelect.mockReturnValue({
        eq: mockPrefsEq,
      });

      mockPrefsEq.mockReturnValue({
        single: mockPrefsSingle,
      });

      const result = await usersApi.getUserProfile('456');

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(result.id).toBe('456');
      expect(result.display_name).toBe('Sarah Johnson');
      expect(result.is_private).toBe(false);
    });

    it('should mark profile as private when privacy_find_me is private', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockPublicProfile,
        error: null,
      });

      const mockPrefsSelect = jest.fn().mockReturnThis();
      const mockPrefsEq = jest.fn().mockReturnThis();
      const mockPrefsSingle = jest.fn().mockResolvedValue({
        data: { privacy_find_me: 'private' },
        error: null,
      });

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect,
        })
        .mockReturnValueOnce({
          select: mockPrefsSelect,
        });

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });

      mockPrefsSelect.mockReturnValue({ eq: mockPrefsEq });
      mockPrefsEq.mockReturnValue({ single: mockPrefsSingle });

      const result = await usersApi.getUserProfile('456');

      expect(result.is_private).toBe(true);
    });

    it('should throw error when user not found', async () => {
      const mockError = { message: 'User not found' };
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });

      await expect(usersApi.getUserProfile('456')).rejects.toEqual(mockError);
    });
  });

  describe('getUserStats', () => {
    it('should fetch user stats successfully (still uses Supabase)', async () => {
      // Mock friendships count
      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              or: jest.fn().mockResolvedValue({ count: 10, error: null }),
            }),
          }),
        })
        // Mock group_memberships count
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ count: 5, error: null }),
          }),
        });

      const result = await usersApi.getUserStats('123');

      expect(result.friends_count).toBe(10);
      expect(result.groups_count).toBe(5);
      expect(result.badges_count).toBe(0); // Currently hardcoded as badges are not implemented
    });

    it('should return zero counts when no data', async () => {
      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              or: jest.fn().mockResolvedValue({ count: null, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ count: null, error: null }),
          }),
        });

      const result = await usersApi.getUserStats('123');

      expect(result.friends_count).toBe(0);
      expect(result.groups_count).toBe(0);
    });
  });

  describe('getWeeklyActivity', () => {
    it('should calculate weekly activity correctly (still uses Supabase)', async () => {
      const mockEntries = [
        { date: '2025-01-24', step_count: 10000, distance_meters: 8000 },
        { date: '2025-01-23', step_count: 8000, distance_meters: 6400 },
        { date: '2025-01-22', step_count: 12000, distance_meters: 9600 },
      ];

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                lte: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({ data: mockEntries, error: null }),
                }),
              }),
            }),
          }),
        })
        // For streak calculation
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockEntries, error: null }),
            }),
          }),
        });

      const result = await usersApi.getWeeklyActivity('123');

      expect(result.total_steps).toBe(30000);
      expect(result.total_distance_meters).toBe(24000);
      expect(result.average_steps_per_day).toBe(10000);
    });

    it('should return zero values when no entries', async () => {
      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                lte: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        });

      const result = await usersApi.getWeeklyActivity('123');

      expect(result.total_steps).toBe(0);
      expect(result.total_distance_meters).toBe(0);
      expect(result.average_steps_per_day).toBe(0);
      expect(result.current_streak).toBe(0);
    });
  });

  describe('getAchievements', () => {
    it('should return empty array (achievements not implemented)', async () => {
      const result = await usersApi.getAchievements('123');

      expect(result).toEqual([]);
    });
  });

  describe('getMutualGroups', () => {
    it('should fetch mutual groups successfully (still uses Supabase)', async () => {
      // Mock authenticated user
      mockGetUser.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      });

      // Mock current user's groups
      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{ group_id: 'group-1' }, { group_id: 'group-2' }],
              error: null,
            }),
          }),
        })
        // Mock other user's groups with join
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [
                  { group_id: 'group-1', groups: { id: 'group-1', name: 'Morning Walkers' } },
                ],
                error: null,
              }),
            }),
          }),
        });

      const result = await usersApi.getMutualGroups('456');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 'group-1', name: 'Morning Walkers' });
    });

    it('should return empty array when no mutual groups', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      });

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{ group_id: 'group-1' }],
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        });

      const result = await usersApi.getMutualGroups('456');

      expect(result).toEqual([]);
    });

    it('should return empty array when user has no groups', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      });

      (mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const result = await usersApi.getMutualGroups('456');

      expect(result).toEqual([]);
    });
  });

});
