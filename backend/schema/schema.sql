-- MK9 Project - Complete Database Schema
-- Single Supabase PostgreSQL Database
-- Execute in order: Core → Modules → Indexes

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Users Profile (extends auth.users)
CREATE TABLE public.users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'user',
  status VARCHAR(50) DEFAULT 'active',
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;

-- Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  module VARCHAR(50),
  action VARCHAR(50),
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- BLOG MODULE
-- ============================================================

CREATE TABLE public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt VARCHAR(500),
  featured_image_url TEXT,
  category_id UUID REFERENCES public.blog_categories(id),
  status VARCHAR(50) DEFAULT 'draft',
  views_count INT DEFAULT 0,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HOSPITAL MODULE
-- ============================================================

CREATE TABLE public.hospital_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  head_id UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
  contact_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.hospital_departments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.hospital_doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.hospital_departments(id),
  license_number VARCHAR(50) UNIQUE NOT NULL,
  specialization VARCHAR(255),
  experience_years INT,
  consultation_fee DECIMAL(10, 2),
  available_slots INT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.hospital_doctors ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.hospital_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.hospital_doctors(id) ON DELETE RESTRICT,
  appointment_date TIMESTAMP NOT NULL,
  duration_minutes INT DEFAULT 30,
  status VARCHAR(50) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.hospital_appointments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SOCIETY MODULE
-- ============================================================

CREATE TABLE public.society_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  admin_id UUID NOT NULL REFERENCES public.users_profile(id),
  member_count INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.society_groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.society_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.society_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.society_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.society_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.society_groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.society_posts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SENIORITY MODULE
-- ============================================================

CREATE TABLE public.seniority_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  department VARCHAR(100),
  position VARCHAR(100),
  joining_date DATE NOT NULL,
  years_of_service INT GENERATED ALWAYS AS (EXTRACT(YEAR FROM AGE(CURRENT_DATE, joining_date))) STORED,
  promotion_date DATE,
  salary_grade VARCHAR(20),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.seniority_records ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.seniority_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES public.seniority_records(id) ON DELETE CASCADE,
  old_position VARCHAR(100),
  new_position VARCHAR(100),
  promotion_date DATE NOT NULL,
  reason TEXT,
  approved_by UUID REFERENCES public.users_profile(id),
  status VARCHAR(50) DEFAULT 'approved',
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.seniority_promotions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ADMIN MODULE
-- ============================================================

CREATE TABLE public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB,
  description TEXT,
  updated_by UUID REFERENCES public.users_profile(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.users_profile(id),
  action VARCHAR(100),
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Blog Indexes
CREATE INDEX idx_blog_posts_author ON public.blog_posts(author_id);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category_id);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX idx_blog_comments_post ON public.blog_comments(post_id);
CREATE INDEX idx_blog_comments_user ON public.blog_comments(user_id);

-- Hospital Indexes
CREATE INDEX idx_hospital_appointments_patient ON public.hospital_appointments(patient_id);
CREATE INDEX idx_hospital_appointments_doctor ON public.hospital_appointments(doctor_id);
CREATE INDEX idx_hospital_appointments_date ON public.hospital_appointments(appointment_date);
CREATE INDEX idx_hospital_doctors_user ON public.hospital_doctors(user_id);
CREATE INDEX idx_hospital_doctors_department ON public.hospital_doctors(department_id);

-- Society Indexes
CREATE INDEX idx_society_members_group ON public.society_members(group_id);
CREATE INDEX idx_society_members_user ON public.society_members(user_id);
CREATE INDEX idx_society_posts_group ON public.society_posts(group_id);
CREATE INDEX idx_society_posts_author ON public.society_posts(author_id);

-- Seniority Indexes
CREATE INDEX idx_seniority_records_user ON public.seniority_records(user_id);
CREATE INDEX idx_seniority_records_employee_id ON public.seniority_records(employee_id);
CREATE INDEX idx_seniority_promotions_record ON public.seniority_promotions(record_id);

-- Audit Indexes
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_module ON public.audit_logs(module);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================================
-- RLS POLICIES (Row Level Security)
-- ============================================================

-- Users Profile Policies
CREATE POLICY "Users can view their own profile"
  ON public.users_profile FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can update their own profile"
  ON public.users_profile FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Blog Posts Policies
CREATE POLICY "Published posts are viewable by all"
  ON public.blog_posts FOR SELECT
  USING (status = 'published' OR author_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can create blog posts"
  ON public.blog_posts FOR INSERT
  WITH CHECK (author_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role IN ('admin', 'blogger')
  ));

CREATE POLICY "Users can update their own posts"
  ON public.blog_posts FOR UPDATE
  USING (author_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role = 'admin'
  ));

-- Blog Comments Policies
CREATE POLICY "Comments on published posts are viewable"
  ON public.blog_comments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.blog_posts WHERE id = post_id AND status = 'published')
    OR user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can comment"
  ON public.blog_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Hospital Appointments Policies
CREATE POLICY "Users can view their own appointments"
  ON public.hospital_appointments FOR SELECT
  USING (
    patient_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.hospital_doctors hd 
      WHERE hd.id = doctor_id AND hd.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Patients can book appointments"
  ON public.hospital_appointments FOR INSERT
  WITH CHECK (patient_id = auth.uid());

-- Society Posts Policies
CREATE POLICY "Group members can view posts"
  ON public.society_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.society_members 
      WHERE group_id = society_posts.group_id AND user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Group members can create posts"
  ON public.society_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.society_members 
      WHERE group_id = society_posts.group_id AND user_id = auth.uid()
    )
  );

-- Seniority Records Policies (Employee data - restricted)
CREATE POLICY "Users can view their own seniority record"
  ON public.seniority_records FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role IN ('admin', 'senior_admin')
  ));

-- Audit Logs Policies (Admin only)
CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role = 'admin'
  ));

-- ============================================================
-- END OF SCHEMA SETUP
-- ============================================================
