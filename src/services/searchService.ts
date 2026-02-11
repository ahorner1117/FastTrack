import { supabase } from '../lib/supabase';
import type { Post, UserSearchResult } from '../types';

export async function searchUsers(
  query: string,
  limit = 20
): Promise<UserSearchResult[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
    .limit(limit);

  if (error) {
    console.error('Error searching users:', error);
    throw error;
  }

  return (data || []) as UserSearchResult[];
}

export async function searchPostsByVehicle(
  query: string,
  limit = 30,
  offset = 0
): Promise<Post[]> {
  // Search for public posts that have a run with a matching vehicle_name
  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      profile:profiles!posts_user_id_fkey(id, display_name, avatar_url),
      run:runs!inner(zero_to_sixty_time, vehicle_name)
    `
    )
    .eq('visibility', 'public')
    .ilike('run.vehicle_name', `%${query}%`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error searching posts by vehicle:', error);
    throw error;
  }

  return (data || []) as Post[];
}
