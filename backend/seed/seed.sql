-- MK9 Project - Database Seed Data
-- Sample data for all modules
-- NOTE: Replace auth.users IDs with real user IDs from Supabase Auth

-- ============================================================
-- SEED: USERS PROFILE
-- ============================================================
-- NOTE: First create users in Supabase Auth, then insert here with their real IDs

-- Example insert (replace UUIDs with real auth.users IDs):
-- INSERT INTO public.users_profile (id, email, full_name, phone, role, status, bio)
-- VALUES 
--   ('real-auth-uuid-1', 'admin@mk9.in', 'Admin User', '+91-9999999999', 'admin', 'active', 'System Administrator'),
--   ('real-auth-uuid-2', 'blogger@mk9.in', 'Blog Writer', '+91-8888888888', 'blogger', 'active', 'Content Creator');

-- ============================================================
-- SEED: BLOG MODULE
-- ============================================================

-- Blog Categories
INSERT INTO public.blog_categories (name, slug, description)
VALUES
  ('SEO & Digital Marketing', 'seo-digital-marketing', 'Articles about SEO, digital marketing strategies and best practices'),
  ('Web Development', 'web-development', 'Web development tutorials, technologies, and frameworks'),
  ('Graphics & Design', 'graphics-design', 'Design principles, tools, and creative inspiration'),
  ('Career Development', 'career-development', 'Tips for career growth and professional development'),
  ('Technology News', 'technology-news', 'Latest news and updates from the tech world');

-- ============================================================
-- SEED: HOSPITAL MODULE
-- ============================================================

-- Hospital Departments
INSERT INTO public.hospital_departments (name, description, contact_email, status)
VALUES
  ('General Medicine', 'General medical consultations and treatments', 'general@hospital.mk9.in', 'active'),
  ('Pediatrics', 'Child healthcare and pediatric services', 'pediatrics@hospital.mk9.in', 'active'),
  ('Cardiology', 'Heart and cardiovascular disease treatment', 'cardiology@hospital.mk9.in', 'active'),
  ('Orthopedics', 'Bone and joint treatment', 'orthopedics@hospital.mk9.in', 'active'),
  ('Emergency', '24/7 Emergency and urgent care', 'emergency@hospital.mk9.in', 'active');

-- ============================================================
-- SEED: SOCIETY MODULE
-- ============================================================

-- Society Groups
INSERT INTO public.society_groups (name, description, member_count, status)
VALUES
  ('Tech Enthusiasts', 'Community for technology lovers and professionals', 150, 'active'),
  ('Business Networking', 'Professional networking and business opportunities', 200, 'active'),
  ('Health & Wellness', 'Group focused on health, fitness and wellness', 120, 'active'),
  ('Skill Development', 'Learning and skill enhancement community', 180, 'active'),
  ('Social Impact', 'Community service and social responsibility initiatives', 95, 'active');

-- ============================================================
-- SEED: SENIORITY MODULE
-- ============================================================

-- Seniority Records (Example structure - adjust based on actual data)
-- INSERT INTO public.seniority_records (user_id, employee_id, department, position, joining_date, promotion_date, salary_grade, status)
-- VALUES
--   ('auth-uuid-1', 'EMP001', 'Engineering', 'Senior Developer', '2018-01-15'::DATE, '2022-06-01'::DATE, 'Grade-A', 'active'),
--   ('auth-uuid-2', 'EMP002', 'Marketing', 'Marketing Manager', '2019-03-20'::DATE, NULL, 'Grade-B', 'active'),
--   ('auth-uuid-3', 'EMP003', 'Sales', 'Sales Executive', '2020-05-10'::DATE, NULL, 'Grade-C', 'active');

-- ============================================================
-- SEED: ADMIN MODULE
-- ============================================================

-- Admin Settings
INSERT INTO public.admin_settings (setting_key, setting_value, description)
VALUES
  ('site_name', '"MK9 Solutions"', 'Main site name'),
  ('site_url', '"https://mk9.in"', 'Main site URL'),
  ('contact_email', '"contact@mk9.in"', 'Primary contact email'),
  ('support_email', '"support@mk9.in"', 'Support email'),
  ('phone_primary', '"+91-9876543210"', 'Primary contact phone'),
  ('address', '"123 Tech Street, City, State"', 'Office address'),
  ('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
  ('max_upload_size', '52428800', 'Max file upload size in bytes (50MB)'),
  ('posts_per_page', '10', 'Blog posts per page'),
  ('comments_require_approval', 'true', 'Moderate comments before display'),
  ('enable_analytics', 'true', 'Enable analytics tracking'),
  ('timezone', '"Asia/Kolkata"', 'Server timezone');

-- ============================================================
-- SEED: AUDIT LOGS (Example)
-- ============================================================

-- Initial system audit log
-- INSERT INTO public.audit_logs (user_id, module, action, table_name, record_id, new_values, created_at)
-- VALUES
--   (NULL, 'system', 'init', 'database', NULL, '{"event": "database_schema_initialized"}', NOW());

-- ============================================================
-- REFERENCE DATA FOR FUTURE USE
-- ============================================================

-- User Roles Reference:
-- - user: Standard user
-- - blogger: Can create blog posts
-- - hospital_admin: Hospital module admin
-- - society_admin: Society module admin
-- - senior_admin: Seniority module admin
-- - admin: Super admin with full access

-- Post Status Reference:
-- - draft: Not published
-- - published: Visible to public
-- - archived: Hidden from listings

-- Appointment Status Reference:
-- - scheduled: Confirmed appointment
-- - pending: Awaiting confirmation
-- - completed: Appointment finished
-- - cancelled: Cancelled by user or doctor
-- - no_show: Patient didn't show up

-- Entity Status Reference:
-- - active: Operational
-- - inactive: Temporarily disabled
-- - archived: Historical record
-- - deleted: Soft deleted

-- ============================================================
-- NOTES ON SEED DATA
-- ============================================================

-- 1. This seed file is intentionally minimal - adjust based on your needs
-- 2. Replace all auth UUIDs with real Supabase Auth user IDs
-- 3. Run schema.sql BEFORE running this file
-- 4. For production, consider data volume and performance
-- 5. Categories and departments are intentional examples - customize for your business
-- 6. Settings table uses JSONB for flexibility - add custom settings as needed
-- 7. Always backup production database before running seed scripts
