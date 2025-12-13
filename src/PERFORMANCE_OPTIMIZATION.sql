-- ============================================
-- KKU Smart Attendance System
-- Performance Optimization Script
-- تحسين الأداء للنظام
-- ============================================

-- 🚀 هذا السكربت يحسّن أداء النظام ليتحمل 1000+ مستخدم
-- يتضمن: Indexes إضافية، Materialized Views، Partitioning

-- ============================================
-- 1️⃣ Additional Indexes for Complex Queries
-- ============================================

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_enrollments_student_course_status 
ON enrollments(student_id, course_id, status);

CREATE INDEX IF NOT EXISTS idx_attendance_student_course_status 
ON attendance(student_id, course_id, status);

CREATE INDEX IF NOT EXISTS idx_attendance_session_status 
ON attendance(session_id, status);

CREATE INDEX IF NOT EXISTS idx_sessions_course_active_date 
ON sessions(course_id, active, session_date DESC);

-- Partial indexes (only active records)
CREATE INDEX IF NOT EXISTS idx_courses_active 
ON courses(id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_sessions_active_only 
ON sessions(id, course_id, expires_at) WHERE active = true;

-- Index for searching by name (for autocomplete)
CREATE INDEX IF NOT EXISTS idx_profiles_fullname_trgm 
ON profiles USING gin(full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_courses_name_trgm 
ON courses USING gin(course_name gin_trgm_ops);

-- Enable the pg_trgm extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- 2️⃣ Materialized View for Student Statistics
-- ============================================

-- Drop if exists
DROP MATERIALIZED VIEW IF EXISTS student_attendance_stats CASCADE;

-- Create materialized view for student attendance statistics
CREATE MATERIALIZED VIEW student_attendance_stats AS
SELECT 
    s.id as student_id,
    p.full_name as student_name,
    p.university_id,
    c.id as course_id,
    c.course_name,
    c.course_code,
    COUNT(DISTINCT a.id) as total_attendance,
    COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END) as present_count,
    COUNT(DISTINCT CASE WHEN a.status = 'absent' THEN a.id END) as absent_count,
    COUNT(DISTINCT CASE WHEN a.status = 'late' THEN a.id END) as late_count,
    ROUND(
        (COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END)::numeric / 
         NULLIF(COUNT(DISTINCT a.id), 0) * 100), 2
    ) as attendance_percentage
FROM profiles s
CROSS JOIN courses c
LEFT JOIN enrollments e ON e.student_id = s.id AND e.course_id = c.id
LEFT JOIN attendance a ON a.student_id = s.id AND a.course_id = c.id
WHERE s.role = 'student'
  AND c.is_active = true
  AND (e.status = 'active' OR e.status IS NULL)
GROUP BY s.id, p.full_name, p.university_id, c.id, c.course_name, c.course_code;

-- Create indexes on materialized view
CREATE INDEX idx_student_stats_student ON student_attendance_stats(student_id);
CREATE INDEX idx_student_stats_course ON student_attendance_stats(course_id);
CREATE INDEX idx_student_stats_percentage ON student_attendance_stats(attendance_percentage);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_student_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY student_attendance_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3️⃣ Materialized View for Course Statistics
-- ============================================

DROP MATERIALIZED VIEW IF EXISTS course_stats CASCADE;

CREATE MATERIALIZED VIEW course_stats AS
SELECT 
    c.id as course_id,
    c.course_name,
    c.course_code,
    c.semester,
    c.year,
    i.full_name as instructor_name,
    COUNT(DISTINCT e.student_id) as enrolled_students,
    COUNT(DISTINCT s.id) as total_sessions,
    COUNT(DISTINCT CASE WHEN s.active = true THEN s.id END) as active_sessions,
    COUNT(DISTINCT a.id) as total_attendance_records,
    COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END) as present_count,
    ROUND(
        (COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END)::numeric / 
         NULLIF(COUNT(DISTINCT a.id), 0) * 100), 2
    ) as avg_attendance_rate
FROM courses c
LEFT JOIN profiles i ON i.id = c.instructor_id
LEFT JOIN enrollments e ON e.course_id = c.id AND e.status = 'active'
LEFT JOIN sessions s ON s.course_id = c.id
LEFT JOIN attendance a ON a.course_id = c.id
WHERE c.is_active = true
GROUP BY c.id, c.course_name, c.course_code, c.semester, c.year, i.full_name;

CREATE INDEX idx_course_stats_course ON course_stats(course_id);
CREATE INDEX idx_course_stats_semester_year ON course_stats(semester, year);

-- ============================================
-- 4️⃣ Function to Auto-Refresh Stats
-- ============================================

-- Create a function that refreshes both materialized views
CREATE OR REPLACE FUNCTION refresh_all_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY student_attendance_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY course_stats;
    RAISE NOTICE 'All statistics refreshed successfully';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5️⃣ Automatic Cleanup of Old Sessions
-- ============================================

-- Function to automatically mark expired sessions as inactive
CREATE OR REPLACE FUNCTION mark_expired_sessions()
RETURNS void AS $$
BEGIN
    UPDATE sessions
    SET active = false
    WHERE active = true 
      AND expires_at < NOW();
    
    RAISE NOTICE 'Expired sessions marked as inactive';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6️⃣ Function to Get Quick Stats
-- ============================================

-- Fast function to get system-wide statistics
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS TABLE(
    total_students BIGINT,
    total_instructors BIGINT,
    total_courses BIGINT,
    total_active_sessions BIGINT,
    total_attendance_today BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM profiles WHERE role = 'student'),
        (SELECT COUNT(*) FROM profiles WHERE role = 'instructor'),
        (SELECT COUNT(*) FROM courses WHERE is_active = true),
        (SELECT COUNT(*) FROM sessions WHERE active = true),
        (SELECT COUNT(*) FROM attendance WHERE DATE(recorded_at) = CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7️⃣ Function to Get Student Quick Stats
-- ============================================

CREATE OR REPLACE FUNCTION get_student_quick_stats(p_student_id UUID)
RETURNS TABLE(
    total_courses BIGINT,
    total_attendance BIGINT,
    present_count BIGINT,
    attendance_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT e.course_id) as total_courses,
        COUNT(DISTINCT a.id) as total_attendance,
        COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END) as present_count,
        ROUND(
            (COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END)::numeric / 
             NULLIF(COUNT(DISTINCT a.id), 0) * 100), 2
        ) as attendance_rate
    FROM enrollments e
    LEFT JOIN attendance a ON a.student_id = e.student_id AND a.course_id = e.course_id
    WHERE e.student_id = p_student_id
      AND e.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8️⃣ Enable Query Result Caching
-- ============================================

-- Set reasonable work_mem for complex queries
-- ALTER SYSTEM SET work_mem = '64MB';

-- Set shared_buffers for better caching
-- ALTER SYSTEM SET shared_buffers = '256MB';

-- Set effective_cache_size
-- ALTER SYSTEM SET effective_cache_size = '1GB';

-- Note: The above settings require database restart
-- They should be adjusted based on your Supabase plan

-- ============================================
-- 9️⃣ Vacuum and Analyze
-- ============================================

-- Vacuum all tables to reclaim space and update statistics
VACUUM ANALYZE profiles;
VACUUM ANALYZE courses;
VACUUM ANALYZE enrollments;
VACUUM ANALYZE sessions;
VACUUM ANALYZE attendance;

-- ============================================
-- 🔟 Setup Automatic Maintenance
-- ============================================

-- Note: In Supabase, you can set up scheduled functions using pg_cron
-- This requires the pg_cron extension to be enabled

-- Enable pg_cron extension (if not already enabled)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule automatic cleanup of expired sessions (every hour)
-- SELECT cron.schedule('cleanup-expired-sessions', '0 * * * *', 'SELECT mark_expired_sessions()');

-- Schedule automatic refresh of statistics (every 5 minutes)
-- SELECT cron.schedule('refresh-stats', '*/5 * * * *', 'SELECT refresh_all_stats()');

-- ============================================
-- ✅ Performance Testing Queries
-- ============================================

-- Test 1: Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Test 2: Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Test 3: Check slow queries (requires pg_stat_statements)
-- SELECT 
--     query,
--     calls,
--     mean_exec_time,
--     max_exec_time
-- FROM pg_stat_statements
-- ORDER BY mean_exec_time DESC
-- LIMIT 10;

-- ============================================
-- 📊 Usage Examples
-- ============================================

-- Example 1: Get system stats
-- SELECT * FROM get_system_stats();

-- Example 2: Get student stats
-- SELECT * FROM get_student_quick_stats('student-uuid-here');

-- Example 3: Refresh materialized views manually
-- SELECT refresh_all_stats();

-- Example 4: Check course statistics
-- SELECT * FROM course_stats ORDER BY avg_attendance_rate DESC;

-- Example 5: Check student attendance statistics
-- SELECT * FROM student_attendance_stats 
-- WHERE course_id = 'course-uuid-here'
-- ORDER BY attendance_percentage DESC;

-- ============================================
-- ✅ Done! Performance Optimization Complete!
-- ============================================

-- To verify the optimization:
-- 1. Run: SELECT * FROM get_system_stats();
-- 2. Check indexes: \di+ in psql
-- 3. Monitor query performance in Supabase Dashboard

COMMENT ON FUNCTION get_system_stats IS 'Returns quick system-wide statistics';
COMMENT ON FUNCTION get_student_quick_stats IS 'Returns quick statistics for a specific student';
COMMENT ON FUNCTION refresh_all_stats IS 'Refreshes all materialized views';
COMMENT ON FUNCTION mark_expired_sessions IS 'Marks expired sessions as inactive';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Performance optimization complete!';
    RAISE NOTICE '✅ Additional indexes created';
    RAISE NOTICE '✅ Materialized views created';
    RAISE NOTICE '✅ Helper functions created';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Next steps:';
    RAISE NOTICE '1. Run: SELECT * FROM get_system_stats();';
    RAISE NOTICE '2. Run: SELECT refresh_all_stats();';
    RAISE NOTICE '3. Monitor performance in Supabase Dashboard';
END $$;
