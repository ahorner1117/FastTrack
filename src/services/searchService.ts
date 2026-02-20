import { supabase } from '../lib/supabase';
import type { UserSearchResult, VehicleSearchResult } from '../types';

export async function searchUsers(
  query: string,
  limit = 20
): Promise<UserSearchResult[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .or(`display_name.ilike.*${query}*,username.ilike.*${query}*,bio.ilike.*${query}*`)
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
    .select('id, user_id, name, year, make, model, trim, photo_uri')
    .or(`make.ilike.*${query}*,model.ilike.*${query}*,trim.ilike.*${query}*,name.ilike.*${query}*`)
    .order('year', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error searching vehicles:', error);
    throw error;
  }

  const vehicles = (data || []) as Array<{
    id: string;
    user_id: string;
    name: string;
    year: number;
    make: string;
    model: string;
    trim: string | null;
    photo_uri: string | null;
  }>;

  // Fetch owner profiles for the vehicle results
  const userIds = [...new Set(vehicles.map((v) => v.user_id))];
  const profileMap = new Map<string, { display_name: string | null; username: string | null }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, username')
      .in('id', userIds);

    for (const p of profiles || []) {
      profileMap.set(p.id, { display_name: p.display_name, username: p.username });
    }
  }

  return vehicles.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    year: row.year,
    make: row.make,
    model: row.model,
    trim: row.trim,
    photo_uri: row.photo_uri,
    owner_display_name: profileMap.get(row.user_id)?.display_name ?? null,
    owner_username: profileMap.get(row.user_id)?.username ?? null,
  }));
}
