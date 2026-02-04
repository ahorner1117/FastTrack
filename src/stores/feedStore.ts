import { create } from 'zustand';
import type { Post, PostComment } from '../types';
import {
  getPosts,
  getPost,
  createPost,
  deletePost,
  likePost,
  unlikePost,
  getComments,
  addComment,
  deleteComment,
  type FeedScope,
} from '../services/postsService';
import { uploadPostImage, deletePostImage } from '../services/postImageService';

interface FeedState {
  posts: Post[];
  scope: FeedScope;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  hasMore: boolean;

  // Current post detail
  currentPost: Post | null;
  comments: PostComment[];
  isLoadingComments: boolean;

  // Actions
  setScope: (scope: FeedScope) => void;
  fetchPosts: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;

  // Post actions
  fetchPost: (postId: string) => Promise<void>;
  createNewPost: (
    localImageUri: string,
    caption?: string,
    vehicleId?: string,
    runId?: string
  ) => Promise<Post>;
  removePost: (postId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;

  // Comment actions
  fetchComments: (postId: string) => Promise<void>;
  postComment: (postId: string, content: string) => Promise<void>;
  removeComment: (commentId: string) => Promise<void>;

  reset: () => void;
}

const PAGE_SIZE = 20;

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  scope: 'global',
  isLoading: false,
  isRefreshing: false,
  error: null,
  hasMore: true,

  currentPost: null,
  comments: [],
  isLoadingComments: false,

  setScope: (scope: FeedScope) => {
    set({ scope, posts: [], hasMore: true });
    get().fetchPosts();
  },

  fetchPosts: async () => {
    const { scope } = get();
    set({ isLoading: true, error: null });

    try {
      const posts = await getPosts(scope, PAGE_SIZE, 0);
      set({
        posts,
        hasMore: posts.length === PAGE_SIZE,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  loadMore: async () => {
    const { scope, posts, isLoading, hasMore } = get();
    if (isLoading || !hasMore) return;

    set({ isLoading: true });

    try {
      const newPosts = await getPosts(scope, PAGE_SIZE, posts.length);
      set({
        posts: [...posts, ...newPosts],
        hasMore: newPosts.length === PAGE_SIZE,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  refresh: async () => {
    const { scope } = get();
    set({ isRefreshing: true, error: null });

    try {
      const posts = await getPosts(scope, PAGE_SIZE, 0);
      set({
        posts,
        hasMore: posts.length === PAGE_SIZE,
        isRefreshing: false,
      });
    } catch (error: any) {
      set({ error: error.message, isRefreshing: false });
    }
  },

  fetchPost: async (postId: string) => {
    set({ isLoading: true, error: null });

    try {
      const post = await getPost(postId);
      set({ currentPost: post, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createNewPost: async (
    localImageUri: string,
    caption?: string,
    vehicleId?: string,
    runId?: string
  ) => {
    // Generate a temporary ID for the image upload
    const tempId = `temp-${Date.now()}`;

    // Upload image first
    const { url, error: uploadError } = await uploadPostImage(
      localImageUri,
      tempId
    );

    if (uploadError || !url) {
      throw new Error(uploadError?.message || 'Failed to upload image');
    }

    try {
      // Create the post
      const post = await createPost({
        image_url: url,
        caption,
        vehicle_id: vehicleId,
        run_id: runId,
      });

      // Add to the beginning of posts list
      set((state) => ({
        posts: [post, ...state.posts],
      }));

      return post;
    } catch (error) {
      // Clean up uploaded image if post creation fails
      await deletePostImage(tempId);
      throw error;
    }
  },

  removePost: async (postId: string) => {
    try {
      await deletePost(postId);
      await deletePostImage(postId);

      set((state) => ({
        posts: state.posts.filter((p) => p.id !== postId),
        currentPost:
          state.currentPost?.id === postId ? null : state.currentPost,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  toggleLike: async (postId: string) => {
    const { posts, currentPost } = get();
    const post = posts.find((p) => p.id === postId) || currentPost;

    if (!post) return;

    const wasLiked = post.is_liked;

    // Optimistic update
    const updatePost = (p: Post): Post => ({
      ...p,
      is_liked: !wasLiked,
      likes_count: p.likes_count + (wasLiked ? -1 : 1),
    });

    set((state) => ({
      posts: state.posts.map((p) => (p.id === postId ? updatePost(p) : p)),
      currentPost:
        state.currentPost?.id === postId
          ? updatePost(state.currentPost)
          : state.currentPost,
    }));

    try {
      if (wasLiked) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }
    } catch (error) {
      // Revert on error
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                is_liked: wasLiked,
                likes_count: p.likes_count + (wasLiked ? 1 : -1),
              }
            : p
        ),
        currentPost:
          state.currentPost?.id === postId
            ? {
                ...state.currentPost,
                is_liked: wasLiked,
                likes_count: state.currentPost.likes_count + (wasLiked ? 1 : -1),
              }
            : state.currentPost,
      }));
      throw error;
    }
  },

  fetchComments: async (postId: string) => {
    set({ isLoadingComments: true });

    try {
      const comments = await getComments(postId);
      set({ comments, isLoadingComments: false });
    } catch (error: any) {
      set({ error: error.message, isLoadingComments: false });
    }
  },

  postComment: async (postId: string, content: string) => {
    try {
      const comment = await addComment(postId, content);
      set((state) => ({
        comments: [...state.comments, comment],
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
        ),
        currentPost:
          state.currentPost?.id === postId
            ? {
                ...state.currentPost,
                comments_count: state.currentPost.comments_count + 1,
              }
            : state.currentPost,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  removeComment: async (commentId: string) => {
    const { comments, currentPost } = get();
    const comment = comments.find((c) => c.id === commentId);

    if (!comment) return;

    try {
      await deleteComment(commentId);
      set((state) => ({
        comments: state.comments.filter((c) => c.id !== commentId),
        posts: state.posts.map((p) =>
          p.id === comment.post_id
            ? { ...p, comments_count: Math.max(0, p.comments_count - 1) }
            : p
        ),
        currentPost:
          state.currentPost?.id === comment.post_id
            ? {
                ...state.currentPost,
                comments_count: Math.max(
                  0,
                  state.currentPost.comments_count - 1
                ),
              }
            : state.currentPost,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  reset: () =>
    set({
      posts: [],
      scope: 'global',
      isLoading: false,
      isRefreshing: false,
      error: null,
      hasMore: true,
      currentPost: null,
      comments: [],
      isLoadingComments: false,
    }),
}));
