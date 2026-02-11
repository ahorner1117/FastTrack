import { create } from 'zustand';
import type { Post, UserSearchResult } from '../types';
import { searchUsers, searchPostsByVehicle } from '../services/searchService';

type SearchTab = 'users' | 'posts';

interface SearchState {
  query: string;
  activeTab: SearchTab;
  userResults: UserSearchResult[];
  postResults: Post[];
  isSearching: boolean;
  hasSearched: boolean;

  setQuery: (query: string) => void;
  setActiveTab: (tab: SearchTab) => void;
  search: () => Promise<void>;
  clear: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  activeTab: 'users',
  userResults: [],
  postResults: [],
  isSearching: false,
  hasSearched: false,

  setQuery: (query) => set({ query }),

  setActiveTab: (activeTab) => set({ activeTab }),

  search: async () => {
    const { query } = get();
    if (!query.trim()) return;

    set({ isSearching: true });
    try {
      const [users, posts] = await Promise.all([
        searchUsers(query.trim()),
        searchPostsByVehicle(query.trim()),
      ]);
      set({
        userResults: users,
        postResults: posts,
        hasSearched: true,
      });
    } catch (error: any) {
      console.error('Search error:', error);
    } finally {
      set({ isSearching: false });
    }
  },

  clear: () =>
    set({
      query: '',
      userResults: [],
      postResults: [],
      isSearching: false,
      hasSearched: false,
    }),
}));
