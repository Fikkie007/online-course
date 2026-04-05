-- =============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =============================================================================
-- Migration: 012_performance_indexes.sql
-- Purpose: Add composite indexes for common query patterns
-- Based on: Performance Analysis Report 2026-04-05
-- =============================================================================

-- =============================================================================
-- ENABLE PG_TRGM EXTENSION FIRST (required for gin_trgm_ops)
-- =============================================================================
-- This MUST be created before using gin_trgm_ops operator class

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- ENROLLMENTS TABLE - Composite Indexes
-- =============================================================================

-- Optimizes: Student course enrollment lookup (used in learn page, progress tracking)
-- Query pattern: WHERE student_id = X AND course_id = Y AND status = 'active'
CREATE INDEX IF NOT EXISTS idx_enrollments_student_course_status
ON enrollments(student_id, course_id, status);

-- Optimizes: Fetching active enrollments for a student with status filter
-- Query pattern: WHERE student_id = X AND status IN ('active', 'completed')
CREATE INDEX IF NOT EXISTS idx_enrollments_student_status
ON enrollments(student_id, status);

-- =============================================================================
-- LESSON_PROGRESS TABLE - Composite Indexes
-- =============================================================================

-- Optimizes: Checking if specific lesson is completed for an enrollment
-- Query pattern: WHERE enrollment_id = X AND lesson_id = Y AND is_completed = true
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment_lesson_completed
ON lesson_progress(enrollment_id, lesson_id, is_completed);

-- Optimizes: Counting completed lessons for progress calculation
-- Query pattern: WHERE enrollment_id = X AND is_completed = true
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment_completed
ON lesson_progress(enrollment_id, is_completed);

-- =============================================================================
-- COURSES TABLE - Performance Indexes
-- =============================================================================

-- Optimizes: Course listing ordered by creation date
-- Query pattern: ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_courses_created_at_desc
ON courses(created_at DESC);

-- Optimizes: Published courses with mentor join (common listing query)
-- Query pattern: WHERE status = 'published' ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_courses_status_created_at
ON courses(status, created_at DESC);

-- Optimizes: Full-text search on course titles using trigram
-- Query pattern: WHERE title ILIKE '%search%'
-- Requires: pg_trgm extension (created above)
CREATE INDEX IF NOT EXISTS idx_courses_title_trgm
ON courses USING gin(title gin_trgm_ops);

-- =============================================================================
-- MODULES TABLE - Composite Index
-- =============================================================================

-- Optimizes: Fetching modules with lessons ordered by index
-- Query pattern: WHERE course_id = X ORDER BY order_index
CREATE INDEX IF NOT EXISTS idx_modules_course_order
ON modules(course_id, order_index);

-- =============================================================================
-- LESSONS TABLE - Composite Index
-- =============================================================================

-- Optimizes: Fetching lessons within a module ordered by index
-- Query pattern: WHERE module_id = X ORDER BY order_index
CREATE INDEX IF NOT EXISTS idx_lessons_module_order
ON lessons(module_id, order_index);

-- =============================================================================
-- PAYMENTS TABLE - Composite Index
-- =============================================================================

-- Optimizes: Finding pending payments for a student
-- Query pattern: WHERE student_id = X AND status = 'pending' ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_payments_student_status_created
ON payments(student_id, status, created_at DESC);

-- =============================================================================
-- CERTIFICATES TABLE - Composite Index
-- =============================================================================

-- Optimizes: Fetching certificates for a student's courses
-- Query pattern: WHERE student_id = X AND course_id = Y
CREATE INDEX IF NOT EXISTS idx_certificates_student_course
ON certificates(student_id, course_id);

-- =============================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- =============================================================================
-- Update statistics after creating indexes

ANALYZE enrollments;
ANALYZE lesson_progress;
ANALYZE courses;
ANALYZE modules;
ANALYZE lessons;
ANALYZE payments;
ANALYZE certificates;

-- =============================================================================
-- INDEX USAGE NOTES
-- =============================================================================
-- These indexes target the most common query patterns identified in the
-- performance analysis:
--
-- 1. Student dashboard: Loading enrollments with status filter
-- 2. Learn page: Checking lesson completion status
-- 3. Course listing: Filtering and pagination
-- 4. Progress calculation: Counting completed lessons
--
-- To verify index usage, run EXPLAIN ANALYZE on your queries.
-- Example: EXPLAIN ANALYZE SELECT * FROM enrollments WHERE student_id = 'x' AND course_id = 'y';
-- =============================================================================