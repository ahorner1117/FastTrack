import { supabase } from '../lib/supabase';
import { sendPushNotification } from './notificationService';
import type { Profile, Friendship, FriendshipStatus } from '../types';

export interface MatchedContact {
  profile: Profile;
  contactName: string;
}

export async function findUsersFromPhoneHashes(
  phoneHashes: string[]
): Promise<Profile[]> {
  if (phoneHashes.length === 0) return [];

  // Batch requests to avoid URL length limits (100 hashes per request)
  const BATCH_SIZE = 100;
  const results: Profile[] = [];

  for (let i = 0; i < phoneHashes.length; i += BATCH_SIZE) {
    const batch = phoneHashes.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('phone_hash', batch);

    if (error) {
      console.error('Error finding users:', error);
      throw error;
    }

    if (data) {
      results.push(...data);
    }
  }

  return results;
}

export async function sendFriendRequest(friendId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Check if friendship already exists
  const { data: existing } = await supabase
    .from('friendships')
    .select('*')
    .or(
      `and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`
    )
    .maybeSingle();

  if (existing) {
    if (existing.status === 'accepted') {
      throw new Error('You are already friends');
    }
    if (existing.status === 'pending') {
      throw new Error('Friend request already sent');
    }
    // If rejected, allow re-sending by updating status back to pending
    if (existing.status === 'rejected') {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'pending', user_id: user.id, friend_id: friendId })
        .eq('id', existing.id);

      if (error) {
        throw error;
      }

      notifyFriendRequest(friendId, user.id);
      return;
    }
  }

  const { error } = await supabase
    .from('friendships')
    .insert({
      user_id: user.id,
      friend_id: friendId,
      status: 'pending',
    });

  if (error) {
    throw error;
  }

  notifyFriendRequest(friendId, user.id);
}

export async function respondToFriendRequest(
  friendshipId: string,
  status: 'accepted' | 'rejected'
): Promise<Friendship> {
  const { data, error } = await supabase
    .from('friendships')
    .update({ status })
    .eq('id', friendshipId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Notify the original requester when their request is accepted
  if (status === 'accepted') {
    notifyFriendAccepted(data.user_id, data.friend_id);
  }

  return data;
}

export async function removeFriend(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId);

  if (error) {
    throw error;
  }
}

export async function getFriends(): Promise<Friendship[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Get accepted friendships where user is either the requester or recipient
  const { data, error } = await supabase
    .from('friendships')
    .select(
      `
      *,
      friend_profile:profiles!friendships_friend_id_fkey(*),
      user_profile:profiles!friendships_user_id_fkey(*)
    `
    )
    .eq('status', 'accepted')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getPendingFriendRequests(): Promise<Friendship[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Get pending requests where user is the recipient (friend_id)
  const { data, error } = await supabase
    .from('friendships')
    .select(
      `
      *,
      user_profile:profiles!friendships_user_id_fkey(*)
    `
    )
    .eq('status', 'pending')
    .eq('friend_id', user.id);

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getSentFriendRequests(): Promise<Friendship[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Get pending requests where user is the sender (user_id)
  const { data, error } = await supabase
    .from('friendships')
    .select(
      `
      *,
      friend_profile:profiles!friendships_friend_id_fkey(*)
    `
    )
    .eq('status', 'pending')
    .eq('user_id', user.id);

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getFriendIds(): Promise<string[]> {
  const friends = await getFriends();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  return friends.map((f) =>
    f.user_id === user.id ? f.friend_id : f.user_id
  );
}

// Fire-and-forget notification helpers

function notifyFriendRequest(recipientId: string, senderId: string): void {
  getDisplayName(senderId).then((name) => {
    sendPushNotification(
      recipientId,
      'New Friend Request',
      `${name} sent you a friend request`,
      { screen: 'notifications' }
    );
  }).catch(console.error);
}

function notifyFriendAccepted(originalRequesterId: string, accepterId: string): void {
  getDisplayName(accepterId).then((name) => {
    sendPushNotification(
      originalRequesterId,
      'Friend Request Accepted',
      `${name} accepted your friend request`,
      { screen: 'notifications' }
    );
  }).catch(console.error);
}

async function getDisplayName(userId: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('display_name, username')
    .eq('id', userId)
    .single();

  return data?.display_name || data?.username || 'Someone';
}
