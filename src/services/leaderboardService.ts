import { supabase } from '../lib/supabase';
import { getFriendIds } from './friendsService';
import type { LeaderboardCategory, LeaderboardEntry, CloudRun } from '../types';

const CATEGORY_COLUMNS: Record<LeaderboardCategory, string> = {
  zero_to_sixty: 'zero_to_sixty_time',
  zero_to_hundred: 'zero_to_hundred_time',
  quarter_mile: 'quarter_mile_time',
  half_mile: 'half_mile_time',
};

export interface PersonalBests {
  zero_to_sixty: number | null;
  zero_to_hundred: number | null;
  quarter_mile: number | null;
  half_mile: number | null;
}

// Filter to only keep the best (lowest) time per user
function filterBestPerUser(runs: any[], column: string): any[] {
  const bestByUser = new Map<string, any>();

  for (const run of runs) {
    const userId = run.user_id;
    const time = run[column];

    if (!bestByUser.has(userId) || time < bestByUser.get(userId)[column]) {
      bestByUser.set(userId, run);
    }
  }

  // Convert back to array and sort by time
  return Array.from(bestByUser.values()).sort((a, b) => a[column] - b[column]);
}

export async function getLeaderboard(
  category: LeaderboardCategory,
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  const column = CATEGORY_COLUMNS[category];

  // Fetch more than limit since we'll filter to best per user
  const { data: runs, error } = await supabase
    .from('runs')
    .select(
      `
      id,
      user_id,
      ${column},
      vehicle_name,
      profiles!runs_user_id_fkey(display_name, avatar_url)
    `
    )
    .not(column, 'is', null)
    .order(column, { ascending: true })
    .limit(limit * 3); // Fetch extra to account for multiple runs per user

  if (error) {
    throw error;
  }

  // Filter to only best time per user
  const bestRuns = filterBestPerUser(runs || [], column).slice(0, limit);

  // Get current user's friend IDs
  let friendIds: string[] = [];
  try {
    friendIds = await getFriendIds();
  } catch {
    // User might not be authenticated
  }

  const friendIdSet = new Set(friendIds);

  const entries: LeaderboardEntry[] = bestRuns.map((run: any, index: number) => ({
    rank: index + 1,
    user_id: run.user_id,
    display_name: run.profiles?.display_name || 'Anonymous',
    avatar_url: run.profiles?.avatar_url || null,
    time: run[column],
    vehicle_name: run.vehicle_name,
    is_friend: friendIdSet.has(run.user_id),
  }));

  return entries;
}

export async function getFriendsLeaderboard(
  category: LeaderboardCategory
): Promise<LeaderboardEntry[]> {
  const column = CATEGORY_COLUMNS[category];

  // Get current user's friend IDs
  const friendIds = await getFriendIds();

  // Include current user even if no friends
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userIds = user ? [...friendIds, user.id] : friendIds;

  if (userIds.length === 0) {
    return [];
  }

  const { data: runs, error } = await supabase
    .from('runs')
    .select(
      `
      id,
      user_id,
      ${column},
      vehicle_name,
      profiles!runs_user_id_fkey(display_name, avatar_url)
    `
    )
    .in('user_id', userIds)
    .not(column, 'is', null)
    .order(column, { ascending: true });

  if (error) {
    throw error;
  }

  // Filter to only best time per user
  const bestRuns = filterBestPerUser(runs || [], column);

  const entries: LeaderboardEntry[] = bestRuns.map((run: any, index: number) => ({
    rank: index + 1,
    user_id: run.user_id,
    display_name: run.profiles?.display_name || 'Anonymous',
    avatar_url: run.profiles?.avatar_url || null,
    time: run[column],
    vehicle_name: run.vehicle_name,
    is_friend: run.user_id !== user?.id,
  }));

  return entries;
}

export async function getUserBestRun(
  userId: string,
  category: LeaderboardCategory
): Promise<CloudRun | null> {
  const column = CATEGORY_COLUMNS[category];

  const { data, error } = await supabase
    .from('runs')
    .select('*')
    .eq('user_id', userId)
    .not(column, 'is', null)
    .order(column, { ascending: true })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found
      return null;
    }
    throw error;
  }

  return data;
}

export async function getPersonalBests(): Promise<PersonalBests> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      zero_to_sixty: null,
      zero_to_hundred: null,
      quarter_mile: null,
      half_mile: null,
    };
  }

  // Fetch all runs for the current user
  const { data: runs, error } = await supabase
    .from('runs')
    .select('zero_to_sixty_time, zero_to_hundred_time, quarter_mile_time, half_mile_time')
    .eq('user_id', user.id);

  if (error) {
    throw error;
  }

  // Find the best (minimum) time for each category
  const bests: PersonalBests = {
    zero_to_sixty: null,
    zero_to_hundred: null,
    quarter_mile: null,
    half_mile: null,
  };

  for (const run of runs || []) {
    if (run.zero_to_sixty_time !== null) {
      if (bests.zero_to_sixty === null || run.zero_to_sixty_time < bests.zero_to_sixty) {
        bests.zero_to_sixty = run.zero_to_sixty_time;
      }
    }
    if (run.zero_to_hundred_time !== null) {
      if (bests.zero_to_hundred === null || run.zero_to_hundred_time < bests.zero_to_hundred) {
        bests.zero_to_hundred = run.zero_to_hundred_time;
      }
    }
    if (run.quarter_mile_time !== null) {
      if (bests.quarter_mile === null || run.quarter_mile_time < bests.quarter_mile) {
        bests.quarter_mile = run.quarter_mile_time;
      }
    }
    if (run.half_mile_time !== null) {
      if (bests.half_mile === null || run.half_mile_time < bests.half_mile) {
        bests.half_mile = run.half_mile_time;
      }
    }
  }

  return bests;
}
