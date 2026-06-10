-- MK9 Project - Row Level Security (RLS) Policies
-- Detailed RLS policies for each module
-- These policies are embedded in schema.sql but documented here for reference

-- ============================================================
-- USERS PROFILE - RLS POLICIES
-- ============================================================

-- Policy: Users can view their own profile
-- Allows users to see their own profile data
CREATE POLICY "users_view_own_profile"
  ON public.users_profile
  FOR SELECT
  USING (
    auth.uid() = id 
    OR EXISTS (
      SELECT 1 FROM public.users_profile 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Users can update their own profile
-- Allows users to edit their own profile data only
CREATE POLICY "users_update_own_profile"
  ON public.users_profile
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- BLOG MODULE - RLS POLICIES
-- ============================================================

-- Policy: Published posts are viewable by all
-- Allows public viewing of published posts; authors can view their drafts
CREATE POLICY "blog_posts_public_read"
  ON public.blog_posts
  FOR SELECT
  USING (
    status = 'published'
    OR author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users_profile 
      WHERE id = auth.uid() AND role IN ('admin', 'blogger')
    )
  );

-- Policy: Bloggers and admins can create posts
CREATE POLICY "blog_posts_insert"
  ON public.blog_posts
  FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users_profile 
      WHERE id = auth.uid() AND role IN ('admin', 'blogger')
    )
  );

-- Policy: Authors and admins can update posts
CREATE POLICY "blog_posts_update"
  ON public.blog_posts
  FOR UPDATE
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users_profile 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Authors and admins can delete posts
CREATE POLICY "blog_posts_delete"
  ON public.blog_posts
  FOR DELETE
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users_profile 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Comments on published posts are viewable
CREATE POLICY "blog_comments_read"
  ON public.blog_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.blog_posts 
      WHERE id = post_id AND status = 'published'
    )
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users_profile 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Authenticated users can comment on published posts
CREATE POLICY "blog_comments_create"
  ON public.blog_comments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.blog_posts 
      WHERE id = post_id AND status = 'published'
    )
  );

-- Policy: Comment authors and admins can modify comments
CREATE POLICY "blog_comments_update"
  ON public.blog_comments
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users_profile 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- HOSPITAL MODULE - RLS POLICIES
-- ============================================================

-- Policy: Users can view their own appointments
CREATE POLICY "hospital_appointments_read"
  ON public.hospital_appointments
  FOR SELECT
  USING (
    patient_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.hospital_doctors 
      WHERE id = doctor_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users_profile 
      WHERE id = auth.uid() AND role IN ('admin', 'hospital_admin')
    )
  );

-- Policy: Patients can book appointments
CREATE POLICY "hospital_appointments_create"
  ON public.hospital_appointments
  FOR INSERT
  WITH CHECK (patient_id = auth.uid());

-- Policy: Patients and doctors can update their appointments
CREATE POLICY "hospital_appointments_update"
  ON public.hospital_appointments
  FOR UPDATE
  USING (
    patient_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.hospital_doctors 
      WHERE id = doctor_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users_profile 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Doctors and hospital admins can be viewed
CREATE POLICY "hospital_doctors_read"
  ON public.hospital_doctors
  FOR SELECT
  USING (
    status = 'active'
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users_profile 
      WHERE id = auth.uid() AND role IN ('admin', 'hospital_admin')
    )
  );

-- ============================================================
-- SOCIETY MODULE - RLS POLICIES
-- ============================================================

-- Policy: Group members can view group posts
CREATE POLICY "society_posts_members_read"
  ON public.society_posts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.society_members 
      WHERE group_id = society_posts.group_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users_profile 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Group members can create posts
CREATE POLICY "society_posts_create"
  ON public.society_posts
  FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.society_members 
      WHERE group_id = society_posts.group_id AND user_id = auth.uid()
    )
  );

-- Policy: Post authors and admins can update/delete
CREATE POLICY "society_posts_update"
  ON public.society_posts
  FOR UPDATE
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users_profile 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Users can view public groups
CREATE POLICY "society_groups_read"
  ON public.society_groups
  FOR SELECT
  USING (
    status = 'active'
    OR admin_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users_profile 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Users can join groups
CREATE POLICY "society_members_join"
  ON public.society_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- SENIORITY MODULE - RLS POLICIES (Restricted Access)
-- ============================================================

-- Policy: Users can view their own seniority record
CREATE POLICY "seniority_records_read_own"
  ON public.seniority_records
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users_profile 
      WHERE id = auth.uid() AND role IN ('admin', 'senior_admin')
    )
  );

-- Policy: Only admins can update records
CREATE POLICY "seniority_records_update_admin"
  ON public.seniority_records
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users_profile 
      WHERE id = auth.uid() AND role IN ('admin', 'senior_admin')
    )
  );

-- Policy: Admins can view promotion history
CREATE POLICY "seniority_promotions_read"
  ON public.seniority_promotions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.seniority_records sr
      WHERE sr.id = record_id AND (sr.user_id = auth.uid() OR auth.uid() IN (
        SELECT id FROM public.users_profile WHERE role IN ('admin', 'senior_admin')
      ))
    )
  );

-- ============================================================
-- AUDIT LOGS - RLS POLICIES (Admin Only)
-- ============================================================

-- Policy: Only admins can view audit logs
CREATE POLICY "audit_logs_admin_read"
  ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users_profile 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Only system can insert audit logs
CREATE POLICY "audit_logs_system_insert"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);  -- Controlled by application logic

-- ============================================================
-- ADMIN SETTINGS - RLS POLICIES
-- ============================================================

-- Policy: Settings are readable by all
CREATE POLICY "admin_settings_read"
  ON public.admin_settings
  FOR SELECT
  USING (true);

-- Policy: Only admins can modify settings
CREATE POLICY "admin_settings_write"
  ON public.admin_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users_profile 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- IMPLEMENTATION NOTES
-- ============================================================

-- 1. RLS is enabled on all tables in schema.sql
-- 2. Policies use auth.uid() to get current user ID
-- 3. EXISTS checks verify user role and permissions
-- 4. Use service role key for backend operations that bypass RLS
-- 5. Test policies with different roles to ensure security
-- 6. Audit logs should track all sensitive operations
-- 7. Consider audit triggers for compliance requirements
-- 8. Review policies quarterly for security updates
