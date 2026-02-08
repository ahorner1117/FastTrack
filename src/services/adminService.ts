import { supabase } from '../lib/supabase';
import type {
  Profile,
  CloudRun,
  CloudVehicle,
  Post,
  AdminUserDetailFull,
  UpdateProfileInput,
  BanUserInput,
  HideContentInput,
  PostReport,
  CommentReport,
} from '../types';

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

// ============================================================================
// Enhanced User Detail
// ============================================================================

export async function getUserDetailFull(
  userId: string
): Promise<AdminUserDetailFull> {
  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    throw profileError;
  }

  // Fetch runs
  const { data: runs, error: runsError } = await supabase
    .from('runs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (runsError) {
    throw runsError;
  }

  // Fetch vehicles
  const { data: vehicles, error: vehiclesError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false});

  if (vehiclesError) {
    throw vehiclesError;
  }

  // Fetch posts
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (postsError) {
    throw postsError;
  }

  // Fetch comment count
  const { count: commentCount, error: commentCountError } = await supabase
    .from('post_comments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (commentCountError) {
    throw commentCountError;
  }

  // Count flagged posts (posts with reports)
  const postIds = posts?.map((p) => p.id) || [];
  let flaggedPostIds = new Set<string>();
  
  if (postIds.length > 0) {
    const { data: reportedPosts, error: reportsError } = await supabase
      .from('post_reports')
      .select('post_id')
      .in('post_id', postIds)
      .eq('status', 'pending');

    if (!reportsError && reportedPosts) {
      flaggedPostIds = new Set(reportedPosts.map((r) => r.post_id));
    }
  }

  return {
    profile,
    runs: runs || [],
    vehicles: vehicles || [],
    posts: posts || [],
    stats: {
      total_runs: runs?.length || 0,
      total_vehicles: vehicles?.length || 0,
      total_posts: posts?.length || 0,
      total_comments: commentCount || 0,
      flagged_posts: flaggedPostIds.size,
    },
  };
}

// ============================================================================
// Profile Management
// ============================================================================

export async function updateUserProfile(
  userId: string,
  updates: UpdateProfileInput
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  await logAdminAction('update_profile', 'user', userId, 'Profile updated');
  return data;
}

export async function banUser(
  userId: string,
  input: BanUserInput
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      is_banned: true,
      ban_reason: input.reason,
      banned_at: new Date().toISOString(),
      banned_by: user.id,
    })
    .eq('id', userId);

  if (error) {
    throw error;
  }

  await logAdminAction('ban_user', 'user', userId, input.reason);
}

export async function unbanUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_banned: false,
      ban_reason: null,
      banned_at: null,
      banned_by: null,
    })
    .eq('id', userId);

  if (error) {
    throw error;
  }

  await logAdminAction('unban_user', 'user', userId, 'User unbanned');
}

export async function removeUserAvatar(
  userId: string,
  reason: string
): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .single();

  if (profile?.avatar_url) {
    try {
      const url = new URL(profile.avatar_url);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/(.+)/);
      if (pathMatch) {
        const filePath = pathMatch[1];
        await supabase.storage.from('avatars').remove([filePath]).catch(() => {});
      }
    } catch (e) {
      // Invalid URL, skip storage deletion
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', userId);

  if (error) {
    throw error;
  }

  await logAdminAction('remove_avatar', 'user', userId, reason);
}

// ============================================================================
// Content Retrieval
// ============================================================================

export async function getUserVehicles(
  userId: string
): Promise<CloudVehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      profile:profiles!posts_user_id_fkey(id, display_name, avatar_url)
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

// ============================================================================
// Post Moderation
// ============================================================================

export async function hidePost(
  postId: string,
  input: HideContentInput
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('posts')
    .update({
      is_hidden: true,
      hidden_reason: input.reason,
      hidden_at: new Date().toISOString(),
      hidden_by: user.id,
    })
    .eq('id', postId);

  if (error) {
    throw error;
  }

  await logAdminAction('hide_post', 'post', postId, input.reason);
}

export async function unhidePost(postId: string): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .update({
      is_hidden: false,
      hidden_reason: null,
      hidden_at: null,
      hidden_by: null,
    })
    .eq('id', postId);

  if (error) {
    throw error;
  }

  await logAdminAction('unhide_post', 'post', postId, 'Post unhidden');
}

export async function deletePost(
  postId: string,
  reason: string
): Promise<void> {
  const { data: post } = await supabase
    .from('posts')
    .select('image_url')
    .eq('id', postId)
    .single();

  if (post?.image_url) {
    try {
      const url = new URL(post.image_url);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/(.+)/);
      if (pathMatch) {
        const filePath = pathMatch[1];
        await supabase.storage
          .from('post-images')
          .remove([filePath])
          .catch(() => {});
      }
    } catch (e) {
      // Invalid URL, skip storage deletion
    }
  }

  const { error } = await supabase.from('posts').delete().eq('id', postId);

  if (error) {
    throw error;
  }

  await logAdminAction('delete_post', 'post', postId, reason);
}

// ============================================================================
// Comment Moderation
// ============================================================================

export async function hideComment(
  commentId: string,
  input: HideContentInput
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('post_comments')
    .update({
      is_hidden: true,
      hidden_reason: input.reason,
      hidden_at: new Date().toISOString(),
      hidden_by: user.id,
    })
    .eq('id', commentId);

  if (error) {
    throw error;
  }

  await logAdminAction('hide_comment', 'comment', commentId, input.reason);
}

export async function unhideComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('post_comments')
    .update({
      is_hidden: false,
      hidden_reason: null,
      hidden_at: null,
      hidden_by: null,
    })
    .eq('id', commentId);

  if (error) {
    throw error;
  }

  await logAdminAction('unhide_comment', 'comment', commentId, 'Comment unhidden');
}

export async function deleteComment(
  commentId: string,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    throw error;
  }

  await logAdminAction('delete_comment', 'comment', commentId, reason);
}

// ============================================================================
// Run & Vehicle Deletion
// ============================================================================

export async function deleteRun(runId: string, reason: string): Promise<void> {
  const { error } = await supabase.from('runs').delete().eq('id', runId);

  if (error) {
    throw error;
  }

  await logAdminAction('delete_run', 'run', runId, reason);
}

export async function deleteVehicle(
  vehicleId: string,
  reason: string
): Promise<void> {
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('photo_uri')
    .eq('id', vehicleId)
    .single();

  if (vehicle?.photo_uri) {
    try {
      const url = new URL(vehicle.photo_uri);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/(.+)/);
      if (pathMatch) {
        const filePath = pathMatch[1];
        await supabase.storage
          .from('vehicle-images')
          .remove([filePath])
          .catch(() => {});
      }
    } catch (e) {
      // Invalid URL, skip storage deletion
    }
  }

  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', vehicleId);

  if (error) {
    throw error;
  }

  await logAdminAction('delete_vehicle', 'vehicle', vehicleId, reason);
}

// ============================================================================
// Reports Management
// ============================================================================

export async function getPendingPostReports(): Promise<PostReport[]> {
  const { data, error } = await supabase
    .from('post_reports')
    .select(
      `
      *,
      post:posts(*),
      reporter_profile:profiles!post_reports_reported_by_profiles_fkey(id, display_name, avatar_url)
    `
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getPendingCommentReports(): Promise<CommentReport[]> {
  const { data, error } = await supabase
    .from('comment_reports')
    .select(
      `
      *,
      comment:post_comments(*),
      reporter_profile:profiles!comment_reports_reported_by_profiles_fkey(id, display_name, avatar_url)
    `
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function dismissReport(
  reportId: string,
  type: 'post' | 'comment'
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const table = type === 'post' ? 'post_reports' : 'comment_reports';

  const { error } = await supabase
    .from(table)
    .update({
      status: 'dismissed',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) {
    throw error;
  }
}

export async function markReportReviewed(
  reportId: string,
  type: 'post' | 'comment'
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const table = type === 'post' ? 'post_reports' : 'comment_reports';

  const { error } = await supabase
    .from(table)
    .update({
      status: 'reviewed',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) {
    throw error;
  }
}

// ============================================================================
// Admin Action Logging
// ============================================================================

export async function logAdminAction(
  actionType: string,
  targetType: string,
  targetId: string,
  reason?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return; // Silently fail if not authenticated
  }

  const { error } = await supabase.from('admin_actions').insert({
    admin_user_id: user.id,
    action_type: actionType,
    target_type: targetType,
    target_id: targetId,
    reason: reason || null,
    metadata: metadata || null,
  });

  if (error) {
    console.error('Failed to log admin action:', error);
  }
}
