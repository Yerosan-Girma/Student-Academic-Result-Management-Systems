-- ============================================================
-- CONCEPT 1: INDEXES - Optimize ALL frequently queried columns
-- ============================================================

USE student_academic_management_v2;

-- Department indexes
ALTER TABLE departments ADD INDEX IF NOT EXISTS idx_departments_name (department_name);

-- Admin indexes
ALTER TABLE admins ADD INDEX IF NOT EXISTS idx_admins_username (username);

-- Class indexes
ALTER TABLE classes ADD INDEX IF NOT EXISTS idx_classes_name (class_name);

-- Student indexes - composite for common queries
ALTER TABLE students ADD INDEX IF NOT EXISTS idx_students_class (class_id);
ALTER TABLE students ADD INDEX IF NOT EXISTS idx_students_name (student_name);
ALTER TABLE students ADD INDEX IF NOT EXISTS idx_students_academic_year (academic_year);
ALTER TABLE students ADD INDEX IF NOT EXISTS idx_students_grade (grade);
ALTER TABLE students ADD INDEX IF NOT EXISTS idx_students_class_year_semester (class_id, academic_year, semester);

-- Teacher indexes
ALTER TABLE teachers ADD INDEX IF NOT EXISTS idx_teachers_department (department_id);
ALTER TABLE teachers ADD INDEX IF NOT EXISTS idx_teachers_assigned_class_id (assigned_class_id);
ALTER TABLE teachers ADD INDEX IF NOT EXISTS idx_teachers_name (teacher_name);
ALTER TABLE teachers ADD INDEX IF NOT EXISTS idx_teachers_username (username);
ALTER TABLE teachers ADD INDEX IF NOT EXISTS idx_teachers_role (role);

-- Subject indexes
ALTER TABLE subjects ADD INDEX IF NOT EXISTS idx_subjects_department (department_id);
ALTER TABLE subjects ADD INDEX IF NOT EXISTS idx_subjects_teacher (teacher_id);
ALTER TABLE subjects ADD INDEX IF NOT EXISTS idx_subjects_name (subject_name);
ALTER TABLE subjects ADD INDEX IF NOT EXISTS idx_subjects_start_year (start_year);

-- Mark indexes - CRITICAL for performance
ALTER TABLE marks ADD INDEX IF NOT EXISTS idx_marks_student (student_id);
ALTER TABLE marks ADD INDEX IF NOT EXISTS idx_marks_subject (subject_id);
ALTER TABLE marks ADD INDEX IF NOT EXISTS idx_marks_teacher (teacher_id);
ALTER TABLE marks ADD INDEX IF NOT EXISTS idx_marks_student_subject (student_id, subject_id);
ALTER TABLE marks ADD INDEX IF NOT EXISTS idx_marks_student_mark (student_id, mark);
ALTER TABLE marks ADD INDEX IF NOT EXISTS idx_marks_subject_mark (subject_id, mark);
ALTER TABLE marks ADD INDEX IF NOT EXISTS idx_marks_value_range (mark);
ALTER TABLE marks ADD INDEX IF NOT EXISTS idx_marks_created_at (created_at);

-- Audit log indexes
ALTER TABLE audit_log ADD INDEX IF NOT EXISTS idx_audit_table (table_name);
ALTER TABLE audit_log ADD INDEX IF NOT EXISTS idx_audit_operation (operation);
ALTER TABLE audit_log ADD INDEX IF NOT EXISTS idx_audit_date (changed_at);
ALTER TABLE audit_log ADD INDEX IF NOT EXISTS idx_audit_record (table_name, record_id);
