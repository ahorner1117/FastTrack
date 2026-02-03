import { supabase } from '../lib/supabase';
import type { Profile, CloudRun } from '../types';

export interface AdminUserWithStats extends Profile {
  run_count: number;
}

export interface AdminUserDetail {
  profile: Profile;
  runs: CloudRun[];
}

export async function getAllUsers(): Promise<AdminUserWithStats[]> {
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profilesError) {
    throw profilesError;
  }

  // Get run counts for each user
  const { data: runCounts, error: runCountsError } = await supabase
    .from('runs')
    .select('user_id');

  if (runCountsError) {
    throw runCountsError;
  }

  // Count runs per user
  const countMap = new Map<string, number>();
  runCounts?.forEach((run) => {
    countMap.set(run.user_id, (countMap.get(run.user_id) || 0) + 1);
  });

  // Combine profiles with run counts
  return (profiles || []).map((profile) => ({
    ...profile,
    run_count: countMap.get(profile.id) || 0,
  }));
}

export async function getUserDetail(userId: string): Promise<AdminUserDetail> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    throw profileError;
  }

  const { data: runs, error: runsError } = await supabase
    .from('runs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (runsError) {
    throw runsError;
  }

  return {
    profile,
    runs: runs || [],
  };
}

export async function searchUsers(query: string): Promise<AdminUserWithStats[]> {
  const searchTerm = `%${query}%`;

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .or(`email.ilike.${searchTerm},display_name.ilike.${searchTerm}`)
    .order('created_at', { ascending: false });

  if (profilesError) {
    throw profilesError;
  }

  // Get run counts for matched users
  const userIds = profiles?.map((p) => p.id) || [];
  if (userIds.length === 0) return [];

  const { data: runCounts, error: runCountsError } = await supabase
    .from('runs')
    .select('user_id')
    .in('user_id', userIds);

  if (runCountsError) {
    throw runCountsError;
  }

  // Count runs per user
  const countMap = new Map<string, number>();
  runCounts?.forEach((run) => {
    countMap.set(run.user_id, (countMap.get(run.user_id) || 0) + 1);
  });

  // Combine profiles with run counts
  return (profiles || []).map((profile) => ({
    ...profile,
    run_count: countMap.get(profile.id) || 0,
  }));
}
