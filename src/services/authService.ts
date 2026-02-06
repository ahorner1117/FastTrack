import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useVehicleStore } from '../stores/vehicleStore';
import { useHistoryStore } from '../stores/historyStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useRunStore } from '../stores/runStore';
import { useFriendsStore } from '../stores/friendsStore';
import { useFeedStore } from '../stores/feedStore';
import { syncAllUnsyncedRuns } from './syncService';
import { STORAGE_KEYS } from '../utils/constants';
import type { Profile } from '../types';

interface SignUpParams {
  email: string;
  password: string;
  displayName?: string;
}

interface SignInParams {
  email: string;
  password: string;
}

export async function signUp({ email, password, displayName }: SignUpParams) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || null,
      },
    },
  });

  if (error) {
    throw error;
  }

  // Create profile in profiles table
  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email: data.user.email,
      display_name: displayName || null,
    });

    if (profileError) {
      console.error('Error creating profile:', profileError);
    }
  }

  return data;
}

export async function signIn({ email, password }: SignInParams) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  // Reset all stores to prevent data leaking between accounts
  useAuthStore.getState().reset();
  useVehicleStore.getState().reset();
  useHistoryStore.getState().clearHistory();
  useSettingsStore.getState().resetToDefaults();
  useRunStore.getState().reset();
  useFriendsStore.getState().reset();
  useFeedStore.getState().reset();

  // Clear persisted data from AsyncStorage
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.VEHICLES,
    STORAGE_KEYS.RUNS,
    STORAGE_KEYS.SETTINGS,
  ]);
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'display_name' | 'phone_hash' | 'avatar_url'>>
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Profile;
}

export async function initializeAuth() {
  const { setSession, setProfile, setIsLoading } = useAuthStore.getState();

  try {
    // Get current session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setSession(session);

    // Fetch profile if logged in
    if (session?.user) {
      const profile = await getProfile(session.user.id);
      setProfile(profile);

      // Sync any unsynced runs in background
      syncAllUnsyncedRuns().catch((error) => {
        console.error('Failed to sync runs on init:', error);
      });
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (session?.user) {
        const profile = await getProfile(session.user.id);
        setProfile(profile);

        if (event === 'SIGNED_IN') {
          // Clear any stale local data from a previous account before syncing.
          // This prevents the previous user's unsynced runs from being
          // uploaded to the new user's account.
          useVehicleStore.getState().reset();
          useHistoryStore.getState().clearHistory();
          useRunStore.getState().reset();
          useFriendsStore.getState().reset();
          useFeedStore.getState().reset();
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.VEHICLES,
            STORAGE_KEYS.RUNS,
          ]);
        }
      } else {
        setProfile(null);
      }
    });
  } catch (error) {
    console.error('Error initializing auth:', error);
  } finally {
    setIsLoading(false);
  }
}
