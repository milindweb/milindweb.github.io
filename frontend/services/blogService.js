// MK9 Project - Blog API Service
// Frontend service for consuming blog-related APIs and functions
// Path: frontend/services/blogService.js

import { supabase } from '../config/supabase';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';

class BlogService {
  // ============================================================
  // POSTS OPERATIONS
  // ============================================================

  /**
   * Fetch all published blog posts with pagination
   * @param {number} page - Page number (default 1)
   * @param {number} limit - Posts per page (default 10)
   * @param {string} category - Filter by category slug (optional)
   * @returns {Promise<Object>} - Posts and pagination metadata
   */
  static async getPosts(page = 1, limit = 10, category = null) {
    try {
      let query = supabase
        .from('blog_posts')
        .select(
          `
          id,
          title,
          slug,
          excerpt,
          featured_image_url,
          views_count,
          published_at,
          author_id,
          users_profile!author_id(full_name, avatar_url),
          blog_categories!category_id(name, slug),
          comment_count:blog_comments(count)
          `,
          { count: 'exact' }
        )
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (category) {
        query = query.eq('blog_categories.slug', category);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        posts: data,
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      };
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  /**
   * Fetch single blog post by slug with full content
   * @param {string} slug - Post slug
   * @returns {Promise<Object>} - Full post data with comments
   */
  static async getPostBySlug(slug) {
    try {
      // Increment view count
      const { data: post } = await supabase
        .from('blog_posts')
        .select(
          `
          *,
          users_profile!author_id(id, full_name, avatar_url, bio),
          blog_categories(name, slug),
          blog_comments(
            id,
            comment,
            created_at,
            users_profile!user_id(full_name, avatar_url)
          )
          `
        )
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (!post) throw new Error('Post not found');

      // Update view count (non-blocking)
      supabase
        .from('blog_posts')
        .update({ views_count: post.views_count + 1 })
        .eq('id', post.id)
        .then();

      return post;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  }

  /**
   * Create a new blog post (author only)
   * @param {Object} postData - Post data { title, content, excerpt, category_id, featured_image_url }
   * @returns {Promise<Object>} - Created post
   */
  static async createPost(postData) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate slug from title
      const slug = postData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          author_id: user.id,
          title: postData.title,
          slug: slug + '-' + Date.now(), // Ensure unique slug
          content: postData.content,
          excerpt: postData.excerpt,
          category_id: postData.category_id,
          featured_image_url: postData.featured_image_url,
          status: 'draft',
        })
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * Update blog post (author only)
   * @param {string} postId - Post ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} - Updated post
   */
  static async updatePost(postId, updates) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', postId)
        .eq('author_id', user.id) // Ensure author can only update own post
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  /**
   * Publish a blog post (changes status from draft to published)
   * @param {string} postId - Post ID
   * @returns {Promise<Object>} - Published post
   */
  static async publishPost(postId) {
    try {
      return await this.updatePost(postId, {
        status: 'published',
        published_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error publishing post:', error);
      throw error;
    }
  }

  /**
   * Delete blog post (author only)
   * @param {string} postId - Post ID
   * @returns {Promise<void>}
   */
  static async deletePost(postId) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId)
        .eq('author_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  // ============================================================
  // COMMENTS OPERATIONS
  // ============================================================

  /**
   * Add comment to blog post
   * @param {string} postId - Post ID
   * @param {string} comment - Comment text
   * @returns {Promise<Object>} - Created comment
   */
  static async addComment(postId, comment) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('blog_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          comment: comment,
          status: 'pending', // Requires approval
        })
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Get approved comments for a post
   * @param {string} postId - Post ID
   * @returns {Promise<Array>} - Comments
   */
  static async getComments(postId) {
    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .select(
          `
          id,
          comment,
          created_at,
          users_profile!user_id(full_name, avatar_url)
          `
        )
        .eq('post_id', postId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  // ============================================================
  // CATEGORIES OPERATIONS
  // ============================================================

  /**
   * Fetch all blog categories
   * @returns {Promise<Array>} - Categories
   */
  static async getCategories() {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // ============================================================
  // STORAGE OPERATIONS
  // ============================================================

  /**
   * Upload featured image for blog post
   * @param {File} file - Image file
   * @param {string} postId - Post ID (for organizing files)
   * @returns {Promise<string>} - Public URL of uploaded image
   */
  static async uploadFeaturedImage(file, postId) {
    try {
      const fileName = `featured-${postId}-${Date.now()}-${file.name}`;

      const { data, error } = await supabase.storage
        .from('blog')
        .upload(`featured/${fileName}`, file);

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('blog').getPublicUrl(`featured/${fileName}`);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Delete featured image from storage
   * @param {string} imagePath - Storage path to image
   * @returns {Promise<void>}
   */
  static async deleteFeaturedImage(imagePath) {
    try {
      const { error } = await supabase.storage
        .from('blog')
        .remove([imagePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  // ============================================================
  // SEARCH & FILTERS
  // ============================================================

  /**
   * Search blog posts
   * @param {string} searchTerm - Search keyword
   * @returns {Promise<Array>} - Matching posts
   */
  static async searchPosts(searchTerm) {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(
          `
          id,
          title,
          slug,
          excerpt,
          published_at
          `
        )
        .eq('status', 'published')
        .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
        .order('published_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching posts:', error);
      throw error;
    }
  }
}

export default BlogService;
