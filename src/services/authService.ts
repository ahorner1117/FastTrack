import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useVehicleStore } from '../stores/vehicleStore';
import { useHistoryStore } from '../stores/historyStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useRunStore } from '../stores/runStore';
import { useDriveHistoryStore } from '../stores/driveHistoryStore';
import { useFriendsStore } from '../stores/friendsStore';
import { useFeedStore } from '../stores/feedStore';
import {
  syncAllUnsyncedRuns,
  syncAllUnsyncedDrives,
  syncAllVehicles,
  fetchVehiclesFromCloud,
  fetchRunsFromCloud,
  fetchDrivesFromCloud,
} from './syncService';
import { registerAndSavePushToken, clearPushToken } from './notificationService';
import { STORAGE_KEYS } from '../utils/constants';
import type { Profile } from '../types';

interface SignUpParams {
  email: string;
  password: string;
  username: string;
  displayName?: string;
  tosAccepted?: boolean;
  tosVersion?: string;
}

interface SignInParams {
  email: string;
  password: string;
}

export async function checkUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
  let query = supabase
    .from('profiles')
    .select('id')
    .ilike('username', username);

  if (excludeUserId) {
    query = query.neq('id', excludeUserId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Error checking username:', error);
    return false;
  }

  return data === null;
}

export async function signUp({ email, password, username, displayName, tosAccepted, tosVersion }: SignUpParams) {
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
      username: username.toLowerCase(),
      display_name: displayName || null,
      tos_accepted_at: tosAccepted ? new Date().toISOString() : null,
      tos_version: tosVersion || null,
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

  // Check if user is banned
  if (data.user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_banned, ban_reason')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Error checking ban status:', profileError);
      // Continue login if profile check fails (don't block legitimate users)
    } else if (profile?.is_banned) {
      // Sign out the user immediately
      await supabase.auth.signOut();
      throw new Error(
        profile.ban_reason || 'Your account has been banned. Please contact support.'
      );
    }
  }

  return data;
}

export async function signOut() {
  // Clear push token before signing out (while we still have auth)
  await clearPushToken().catch(console.error);

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  // Reset all stores to prevent data leaking between accounts
  useAuthStore.getState().reset();
  useVehicleStore.getState().reset();
  useHistoryStore.getState().clearHistory();
  useDriveHistoryStore.getState().clearHistory();
  useSettingsStore.getState().resetToDefaults();
  useRunStore.getState().reset();
  useFriendsStore.getState().reset();
  useFeedStore.getState().reset();

  // Clear persisted data from AsyncStorage
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.VEHICLES,
    STORAGE_KEYS.RUNS,
    STORAGE_KEYS.DRIVES,
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
  updates: Partial<Pick<Profile, 'display_name' | 'phone_hash' | 'avatar_url' | 'bio' | 'username'>>
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

export async function resetPasswordForEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'fasttrack://reset-password',
  });

  if (error) {
    throw error;
  }
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    throw error;
  }
}

export async function deleteAccount() {
  const { data, error } = await supabase.functions.invoke('delete-account');

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  // Clear all local stores and persisted data
  useAuthStore.getState().reset();
  useVehicleStore.getState().reset();
  useHistoryStore.getState().clearHistory();
  useDriveHistoryStore.getState().clearHistory();
  useSettingsStore.getState().resetToDefaults();
  useRunStore.getState().reset();
  useFriendsStore.getState().reset();
  useFeedStore.getState().reset();

  await AsyncStorage.multiRemove([
    STORAGE_KEYS.VEHICLES,
    STORAGE_KEYS.RUNS,
    STORAGE_KEYS.DRIVES,
    STORAGE_KEYS.SETTINGS,
  ]);
}

export async function signInWithGoogle() {
  const redirectTo = Linking.createURL('google-auth');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error('No OAuth URL returned');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
    preferEphemeralSession: true,
  });

  if (result.type !== 'success') {
    throw new Error('Google sign-in was cancelled');
  }

  const url = result.url;
  // Tokens can be in the fragment (#) or query (?) depending on the flow
  const fragment = url.split('#')[1];
  if (!fragment) {
    throw new Error('No authentication data returned');
  }

  const params = new URLSearchParams(fragment);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) {
    throw new Error('Missing authentication tokens');
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) throw sessionError;
}

async function createProfileForOAuthUser(userId: string, email: string, displayName?: string) {
  const { error } = await supabase.from('profiles').insert({
    id: userId,
    email,
    display_name: displayName || null,
  });

  // Ignore duplicate key errors (profile already exists)
  if (error && error.code !== '23505') {
    console.error('Error creating OAuth profile:', error);
  }
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
      let profile = await getProfile(session.user.id);

      // Auto-create profile for OAuth users who don't have one yet
      if (!profile) {
        const meta = session.user.user_metadata;
        await createProfileForOAuthUser(
          session.user.id,
          session.user.email || '',
          meta?.full_name || meta?.name || meta?.display_name
        );
        profile = await getProfile(session.user.id);
      }

      setProfile(profile);

      // Restore data from cloud and sync any local changes in background
      restoreAndSync().catch((error) => {
        console.error('Failed to restore/sync on init:', error);
      });
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (session?.user) {
        let profile = await getProfile(session.user.id);

        // Auto-create profile for OAuth users who don't have one yet
        if (!profile) {
          const meta = session.user.user_metadata;
          await createProfileForOAuthUser(
            session.user.id,
            session.user.email || '',
            meta?.full_name || meta?.name || meta?.display_name
          );
          profile = await getProfile(session.user.id);
        }

        setProfile(profile);

        if (event === 'SIGNED_IN') {
          // Clear any stale local data from a previous account before syncing.
          // This prevents the previous user's unsynced runs from being
          // uploaded to the new user's account.
          useVehicleStore.getState().reset();
          useHistoryStore.getState().clearHistory();
          useDriveHistoryStore.getState().clearHistory();
          useRunStore.getState().reset();
          useFriendsStore.getState().reset();
          useFeedStore.getState().reset();
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.VEHICLES,
            STORAGE_KEYS.RUNS,
            STORAGE_KEYS.DRIVES,
          ]);

          // Restore user's data from cloud after clearing stale data
          restoreAndSync().catch((error) => {
            console.error('Failed to restore data on sign in:', error);
          });
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

async function restoreAndSync() {
  // 1. Restore vehicles from cloud first (runs need vehicles for matching)
  const cloudVehicles = await fetchVehiclesFromCloud();
  if (cloudVehicles.length > 0) {
    useVehicleStore.getState().setVehicles(cloudVehicles);
  }

  // 2. Restore runs from cloud (matches vehicle names to local vehicle IDs)
  const cloudRuns = await fetchRunsFromCloud();
  if (cloudRuns.length > 0) {
    useHistoryStore.getState().setRuns(cloudRuns);
  }

  // 3. Restore drives from cloud
  const cloudDrives = await fetchDrivesFromCloud();
  if (cloudDrives.length > 0) {
    useDriveHistoryStore.getState().setDrives(cloudDrives);
  }

  // 4. Push any local-only data up to cloud
  await syncAllVehicles();
  await syncAllUnsyncedRuns();
  await syncAllUnsyncedDrives();

  // 5. Register push notifications token
  registerAndSavePushToken().catch(console.error);
}
