import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NotificationItem } from '../types';
import { getNotifications } from '../services/notificationsService';

const READ_IDS_KEY = 'notification_read_ids';

interface NotificationState {
  notifications: NotificationItem[];
  readIds: Set<string>;
  isLoading: boolean;
  error: string | null;
  unreadCount: number;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  reset: () => void;
}

function computeUnreadCount(notifications: NotificationItem[], readIds: Set<string>): number {
  return notifications.filter((n) => !readIds.has(n.id)).length;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  readIds: new Set(),
  isLoading: false,
  error: null,
  unreadCount: 0,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const notifications = await getNotifications();

      // Load persisted read IDs
      let readIds = get().readIds;
      if (readIds.size === 0) {
        const stored = await AsyncStorage.getItem(READ_IDS_KEY);
        if (stored) {
          readIds = new Set(JSON.parse(stored));
        }
      }

      // Prune read IDs that no longer match any notification
      const currentIds = new Set(notifications.map((n) => n.id));
      const pruned = new Set([...readIds].filter((id) => currentIds.has(id)));
      if (pruned.size !== readIds.size) {
        AsyncStorage.setItem(READ_IDS_KEY, JSON.stringify([...pruned])).catch(() => {});
      }

      set({
        notifications,
        readIds: pruned,
        unreadCount: computeUnreadCount(notifications, pruned),
      });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: (id: string) => {
    const { readIds, notifications } = get();
    if (readIds.has(id)) return;

    const updated = new Set(readIds);
    updated.add(id);
    AsyncStorage.setItem(READ_IDS_KEY, JSON.stringify([...updated])).catch(() => {});

    set({
      readIds: updated,
      unreadCount: computeUnreadCount(notifications, updated),
    });
  },

  reset: () => {
    set({
      notifications: [],
      readIds: new Set(),
      isLoading: false,
      error: null,
      unreadCount: 0,
    });
  },
}));
