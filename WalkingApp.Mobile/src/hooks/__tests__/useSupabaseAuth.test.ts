import { renderHook, act, waitFor } from '@testing-library/react-native';

// Create mocks before any imports
const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockSignOut = jest.fn();
const mockUnsubscribe = jest.fn();

// Mock the supabase service module
jest.mock('@services/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: mockSignOut,
    },
  },
}));

// Import after mocks are set up
import { useSupabaseAuth } from '../useSupabaseAuth';

describe('useSupabaseAuth', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockGetSession.mockReset();
    mockOnAuthStateChange.mockReset();
    mockSignOut.mockReset();
    mockUnsubscribe.mockReset();

    // Default setup for onAuthStateChange
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    mockGetSession.mockReturnValue(
      new Promise(() => {}) // Never resolves to keep loading state
    );

    const { result } = renderHook(() => useSupabaseAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('should load initial session successfully', async () => {
    const mockSession = {
      access_token: 'mock-token',
      user: { id: '123', email: 'test@example.com' },
    };

    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
    });

    const { result } = renderHook(() => useSupabaseAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.session).toEqual(mockSession);
    expect(result.current.user).toEqual(mockSession.user);
  });

  it('should handle no session on initial load', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    const { result } = renderHook(() => useSupabaseAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('should set up auth state change listener', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    renderHook(() => useSupabaseAuth());

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });
  });

  it('should update state when auth state changes', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    let authChangeCallback: (event: string, session: any) => void = () => {};
    mockOnAuthStateChange.mockImplementation((callback) => {
      authChangeCallback = callback;
      return {
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      };
    });

    const { result } = renderHook(() => useSupabaseAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newSession = {
      access_token: 'new-token',
      user: { id: '456', email: 'newuser@example.com' },
    };

    act(() => {
      authChangeCallback('SIGNED_IN', newSession);
    });

    expect(result.current.session).toEqual(newSession);
    expect(result.current.user).toEqual(newSession.user);
  });

  it('should clear user and session on sign out event', async () => {
    const initialSession = {
      access_token: 'token',
      user: { id: '123', email: 'test@example.com' },
    };

    mockGetSession.mockResolvedValue({
      data: { session: initialSession },
    });

    let authChangeCallback: (event: string, session: any) => void = () => {};
    mockOnAuthStateChange.mockImplementation((callback) => {
      authChangeCallback = callback;
      return {
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      };
    });

    const { result } = renderHook(() => useSupabaseAuth());

    await waitFor(() => {
      expect(result.current.user).toEqual(initialSession.user);
    });

    act(() => {
      authChangeCallback('SIGNED_OUT', null);
    });

    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('should handle token refresh event', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    let authChangeCallback: (event: string, session: any) => void = () => {};
    mockOnAuthStateChange.mockImplementation((callback) => {
      authChangeCallback = callback;
      return {
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      };
    });

    const { result } = renderHook(() => useSupabaseAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const refreshedSession = {
      access_token: 'refreshed-token',
      user: { id: '123', email: 'test@example.com' },
    };

    act(() => {
      authChangeCallback('TOKEN_REFRESHED', refreshedSession);
    });

    expect(result.current.session).toEqual(refreshedSession);
    expect(result.current.user).toEqual(refreshedSession.user);
  });

  it('should provide signOut function', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });
    mockSignOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useSupabaseAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.signOut).toBe('function');

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('should unsubscribe from auth changes on unmount', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    const { unmount } = renderHook(() => useSupabaseAuth());

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should handle multiple auth state changes', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    let authChangeCallback: (event: string, session: any) => void = () => {};
    mockOnAuthStateChange.mockImplementation((callback) => {
      authChangeCallback = callback;
      return {
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      };
    });

    const { result } = renderHook(() => useSupabaseAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const session1 = {
      access_token: 'token1',
      user: { id: '1', email: 'user1@example.com' },
    };

    act(() => {
      authChangeCallback('SIGNED_IN', session1);
    });

    expect(result.current.user?.id).toBe('1');

    const session2 = {
      access_token: 'token2',
      user: { id: '2', email: 'user2@example.com' },
    };

    act(() => {
      authChangeCallback('SIGNED_IN', session2);
    });

    expect(result.current.user?.id).toBe('2');
  });

  it('should handle null user when session is null', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    let authChangeCallback: (event: string, session: any) => void = () => {};
    mockOnAuthStateChange.mockImplementation((callback) => {
      authChangeCallback = callback;
      return {
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      };
    });

    const { result } = renderHook(() => useSupabaseAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      authChangeCallback('SIGNED_IN', null);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it('should handle session with null user property', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'token', user: null } },
    });

    const { result } = renderHook(() => useSupabaseAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it('should only call getSession once on mount', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    renderHook(() => useSupabaseAuth());

    await waitFor(() => {
      expect(mockGetSession).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle session load with error property', async () => {
    // Instead of rejection, test error in response (which is what Supabase actually returns)
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Session error' },
    });

    const { result } = renderHook(() => useSupabaseAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // The hook should have null values when there's an error
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('should return all expected properties', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    const { result } = renderHook(() => useSupabaseAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toHaveProperty('session');
    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('signOut');
  });
});
