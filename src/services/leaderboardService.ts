import { supabase } from '../lib/supabase';
import { getFriendIds } from './friendsService';
import type { LeaderboardCategory, LeaderboardEntry, CloudRun } from '../types';

const CATEGORY_COLUMNS: Record<LeaderboardCategory, string> = {
  zero_to_sixty: 'zero_to_sixty_time',
  zero_to_hundred: 'zero_to_hundred_time',
  quarter_mile: 'quarter_mile_time',
  half_mile: 'half_mile_time',
};

export async function getLeaderboard(
  category: LeaderboardCategory,
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  const column = CATEGORY_COLUMNS[category];

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
    .limit(limit);

  if (error) {
    throw error;
  }

  // Get current user's friend IDs
  let friendIds: string[] = [];
  try {
    friendIds = await getFriendIds();
  } catch {
    // User might not be authenticated
  }

  const friendIdSet = new Set(friendIds);

  const entries: LeaderboardEntry[] = (runs || []).map((run: any, index: number) => ({
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

  if (friendIds.length === 0) {
    return [];
  }

  // Include current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userIds = user ? [...friendIds, user.id] : friendIds;

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

  const entries: LeaderboardEntry[] = (runs || []).map((run: any, index: number) => ({
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
