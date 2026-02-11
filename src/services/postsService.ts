import { supabase } from '../lib/supabase';
import type { Post, PostComment, CreatePostInput, PostVisibility } from '../types';

export type FeedScope = 'global' | 'friends';

export async function getPosts(
  scope: FeedScope,
  limit = 20,
  offset = 0,
  visibilityFilter?: PostVisibility
): Promise<Post[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from('posts')
    .select(
      `
      *,
      profile:profiles!posts_user_id_fkey(id, display_name, avatar_url),
      run:runs(zero_to_sixty_time, vehicle_name)
    `
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (visibilityFilter) {
    query = query.eq('visibility', visibilityFilter);
  }

  if (scope === 'friends' && user) {
    // Get friend IDs first
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted');

    const friendIds = new Set<string>();
    friendships?.forEach((f) => {
      if (f.user_id === user.id) {
        friendIds.add(f.friend_id);
      } else {
        friendIds.add(f.user_id);
      }
    });

    // Include own posts in friends feed
    friendIds.add(user.id);

    if (friendIds.size === 0) {
      return [];
    }

    query = query.in('user_id', Array.from(friendIds));
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }

  // Check which posts the current user has liked
  if (user && data && data.length > 0) {
    const postIds = data.map((p) => p.id);
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds);

    const likedPostIds = new Set(likes?.map((l) => l.post_id) || []);

    return data.map((post) => ({
      ...post,
      is_liked: likedPostIds.has(post.id),
    }));
  }

  return data || [];
}

export async function getPost(postId: string): Promise<Post | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      profile:profiles!posts_user_id_fkey(id, display_name, avatar_url),
      run:runs(zero_to_sixty_time, vehicle_name)
    `
    )
    .eq('id', postId)
    .single();

  if (error) {
    console.error('Error fetching post:', error);
    throw error;
  }

  if (!data) return null;

  // Check if current user has liked this post
  if (user) {
    const { data: like } = await supabase
      .from('post_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .single();

    return { ...data, is_liked: !!like };
  }

  return data;
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      image_url: input.image_url,
      caption: input.caption || null,
      vehicle_id: input.vehicle_id || null,
      run_id: input.run_id || null,
      drive_id: input.drive_id || null,
      visibility: input.visibility || 'public',
    })
    .select(
      `
      *,
      profile:profiles!posts_user_id_fkey(id, display_name, avatar_url)
    `
    )
    .single();

  if (error) {
    console.error('Error creating post:', error);
    throw error;
  }

  return data;
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', postId);

  if (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

export async function likePost(postId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase.from('post_likes').insert({
    post_id: postId,
    user_id: user.id,
  });

  if (error && error.code !== '23505') {
    // Ignore duplicate key error
    console.error('Error liking post:', error);
    throw error;
  }
}

export async function unlikePost(postId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error unliking post:', error);
    throw error;
  }
}

export async function getComments(
  postId: string,
  limit = 50,
  offset = 0
): Promise<PostComment[]> {
  const { data, error } = await supabase
    .from('post_comments')
    .select(
      `
      *,
      profile:profiles!post_comments_user_id_fkey(id, display_name, avatar_url)
    `
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }

  return data || [];
}

export async function addComment(
  postId: string,
  content: string
): Promise<PostComment> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      content,
    })
    .select(
      `
      *,
      profile:profiles!post_comments_user_id_fkey(id, display_name, avatar_url)
    `
    )
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    throw error;
  }

  return data;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}

export async function getUserPosts(
  userId: string,
  limit = 30,
  offset = 0
): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('id, image_url, likes_count, comments_count, visibility, created_at, updated_at, user_id, caption, vehicle_id, run_id, drive_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching user posts:', error);
    throw error;
  }

  return (data || []) as Post[];
}
