import { supabase } from '../lib/supabase';

export async function resolveUsernames(
  usernames: string[]
): Promise<Map<string, string>> {
  if (usernames.length === 0) return new Map();

  const lowerUsernames = usernames.map((u) => u.toLowerCase());

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .in('username', lowerUsernames);

  if (error) {
    console.error('Error resolving usernames:', error);
    return new Map();
  }

  const map = new Map<string, string>();
  (data || []).forEach((row: { id: string; username: string }) => {
    map.set(row.username.toLowerCase(), row.id);
  });

  return map;
}
