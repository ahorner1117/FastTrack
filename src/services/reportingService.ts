import { supabase } from '../lib/supabase';

export async function reportPost(
  postId: string,
  reason: string,
  description?: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase.from('post_reports').insert({
    post_id: postId,
    reported_by: user.id,
    reason,
    description: description || null,
  });

  if (error) {
    throw error;
  }
}

export async function reportComment(
  commentId: string,
  reason: string,
  description?: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase.from('comment_reports').insert({
    comment_id: commentId,
    reported_by: user.id,
    reason,
    description: description || null,
  });

  if (error) {
    throw error;
  }
}
