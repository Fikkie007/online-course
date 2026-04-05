-- =============================================================================
-- SECURE Row Level Security Policies
-- =============================================================================
-- This migration replaces the permissive policies with proper access control
-- Since we use NextAuth (not Supabase Auth), auth.uid() is not available
-- We use service role for all writes (admin client) and restrict anon access
-- =============================================================================

-- First, drop all existing permissive policies
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_all" ON profiles;
DROP POLICY IF EXISTS "profiles_update_all" ON profiles;
DROP POLICY IF EXISTS "courses_select_all" ON courses;
DROP POLICY IF EXISTS "courses_insert_all" ON courses;
DROP POLICY IF EXISTS "courses_update_all" ON courses;
DROP POLICY IF EXISTS "courses_delete_all" ON courses;
DROP POLICY IF EXISTS "modules_select_all" ON modules;
DROP POLICY IF EXISTS "modules_insert_all" ON modules;
DROP POLICY IF EXISTS "modules_update_all" ON modules;
DROP POLICY IF EXISTS "modules_delete_all" ON modules;
DROP POLICY IF EXISTS "lessons_select_all" ON lessons;
DROP POLICY IF EXISTS "lessons_insert_all" ON lessons;
DROP POLICY IF EXISTS "lessons_update_all" ON lessons;
DROP POLICY IF EXISTS "lessons_delete_all" ON lessons;
DROP POLICY IF EXISTS "enrollments_select_all" ON enrollments;
DROP POLICY IF EXISTS "enrollments_insert_all" ON enrollments;
DROP POLICY IF EXISTS "enrollments_update_all" ON enrollments;
DROP POLICY IF EXISTS "lesson_progress_select_all" ON lesson_progress;
DROP POLICY IF EXISTS "lesson_progress_insert_all" ON lesson_progress;
DROP POLICY IF EXISTS "lesson_progress_update_all" ON lesson_progress;
DROP POLICY IF EXISTS "payments_select_all" ON payments;
DROP POLICY IF EXISTS "payments_insert_all" ON payments;
DROP POLICY IF EXISTS "certificates_select_all" ON certificates;
DROP POLICY IF EXISTS "notifications_log_select_all" ON notifications_log;
DROP POLICY IF EXISTS "notifications_log_insert_all" ON notifications_log;

-- =============================================================================
-- PROFILES TABLE
-- =============================================================================
-- Public profiles for display (mentors, etc) - limited fields
CREATE POLICY "profiles_select_public" ON profiles
  FOR SELECT USING (true);

-- Only service role can insert/update (admin client handles this)
CREATE POLICY "profiles_insert_service" ON profiles
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "profiles_update_service" ON profiles
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- COURSES TABLE
-- =============================================================================
-- Published courses are readable by everyone
CREATE POLICY "courses_select_published" ON courses
  FOR SELECT USING (status = 'published' OR auth.jwt() ->> 'role' = 'service_role');

-- Only service role can modify
CREATE POLICY "courses_insert_service" ON courses
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "courses_update_service" ON courses
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "courses_delete_service" ON courses
  FOR DELETE USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- MODULES TABLE
-- =============================================================================
-- Modules readable for published courses
CREATE POLICY "modules_select_published" ON modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = modules.course_id
      AND (courses.status = 'published' OR auth.jwt() ->> 'role' = 'service_role')
    )
  );

CREATE POLICY "modules_insert_service" ON modules
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "modules_update_service" ON modules
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "modules_delete_service" ON modules
  FOR DELETE USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- LESSONS TABLE
-- =============================================================================
-- Lessons readable for published courses (content_url filtered at app layer)
CREATE POLICY "lessons_select_published" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM modules
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id
      AND (courses.status = 'published' OR auth.jwt() ->> 'role' = 'service_role')
    )
  );

CREATE POLICY "lessons_insert_service" ON lessons
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "lessons_update_service" ON lessons
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "lessons_delete_service" ON lessons
  FOR DELETE USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- ENROLLMENTS TABLE
-- =============================================================================
-- Only service role can access (enrollment ownership checked at app layer)
CREATE POLICY "enrollments_service_only" ON enrollments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- LESSON_PROGRESS TABLE
-- =============================================================================
-- Only service role can access (ownership checked at app layer)
CREATE POLICY "lesson_progress_service_only" ON lesson_progress
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- PAYMENTS TABLE
-- =============================================================================
-- Only service role can access (ownership checked at app layer)
CREATE POLICY "payments_service_only" ON payments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- CERTIFICATES TABLE
-- =============================================================================
-- Certificates are publicly verifiable by certificate_number
CREATE POLICY "certificates_select_public" ON certificates
  FOR SELECT USING (true);

CREATE POLICY "certificates_insert_service" ON certificates
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- NOTIFICATIONS_LOG TABLE
-- =============================================================================
-- Only service role can access (ownership checked at app layer)
CREATE POLICY "notifications_log_service_only" ON notifications_log
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- CATEGORIES TABLE (if exists)
-- =============================================================================
-- Categories are public
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "categories_select_public" ON categories
      FOR SELECT USING (true);

    CREATE POLICY "categories_service_only" ON categories
      FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

-- =============================================================================
-- COURSE_CATEGORIES TABLE (if exists)
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_categories') THEN
    ALTER TABLE course_categories ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "course_categories_select_public" ON course_categories
      FOR SELECT USING (true);

    CREATE POLICY "course_categories_service_only" ON course_categories
      FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

-- =============================================================================
-- NOTIFICATIONS TABLE (if exists - in-app notifications)
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

    -- Only service role can access (ownership checked at app layer)
    CREATE POLICY "notifications_service_only" ON notifications
      FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

-- =============================================================================
-- PASSWORD_RESET_TOKENS TABLE
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens') THEN
    ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

    -- Only service role can access (tokens are sensitive)
    CREATE POLICY "password_reset_tokens_service_only" ON password_reset_tokens
      FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

-- =============================================================================
-- SECURITY NOTES
-- =============================================================================
-- 1. All writes go through admin client (service role) - application handles auth
-- 2. Anon key can only read:
--    - Published courses, modules, lessons (without content_url for non-enrolled)
--    - Public profiles (limited info)
--    - Certificates (public verification)
--    - Categories
-- 3. Sensitive tables (enrollments, payments, notifications, etc.) are service-only
-- 4. Application layer enforces:
--    - User ownership for their own data
--    - Role-based access control (admin/mentor/student)
-- =============================================================================