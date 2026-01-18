import { create } from 'zustand';
import { notificationsApi } from '@services/api/notificationsApi';
import { getErrorMessage } from '@utils/errorUtils';

export interface Notification {
  id: string;
  user_id: string;
  type: 'friend_request' | 'friend_accepted' | 'group_invite' | 'goal_achieved' | 'general';
  title: string;
  message: string;
  is_read: boolean;
  data?: Record<string, any>;
  created_at: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const notifications = await notificationsApi.getNotifications();
      set({ notifications, isLoading: false });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const unreadCount = await notificationsApi.getUnreadCount();
      set({ unreadCount });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
    }
  },

  markAsRead: async (notificationId) => {
    set({ isLoading: true, error: null });
    try {
      await notificationsApi.markAsRead(notificationId);
      const notifications = get().notifications.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      );
      set({ notifications, isLoading: false });
      await get().fetchUnreadCount();
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  markAllAsRead: async () => {
    set({ isLoading: true, error: null });
    try {
      await notificationsApi.markAllAsRead();
      const notifications = get().notifications.map(n => ({ ...n, is_read: true }));
      set({ notifications, unreadCount: 0, isLoading: false });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  deleteNotification: async (notificationId) => {
    set({ isLoading: true, error: null });
    try {
      await notificationsApi.deleteNotification(notificationId);
      const notifications = get().notifications.filter(n => n.id !== notificationId);
      set({ notifications, isLoading: false });
      await get().fetchUnreadCount();
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },
}));
