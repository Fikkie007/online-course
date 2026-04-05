-- Enable Row Level Security
-- Note: Since we use NextAuth (not Supabase Auth), auth.uid() is not available
-- We use simple allow-all policies since the app uses admin client for writes
-- and anon client only for public reads

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, admin client handles writes
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_all" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update_all" ON profiles FOR UPDATE USING (true);

-- Courses: public read published courses, admin client handles writes
CREATE POLICY "courses_select_all" ON courses FOR SELECT USING (true);
CREATE POLICY "courses_insert_all" ON courses FOR INSERT WITH CHECK (true);
CREATE POLICY "courses_update_all" ON courses FOR UPDATE USING (true);
CREATE POLICY "courses_delete_all" ON courses FOR DELETE USING (true);

-- Modules
CREATE POLICY "modules_select_all" ON modules FOR SELECT USING (true);
CREATE POLICY "modules_insert_all" ON modules FOR INSERT WITH CHECK (true);
CREATE POLICY "modules_update_all" ON modules FOR UPDATE USING (true);
CREATE POLICY "modules_delete_all" ON modules FOR DELETE USING (true);

-- Lessons
CREATE POLICY "lessons_select_all" ON lessons FOR SELECT USING (true);
CREATE POLICY "lessons_insert_all" ON lessons FOR INSERT WITH CHECK (true);
CREATE POLICY "lessons_update_all" ON lessons FOR UPDATE USING (true);
CREATE POLICY "lessons_delete_all" ON lessons FOR DELETE USING (true);

-- Enrollments
CREATE POLICY "enrollments_select_all" ON enrollments FOR SELECT USING (true);
CREATE POLICY "enrollments_insert_all" ON enrollments FOR INSERT WITH CHECK (true);
CREATE POLICY "enrollments_update_all" ON enrollments FOR UPDATE USING (true);

-- Lesson Progress
CREATE POLICY "lesson_progress_select_all" ON lesson_progress FOR SELECT USING (true);
CREATE POLICY "lesson_progress_insert_all" ON lesson_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "lesson_progress_update_all" ON lesson_progress FOR UPDATE USING (true);

-- Payments
CREATE POLICY "payments_select_all" ON payments FOR SELECT USING (true);
CREATE POLICY "payments_insert_all" ON payments FOR INSERT WITH CHECK (true);

-- Certificates (public verification)
CREATE POLICY "certificates_select_all" ON certificates FOR SELECT USING (true);

-- Notifications Log
CREATE POLICY "notifications_log_select_all" ON notifications_log FOR SELECT USING (true);
CREATE POLICY "notifications_log_insert_all" ON notifications_log FOR INSERT WITH CHECK (true);