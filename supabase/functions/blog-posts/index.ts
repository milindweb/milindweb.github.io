// MK9 Project - Blog Posts Edge Function
// Supabase Edge Function for handling blog CRUD operations
// Path: backend/modules/blog/functions/blog-posts.ts
// Deploy: supabase functions deploy blog-posts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { method, url } = req;
    const path = new URL(url).pathname;

    // Route handling
    if (method === "GET" && path === "/functions/v1/blog-posts") {
      return await handleGetPosts(req, supabase);
    }

    if (method === "POST" && path === "/functions/v1/blog-posts") {
      return await handleCreatePost(req, supabase);
    }

    if (method === "PUT" && path.includes("/functions/v1/blog-posts/")) {
      return await handleUpdatePost(req, supabase, path);
    }

    if (method === "DELETE" && path.includes("/functions/v1/blog-posts/")) {
      return await handleDeletePost(req, supabase, path);
    }

    return new Response(
      JSON.stringify({ error: "Route not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * GET /blog-posts?page=1&limit=10&category=slug
 * Fetch paginated published posts
 */
async function handleGetPosts(req: Request, supabase: any) {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");
  const category = url.searchParams.get("category");

  let query = supabase
    .from("blog_posts")
    .select(
      `
      id,
      title,
      slug,
      excerpt,
      featured_image_url,
      views_count,
      published_at,
      users_profile!author_id(full_name, avatar_url),
      blog_categories(name, slug)
      `,
      { count: "exact" }
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (category) {
    query = query.eq("blog_categories.slug", category);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return new Response(
    JSON.stringify({
      posts: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

/**
 * POST /blog-posts
 * Create new blog post (requires auth)
 */
async function handleCreatePost(req: Request, supabase: any) {
  // Verify authentication
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing authorization header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check user role
  const { data: profile } = await supabase
    .from("users_profile")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!["admin", "blogger"].includes(profile?.role)) {
    return new Response(
      JSON.stringify({ error: "Insufficient permissions" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const body = await req.json();
  const { title, content, excerpt, category_id, featured_image_url } = body;

  // Validate required fields
  if (!title || !content) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: title, content" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Generate slug
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") + "-" + Date.now();

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      author_id: user.id,
      title,
      slug,
      content,
      excerpt: excerpt || content.substring(0, 200),
      category_id,
      featured_image_url,
      status: "draft",
    })
    .select();

  if (error) throw error;

  return new Response(JSON.stringify(data[0]), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * PUT /blog-posts/:id
 * Update blog post (author or admin only)
 */
async function handleUpdatePost(req: Request, supabase: any, path: string) {
  const postId = path.split("/").pop();
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing authorization header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (!user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check post ownership
  const { data: post } = await supabase
    .from("blog_posts")
    .select("author_id")
    .eq("id", postId)
    .single();

  if (!post) {
    return new Response(
      JSON.stringify({ error: "Post not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: profile } = await supabase
    .from("users_profile")
    .select("role")
    .eq("id", user.id)
    .single();

  if (post.author_id !== user.id && profile?.role !== "admin") {
    return new Response(
      JSON.stringify({ error: "Insufficient permissions" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const body = await req.json();
  const updates = {
    ...body,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("blog_posts")
    .update(updates)
    .eq("id", postId)
    .select();

  if (error) throw error;

  return new Response(JSON.stringify(data[0]), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * DELETE /blog-posts/:id
 * Delete blog post (author or admin only)
 */
async function handleDeletePost(req: Request, supabase: any, path: string) {
  const postId = path.split("/").pop();
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing authorization header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (!user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check post ownership
  const { data: post } = await supabase
    .from("blog_posts")
    .select("author_id")
    .eq("id", postId)
    .single();

  if (!post) {
    return new Response(
      JSON.stringify({ error: "Post not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: profile } = await supabase
    .from("users_profile")
    .select("role")
    .eq("id", user.id)
    .single();

  if (post.author_id !== user.id && profile?.role !== "admin") {
    return new Response(
      JSON.stringify({ error: "Insufficient permissions" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { error } = await supabase
    .from("blog_posts")
    .delete()
    .eq("id", postId);

  if (error) throw error;

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
