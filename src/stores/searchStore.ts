import { create } from 'zustand';
import type { UserSearchResult, VehicleSearchResult } from '../types';
import { searchUsers, searchVehicles } from '../services/searchService';

type SearchTab = 'users' | 'vehicles';

interface SearchState {
  query: string;
  activeTab: SearchTab;
  userResults: UserSearchResult[];
  vehicleResults: VehicleSearchResult[];
  isSearching: boolean;
  hasSearched: boolean;

  setQuery: (query: string) => void;
  setActiveTab: (tab: SearchTab) => void;
  search: () => Promise<void>;
  clear: () => void;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  activeTab: 'users',
  userResults: [],
  vehicleResults: [],
  isSearching: false,
  hasSearched: false,

  setQuery: (query) => {
    set({ query });

    if (debounceTimer) clearTimeout(debounceTimer);

    if (!query.trim()) {
      set({ userResults: [], vehicleResults: [], hasSearched: false });
      return;
    }

    debounceTimer = setTimeout(() => {
      get().search();
    }, 300);
  },

  setActiveTab: (activeTab) => set({ activeTab }),

  search: async () => {
    const { query } = get();
    if (!query.trim()) return;

    set({ isSearching: true });
    try {
      const [users, vehicles] = await Promise.all([
        searchUsers(query.trim()),
        searchVehicles(query.trim()),
      ]);
      // Only apply results if query hasn't changed during the request
      if (get().query.trim() === query.trim()) {
        set({
          userResults: users,
          vehicleResults: vehicles,
          hasSearched: true,
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
    } finally {
      set({ isSearching: false });
    }
  },

  clear: () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    set({
      query: '',
      userResults: [],
      vehicleResults: [],
      isSearching: false,
      hasSearched: false,
    });
  },
}));
