import { supabase } from '../lib/supabase';
import type { UserProfileData } from '../types';

export async function getUserProfile(userId: string): Promise<UserProfileData> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profileResult, vehiclesResult, postsResult, friendshipResult] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('posts')
        .select(
          'id, image_url, likes_count, comments_count, visibility, created_at, updated_at, user_id, caption, vehicle_id, run_id, drive_id'
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30),
      user
        ? supabase
            .from('friendships')
            .select('id, user_id, friend_id, status')
            .or(
              `and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`
            )
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

  if (profileResult.error) throw profileResult.error;

  let friendshipStatus: UserProfileData['friendshipStatus'] = 'none';
  let friendshipId: string | undefined;

  if (friendshipResult.data) {
    friendshipId = friendshipResult.data.id;
    if (friendshipResult.data.status === 'accepted') {
      friendshipStatus = 'accepted';
    } else if (friendshipResult.data.status === 'pending') {
      friendshipStatus =
        friendshipResult.data.user_id === user?.id
          ? 'pending_sent'
          : 'pending_received';
    }
  }

  return {
    profile: profileResult.data,
    vehicles: vehiclesResult.data || [],
    posts: (postsResult.data || []) as UserProfileData['posts'],
    postsCount: postsResult.data?.length || 0,
    friendshipStatus,
    friendshipId,
  };
}
