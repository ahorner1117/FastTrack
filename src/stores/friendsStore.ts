import { create } from 'zustand';
import type { Friendship, Profile } from '../types';
import {
  getFriends,
  getPendingFriendRequests,
  getSentFriendRequests,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
} from '../services/friendsService';

interface FriendsState {
  friends: Friendship[];
  pendingRequests: Friendship[];
  sentRequests: Friendship[];
  isLoading: boolean;
  error: string | null;

  fetchFriends: () => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  fetchSentRequests: () => Promise<void>;
  fetchAll: () => Promise<void>;
  sendRequest: (friendId: string) => Promise<void>;
  acceptRequest: (friendshipId: string) => Promise<void>;
  rejectRequest: (friendshipId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  reset: () => void;
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  isLoading: false,
  error: null,

  fetchFriends: async () => {
    try {
      const friends = await getFriends();
      set({ friends });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchPendingRequests: async () => {
    try {
      const pendingRequests = await getPendingFriendRequests();
      set({ pendingRequests });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchSentRequests: async () => {
    try {
      const sentRequests = await getSentFriendRequests();
      set({ sentRequests });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all([
        get().fetchFriends(),
        get().fetchPendingRequests(),
        get().fetchSentRequests(),
      ]);
    } finally {
      set({ isLoading: false });
    }
  },

  sendRequest: async (friendId: string) => {
    try {
      await sendFriendRequest(friendId);
      await get().fetchSentRequests();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  acceptRequest: async (friendshipId: string) => {
    try {
      await respondToFriendRequest(friendshipId, 'accepted');
      await Promise.all([get().fetchFriends(), get().fetchPendingRequests()]);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  rejectRequest: async (friendshipId: string) => {
    try {
      await respondToFriendRequest(friendshipId, 'rejected');
      await get().fetchPendingRequests();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  removeFriend: async (friendshipId: string) => {
    try {
      await removeFriend(friendshipId);
      await get().fetchFriends();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  reset: () =>
    set({
      friends: [],
      pendingRequests: [],
      sentRequests: [],
      isLoading: false,
      error: null,
    }),
}));
