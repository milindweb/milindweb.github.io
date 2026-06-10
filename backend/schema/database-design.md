# Database Design - MK9 Project

## Overview
Single Supabase PostgreSQL database with modular schema organization.
All tables use UUID primary keys and include audit timestamps.

---

## Core Tables (Public Schema)

### users_profile
Extends Supabase Auth users table with additional profile data.

```sql
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
```

**Roles**: `user`, `blogger`, `hospital_admin`, `society_admin`, `senior_admin`, `admin`

---

### audit_logs
Track all important actions across modules.

```sql
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
```

---

## Blog Module Schema

### blog_posts
Main blog articles table.

```sql
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
```

### blog_categories
Category management for posts.

```sql
CREATE TABLE public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### blog_comments
User comments on posts.

```sql
CREATE TABLE public.blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Hospital Module Schema

### hospital_departments
Hospital departments.

```sql
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
```

### hospital_doctors
Doctor profiles.

```sql
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
```

### hospital_appointments
Patient appointments.

```sql
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
```

---

## Society Module Schema

### society_groups
Society/community groups.

```sql
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
```

### society_members
Group membership.

```sql
CREATE TABLE public.society_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.society_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);
```

### society_posts
Group posts/discussions.

```sql
CREATE TABLE public.society_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.society_groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Seniority Module Schema

### seniority_records
Employee seniority tracking.

```sql
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
```

### seniority_promotions
Promotion history.

```sql
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
```

---

## Admin Module Schema

### admin_settings
Global application settings.

```sql
CREATE TABLE public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB,
  description TEXT,
  updated_by UUID REFERENCES public.users_profile(id),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### admin_activity_logs
Detailed admin activity tracking.

```sql
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
```

---

## Indexes for Performance

```sql
CREATE INDEX idx_blog_posts_author ON public.blog_posts(author_id);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_comments_post ON public.blog_comments(post_id);

CREATE INDEX idx_hospital_appointments_patient ON public.hospital_appointments(patient_id);
CREATE INDEX idx_hospital_appointments_doctor ON public.hospital_appointments(doctor_id);
CREATE INDEX idx_hospital_appointments_date ON public.hospital_appointments(appointment_date);

CREATE INDEX idx_society_members_group ON public.society_members(group_id);
CREATE INDEX idx_society_members_user ON public.society_members(user_id);

CREATE INDEX idx_seniority_records_user ON public.seniority_records(user_id);
CREATE INDEX idx_seniority_records_employee_id ON public.seniority_records(employee_id);

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_module ON public.audit_logs(module);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
```

---

## Notes

- All UUIDs are auto-generated
- Timestamps use UTC (NOW())
- Foreign keys use CASCADE/RESTRICT as appropriate
- RLS policies defined per module in policies/ folder
- Storage buckets mirror this schema structure
