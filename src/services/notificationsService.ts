import { supabase } from '../lib/supabase';
import type { NotificationItem } from '../types';

export async function getNotifications(): Promise<NotificationItem[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const [friendRequests, likes, comments] = await Promise.all([
    fetchFriendRequests(user.id),
    fetchLikes(user.id),
    fetchComments(user.id),
  ]);

  const all = [...friendRequests, ...likes, ...comments];
  all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return all;
}

async function fetchFriendRequests(userId: string): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('id, created_at, user_id, user_profile:profiles!friendships_user_id_fkey(id, display_name, avatar_url)')
    .eq('friend_id', userId)
    .eq('status', 'pending');

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: `fr_${row.id}`,
    type: 'friend_request' as const,
    created_at: row.created_at,
    actor_id: row.user_id,
    actor_display_name: row.user_profile?.display_name || 'Unknown',
    actor_avatar_url: row.user_profile?.avatar_url || null,
    friendship_id: row.id,
  }));
}

async function fetchLikes(userId: string): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from('post_likes')
    .select('id, created_at, user_id, post_id, posts!inner(id, user_id, image_url), liker:profiles!post_likes_user_id_fkey(id, display_name, avatar_url)')
    .eq('posts.user_id', userId)
    .neq('user_id', userId);

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: `like_${row.id}`,
    type: 'like' as const,
    created_at: row.created_at,
    actor_id: row.user_id,
    actor_display_name: row.liker?.display_name || 'Unknown',
    actor_avatar_url: row.liker?.avatar_url || null,
    post_id: row.post_id,
    post_image_url: row.posts?.image_url || null,
  }));
}

async function fetchComments(userId: string): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from('post_comments')
    .select('id, created_at, user_id, post_id, content, posts!inner(id, user_id, image_url), commenter:profiles!post_comments_user_id_fkey(id, display_name, avatar_url)')
    .eq('posts.user_id', userId)
    .neq('user_id', userId);

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: `comment_${row.id}`,
    type: 'comment' as const,
    created_at: row.created_at,
    actor_id: row.user_id,
    actor_display_name: row.commenter?.display_name || 'Unknown',
    actor_avatar_url: row.commenter?.avatar_url || null,
    post_id: row.post_id,
    post_image_url: row.posts?.image_url || null,
    comment_content: row.content,
  }));
}
