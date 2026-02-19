import { supabase } from '../lib/supabase';
import type { UserSearchResult, VehicleSearchResult } from '../types';

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

export async function searchVehicles(
  query: string,
  limit = 20
): Promise<VehicleSearchResult[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select(
      `
      id, user_id, name, year, make, model, trim, photo_uri,
      profile:profiles!vehicles_user_id_fkey(display_name, username)
    `
    )
    .or(`make.ilike.%${query}%,model.ilike.%${query}%,trim.ilike.%${query}%,name.ilike.%${query}%`)
    .order('year', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error searching vehicles:', error);
    throw error;
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    year: row.year,
    make: row.make,
    model: row.model,
    trim: row.trim,
    photo_uri: row.photo_uri,
    owner_display_name: row.profile?.display_name ?? null,
    owner_username: row.profile?.username ?? null,
  }));
}
