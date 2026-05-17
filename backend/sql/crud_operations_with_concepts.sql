-- ============================================================
-- CRUD OPERATIONS WITH 5 ADVANCED CONCEPTS APPLIED
-- Student Academic Record Management System (MySQL)
-- ============================================================
-- This file demonstrates how every CRUD operation is simplified
-- and enhanced by each of the 5 advanced SQL concepts already
-- defined in: create_tables.sql / database_enhancements.sql
--
-- CONCEPT LEGEND:
--   [VIEW]      -> vw_student_subject_marks, vw_student_summary,
--                  vw_class_performance, vw_teacher_subject_assignment,
--                  vw_department_performance
--   [FUNCTION]  -> fn_calculate_total, fn_calculate_average,
--                  fn_get_status, fn_get_subject_average, fn_get_class_average
--   [PROCEDURE] -> sp_add_student, sp_insert_mark,
--                  sp_update_mark, sp_get_student_report
--   [TRIGGER]   -> trg_mark_insert_validation, trg_mark_update_validation,
--                  trg_mark_update_timestamp, trg_mark_audit_log,
--                  trg_mark_audit_log_update, trg_mark_audit_log_delete,
--                  trg_teacher_homeroom_constraint
--   [INDEX]     -> idx_marks_student_subject, idx_marks_student_mark,
--                  idx_marks_subject_mark, idx_students_class,
--                  idx_students_name, idx_subjects_name,
--                  idx_teachers_name, idx_departments_name
-- ============================================================

USE student_academic_management_v2;

-- ============================================================
-- SECTION 1: DEPARTMENTS CRUD
-- ============================================================

-- [INDEX] idx_departments_name speeds up all department queries below

-- CREATE
INSERT INTO departments (department_name)
VALUES ('Mathematics');

-- READ ALL (index on department_name speeds up ORDER BY)
SELECT department_id, department_name
FROM departments
ORDER BY department_name ASC;

-- READ BY ID
SELECT department_id, department_name
FROM departments
WHERE department_id = 1;

-- READ WITH TEACHER & SUBJECT COUNTS
-- [VIEW] vw_department_performance simplifies this complex aggregation
SELECT department_id, department_name, teacher_count, subject_count,
       department_average, highest_mark, lowest_mark
FROM vw_department_performance
ORDER BY department_name ASC;

-- UPDATE
UPDATE departments
SET department_name = 'Advanced Mathematics'
WHERE department_id = 1;

-- DELETE (safe: only if no teachers or subjects reference it)
DELETE FROM departments
WHERE department_id = 1
  AND NOT EXISTS (SELECT 1 FROM teachers t WHERE t.department_id = departments.department_id)
  AND NOT EXISTS (SELECT 1 FROM subjects s WHERE s.department_id = departments.department_id);

-- ============================================================
-- SECTION 2: CLASSES CRUD
-- ============================================================

-- CREATE
INSERT INTO classes (class_name, description)
VALUES ('9A', 'Grade 9 Section A');

-- READ ALL
SELECT class_id, class_name, description, created_at
FROM classes
ORDER BY class_name ASC;

-- READ BY ID
SELECT class_id, class_name, description
FROM classes
WHERE class_id = 1;

-- READ CLASS WITH PERFORMANCE STATS
-- [VIEW] vw_class_performance replaces a complex multi-join aggregation
SELECT class_id, class_name, student_count,
       class_average, highest_mark, lowest_mark
FROM vw_class_performance
WHERE class_id = 1;

-- READ ALL CLASSES WITH PERFORMANCE
-- [FUNCTION] fn_get_class_average used per class for flexible inline use
SELECT c.class_id, c.class_name,
       fn_get_class_average(c.class_id) AS class_average
FROM classes c
ORDER BY class_average DESC;

-- UPDATE
UPDATE classes
SET class_name = '9B', description = 'Grade 9 Section B'
WHERE class_id = 1;

-- DELETE (safe: only if no students are in the class)
DELETE FROM classes
WHERE class_id = 1
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.class_id = classes.class_id);

-- ============================================================
-- SECTION 3: STUDENTS CRUD
-- ============================================================

-- CREATE (plain INSERT)
INSERT INTO students (student_name, gender, grade, class_id, academic_year, semester)
VALUES ('Abel Tesfaye', 'Male', '9A', 1, '2025/2026', '1');

-- CREATE WITH VALIDATION
-- [PROCEDURE] sp_add_student validates class existence and required fields
CALL sp_add_student(
    'Hana Girma',        -- p_student_name
    'Female',            -- p_gender
    '10A',               -- p_grade
    1,                   -- p_class_id
    '2025/2026',         -- p_academic_year
    '1',                 -- p_semester
    @new_student_id,     -- OUT: generated student_id
    @result_code,        -- OUT: 0 = success, negative = error
    @result_message      -- OUT: descriptive message
);
SELECT @new_student_id AS student_id, @result_code AS code, @result_message AS message;

-- READ ALL STUDENTS
-- [INDEX] idx_students_name speeds up ORDER BY student_name
SELECT student_id, student_name, gender, grade, academic_year, semester
FROM students
ORDER BY student_name ASC;

-- READ BY ID
SELECT student_id, student_name, gender, grade, academic_year, semester
FROM students
WHERE student_id = 1;

-- READ BY GRADE (index on class_id + name used)
SELECT student_id, student_name, gender, grade, academic_year, semester
FROM students
WHERE grade = '9A'
ORDER BY student_name ASC;

-- READ BY CLASS + YEAR + SEMESTER
SELECT student_id, student_name, gender, grade, academic_year, semester
FROM students
WHERE class_id = 1
  AND academic_year = '2025/2026'
  AND semester = '1'
ORDER BY student_name ASC;

-- READ STUDENT MARKS (subject-level detail)
-- [VIEW] vw_student_subject_marks replaces 3-table JOIN for per-student subject marks
SELECT student_name, subject_name, mark, total_mark, percentage
FROM vw_student_subject_marks
WHERE student_id = 1
ORDER BY subject_name ASC;

-- READ STUDENT SUMMARY (total, average, rank, status)
-- [VIEW] vw_student_summary provides computed rank and PASS/FAIL in one query
-- NOTE: `rank` is a MySQL 8 reserved word — use backticks when selecting
SELECT student_id, student_name, total_subjects,
       total_marks, average_mark, `rank`, status
FROM vw_student_summary
WHERE student_id = 1;

-- READ ALL STUDENTS RANKED
-- [VIEW] vw_student_summary replaces complex window function query
SELECT student_id, student_name, total_marks, average_mark, `rank`, status
FROM vw_student_summary
ORDER BY `rank` ASC;

-- READ WITH COMPUTED MARKS INLINE
-- [FUNCTION] fn_calculate_total, fn_calculate_average, fn_get_status
SELECT s.student_id, s.student_name, s.grade,
       fn_calculate_total(s.student_id)   AS total_marks,
       fn_calculate_average(s.student_id) AS average_mark,
       fn_get_status(s.student_id)        AS status
FROM students s
ORDER BY total_marks DESC;

-- READ COMPREHENSIVE STUDENT REPORT
-- [PROCEDURE] sp_get_student_report uses functions internally for clean output
CALL sp_get_student_report(1);

-- UPDATE STUDENT INFO
UPDATE students
SET student_name  = 'Abel T. Tesfaye',
    grade         = '9A',
    academic_year = '2025/2026',
    semester      = '2'
WHERE student_id = 1;

-- UPDATE BULK SEMESTER PROMOTION
UPDATE students
SET semester = '2'
WHERE grade = '9A'
  AND academic_year = '2025/2026'
  AND semester = '1';

-- DELETE STUDENT (cascade deletes marks via FK constraint)
DELETE FROM students
WHERE student_id = 1;

-- ============================================================
-- SECTION 4: TEACHERS CRUD
-- ============================================================

-- [INDEX] idx_teachers_name speeds up teacher name searches

-- CREATE SUBJECT TEACHER
INSERT INTO teachers (teacher_name, department_id, role, username, password_hash)
VALUES ('Mr. Bekele', 1, 'Subject Teacher', 'bekele', 'hashed_password_here');

-- CREATE HOMEROOM TEACHER
-- [TRIGGER] trg_teacher_homeroom_constraint auto-enforces one homeroom per class
INSERT INTO teachers (teacher_name, department_id, assigned_class, assigned_class_id, role, username, password_hash)
VALUES ('Ms. Hana', 1, '9A', 1, 'Homeroom Teacher', 'hana', 'hashed_password_here');

-- READ ALL TEACHERS WITH DEPARTMENT
SELECT t.teacher_id, t.teacher_name, d.department_name,
       t.assigned_class, t.role, t.username
FROM teachers t
LEFT JOIN departments d ON d.department_id = t.department_id
ORDER BY t.teacher_name ASC;

-- READ TEACHER WORKLOAD & GRADING STATS
-- [VIEW] vw_teacher_subject_assignment replaces complex self-join aggregation
SELECT teacher_id, teacher_name, subject_department,
       subject_name, students_graded, average_mark_given
FROM vw_teacher_subject_assignment
WHERE teacher_id = 1;

-- READ ALL TEACHERS WITH STATS
SELECT teacher_id, teacher_name, subject_name,
       students_graded, average_mark_given
FROM vw_teacher_subject_assignment
ORDER BY teacher_name ASC;

-- READ HOMEROOM TEACHERS BY CLASS
SELECT teacher_id, teacher_name, assigned_class
FROM teachers
WHERE role = 'Homeroom Teacher'
  AND assigned_class = '9A';

-- READ BY USERNAME
SELECT teacher_id, teacher_name, department_id, role, username
FROM teachers
WHERE username = 'bekele';

-- UPDATE TEACHER INFO
-- [TRIGGER] trg_teacher_homeroom_constraint fires on UPDATE to prevent duplicates
UPDATE teachers
SET teacher_name  = 'Mr. Bekele Tadesse',
    department_id = 1,
    role          = 'Subject Teacher',
    assigned_class = NULL,
    assigned_class_id = NULL
WHERE teacher_id = 1;

-- UPDATE ASSIGN HOMEROOM ROLE
-- [TRIGGER] trg_teacher_homeroom_constraint blocks if class already has homeroom
UPDATE teachers
SET role              = 'Homeroom Teacher',
    assigned_class    = '10A',
    assigned_class_id = 2
WHERE teacher_id = 1;

-- UPDATE PASSWORD
UPDATE teachers
SET password_hash = 'new_hashed_password_here'
WHERE username = 'bekele';

-- DELETE TEACHER
DELETE FROM teachers
WHERE teacher_id = 1;

-- ============================================================
-- SECTION 5: SUBJECTS CRUD
-- ============================================================

-- [INDEX] idx_subjects_name speeds up subject name lookups

-- CREATE
INSERT INTO subjects (subject_name, department_id, teacher_id, start_year, total_mark)
VALUES ('Mathematics', 1, 1, 2024, 100);

-- CREATE WITHOUT TEACHER (unassigned)
INSERT INTO subjects (subject_name, department_id, teacher_id, start_year, total_mark)
VALUES ('Civics', 1, NULL, NULL, 100);

-- READ ALL SUBJECTS WITH TEACHER & DEPARTMENT
SELECT s.subject_id, s.subject_name, d.department_name,
       t.teacher_name, s.start_year, s.total_mark
FROM subjects s
JOIN departments d ON d.department_id = s.department_id
LEFT JOIN teachers t ON t.teacher_id = s.teacher_id
ORDER BY s.subject_name ASC;

-- READ SUBJECT AVERAGE MARK
-- [FUNCTION] fn_get_subject_average computes average without manual aggregation
SELECT s.subject_id, s.subject_name,
       fn_get_subject_average(s.subject_id) AS average_mark
FROM subjects s
ORDER BY average_mark DESC;

-- READ ALL SUBJECTS PER TEACHER (workload)
-- [VIEW] vw_teacher_subject_assignment provides aggregated teacher workload
SELECT teacher_name, subject_name, students_graded, average_mark_given
FROM vw_teacher_subject_assignment
ORDER BY teacher_name ASC, subject_name ASC;

-- READ BY ID
SELECT subject_id, subject_name, department_id, teacher_id, start_year, total_mark
FROM subjects
WHERE subject_id = 1;

-- UPDATE SUBJECT
UPDATE subjects
SET subject_name  = 'Advanced Mathematics',
    teacher_id    = 2,
    start_year    = 2025
WHERE subject_id = 1;

-- UPDATE ASSIGN TEACHER TO SUBJECT
UPDATE subjects
SET teacher_id = 1
WHERE subject_id = 1
  AND teacher_id IS NULL;

-- DELETE SUBJECT
-- NOTE: marks.subject_id has ON DELETE CASCADE in create_tables.sql
-- so all marks for this subject are automatically deleted with it
DELETE FROM subjects
WHERE subject_id = 1;

-- ============================================================
-- SECTION 6: MARKS CRUD
-- ============================================================
-- Marks benefit the MOST from all 5 concepts:
-- [TRIGGER]   auto-validates range (0-100) and logs every change
-- [PROCEDURE] validates student/subject exist, no duplicates, range check
-- [FUNCTION]  computes total, average, status inline
-- [VIEW]      replaces complex JOINs for mark reads
-- [INDEX]     makes student+subject lookups extremely fast

-- CREATE (plain INSERT — triggers fire automatically)
-- [TRIGGER] trg_mark_insert_validation fires: blocks if mark < 0 or > 100
-- [TRIGGER] trg_mark_audit_log fires: logs new mark to audit_log automatically
INSERT INTO marks (student_id, subject_id, teacher_id, mark)
VALUES (1, 1, 1, 85);

-- CREATE WITH FULL VALIDATION
-- [PROCEDURE] sp_insert_mark: checks student exists, subject exists,
--             no duplicate, mark in range, mark <= total_mark
CALL sp_insert_mark(
    1,              -- p_student_id
    2,              -- p_subject_id
    90,             -- p_mark
    @result_code,   -- OUT: 0=success, negative=error
    @result_message -- OUT: message
);
SELECT @result_code AS code, @result_message AS message;

-- CREATE MULTIPLE MARKS (transaction)
START TRANSACTION;
    INSERT INTO marks (student_id, subject_id, teacher_id, mark) VALUES (1, 1, 1, 85);
    INSERT INTO marks (student_id, subject_id, teacher_id, mark) VALUES (1, 2, 1, 72);
    INSERT INTO marks (student_id, subject_id, teacher_id, mark) VALUES (1, 3, 2, 91);
COMMIT;

-- READ ALL MARKS (with full details)
-- [VIEW] vw_student_subject_marks replaces 3-table JOIN
-- [INDEX] idx_marks_student_subject makes filtering fast
SELECT student_id, student_name, subject_name, mark, total_mark, percentage
FROM vw_student_subject_marks
ORDER BY student_name ASC, subject_name ASC;

-- READ MARKS FOR ONE STUDENT
-- [VIEW] vw_student_subject_marks — no JOIN needed
SELECT student_name, subject_name, mark, total_mark, percentage
FROM vw_student_subject_marks
WHERE student_id = 1
ORDER BY subject_name ASC;

-- READ MARKS FOR ONE SUBJECT
-- [INDEX] idx_marks_subject_mark makes this fast
SELECT student_name, subject_name, mark, percentage
FROM vw_student_subject_marks
WHERE subject_name = 'Mathematics'
ORDER BY mark DESC;

-- READ STUDENT SUMMARY (rank, total, average, status)
-- [VIEW] vw_student_summary uses window function ROW_NUMBER internally
-- NOTE: `rank` is a MySQL 8 reserved word — backtick required
SELECT student_id, student_name, total_subjects,
       total_marks, average_mark, `rank`, status
FROM vw_student_summary
ORDER BY `rank` ASC;

-- READ COMPUTED VALUES INLINE
-- [FUNCTION] fn_calculate_total, fn_calculate_average, fn_get_status
SELECT
    s.student_id,
    s.student_name,
    fn_calculate_total(s.student_id)   AS total_marks,
    fn_calculate_average(s.student_id) AS average_mark,
    fn_get_status(s.student_id)        AS status
FROM students s
WHERE s.student_id = 1;

-- READ PASSING STUDENTS ONLY
-- [VIEW] vw_student_summary — filter by status column
SELECT student_id, student_name, average_mark, `rank`
FROM vw_student_summary
WHERE status = 'PASS'
ORDER BY `rank` ASC;

-- READ FAILING STUDENTS ONLY
SELECT student_id, student_name, average_mark
FROM vw_student_summary
WHERE status = 'FAIL'
ORDER BY average_mark DESC;

-- READ SUBJECT AVERAGE MARKS
-- [FUNCTION] fn_get_subject_average per subject
SELECT sub.subject_id, sub.subject_name,
       fn_get_subject_average(sub.subject_id) AS subject_average
FROM subjects sub
ORDER BY subject_average DESC;

-- READ AUDIT LOG (who changed what mark and when)
-- [TRIGGER] trg_mark_audit_log / trg_mark_audit_log_update / trg_mark_audit_log_delete
-- automatically write to audit_log on every INSERT/UPDATE/DELETE on marks
SELECT log_id, table_name, operation, record_id,
       old_values, new_values, changed_at
FROM audit_log
WHERE table_name = 'marks'
ORDER BY changed_at DESC
LIMIT 50;

-- READ AUDIT LOG FOR ONE STUDENT'S MARKS
SELECT al.log_id, al.operation, al.old_values, al.new_values, al.changed_at
FROM audit_log al
WHERE al.table_name = 'marks'
  AND JSON_EXTRACT(al.new_values, '$.student_id') = 1
ORDER BY al.changed_at DESC;

-- UPDATE MARK (plain — triggers fire automatically)
-- [TRIGGER] trg_mark_update_validation: rejects if new mark < 0 or > 100
-- [TRIGGER] trg_mark_update_timestamp: sets updated_at = NOW() automatically
-- [TRIGGER] trg_mark_audit_log_update: logs old and new values to audit_log
UPDATE marks
SET mark = 92
WHERE student_id = 1 AND subject_id = 1;

-- UPDATE MARK WITH VALIDATION
-- [PROCEDURE] sp_update_mark: validates range and existence before updating
CALL sp_update_mark(
    1,              -- p_student_id
    1,              -- p_subject_id
    95,             -- p_new_mark
    @result_code,
    @result_message
);
SELECT @result_code AS code, @result_message AS message;

-- DELETE MARK
-- [TRIGGER] trg_mark_audit_log_delete: auto-logs the deleted mark to audit_log
DELETE FROM marks
WHERE student_id = 1 AND subject_id = 1;

-- DELETE ALL MARKS FOR A STUDENT
DELETE FROM marks
WHERE student_id = 1;

-- DELETE ALL MARKS FOR A SUBJECT
DELETE FROM marks
WHERE subject_id = 1;

-- ============================================================
-- SECTION 7: ADMINS CRUD
-- ============================================================

-- CREATE
INSERT INTO admins (username, password_hash)
VALUES ('admin1', 'hashed_password_here');

-- READ ALL
SELECT admin_id, username, created_at
FROM admins
ORDER BY admin_id ASC;

-- READ BY USERNAME
SELECT admin_id, username, password_hash
FROM admins
WHERE username = 'admin1';

-- UPDATE PASSWORD
UPDATE admins
SET password_hash = 'new_hashed_password_here'
WHERE username = 'admin1';

-- DELETE (prevent deleting last admin)
DELETE FROM admins
WHERE admin_id = 2
  AND username <> 'admin';

-- ============================================================
-- SECTION 8: REPORTS & DASHBOARDS USING ALL CONCEPTS
-- ============================================================

-- FULL STUDENT REPORT (Procedure + Functions)
-- [PROCEDURE] sp_get_student_report uses fn_calculate_total, fn_calculate_average, fn_get_status
CALL sp_get_student_report(1);

-- CLASS MARK SHEET
-- [VIEW] vw_student_subject_marks
-- [INDEX] idx_students_class + idx_marks_student_subject used internally
SELECT vsm.student_id, vsm.student_name,
       vsm.subject_name, vsm.mark, vsm.total_mark, vsm.percentage
FROM vw_student_subject_marks vsm
JOIN students s ON vsm.student_id = s.student_id
WHERE s.grade = '9A'
ORDER BY vsm.student_name ASC, vsm.subject_name ASC;

-- CLASS LEADERBOARD
-- [VIEW] vw_student_summary with rank + status
SELECT `rank`, student_name, total_marks, average_mark, status
FROM vw_student_summary
ORDER BY `rank` ASC;

-- DEPARTMENT PERFORMANCE DASHBOARD
-- [VIEW] vw_department_performance replaces 4-table GROUP BY aggregation
SELECT department_name, teacher_count, subject_count,
       student_count, department_average, highest_mark, lowest_mark
FROM vw_department_performance
ORDER BY department_average DESC;

-- TEACHER WORKLOAD SUMMARY
-- [VIEW] vw_teacher_subject_assignment
SELECT teacher_name, subject_department, subject_name,
       students_graded, average_mark_given
FROM vw_teacher_subject_assignment
ORDER BY teacher_name ASC;

-- CLASS PERFORMANCE COMPARISON
-- [VIEW] vw_class_performance
-- [FUNCTION] fn_get_class_average for inline use per class
SELECT cp.class_name, cp.student_count,
       cp.class_average, cp.highest_mark, cp.lowest_mark
FROM vw_class_performance cp
ORDER BY cp.class_average DESC;

-- SUBJECT DIFFICULTY ANALYSIS (lowest average = hardest subject)
-- [FUNCTION] fn_get_subject_average
SELECT sub.subject_name,
       fn_get_subject_average(sub.subject_id) AS average_mark
FROM subjects sub
ORDER BY average_mark ASC;

-- FULL AUDIT TRAIL (last 100 changes)
-- [TRIGGER] All audit entries are auto-written; no manual logging code needed
SELECT log_id, table_name, operation, record_id,
       old_values, new_values, changed_at
FROM audit_log
ORDER BY changed_at DESC
LIMIT 100;

-- ============================================================
-- SECTION 9: RANK, TOTAL, AVERAGE & PASS/FAIL QUERIES
-- Using All 5 Concepts
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- A. TOTAL MARKS QUERIES
-- ─────────────────────────────────────────────────────────────

-- A1. Total marks for ONE student
-- [FUNCTION] fn_calculate_total — replaces SUM subquery
SELECT student_id, student_name,
       fn_calculate_total(student_id) AS total_marks
FROM students
WHERE student_id = 1;

-- A2. Total marks for ALL students
-- [FUNCTION] fn_calculate_total called per row — no manual GROUP BY needed
SELECT s.student_id, s.student_name, s.grade,
       fn_calculate_total(s.student_id) AS total_marks
FROM students s
ORDER BY total_marks DESC;

-- A3. Total marks via VIEW (simplest approach)
-- [VIEW] vw_student_summary already has total_marks computed
SELECT student_id, student_name, total_marks
FROM vw_student_summary
ORDER BY total_marks DESC;

-- A4. Total marks per CLASS
-- [FUNCTION] fn_get_class_average + SUM inline per class
SELECT c.class_id, c.class_name,
       SUM(m.mark) AS class_total_marks
FROM classes c
JOIN students s ON s.class_id = c.class_id
JOIN marks m ON m.student_id = s.student_id
GROUP BY c.class_id, c.class_name
ORDER BY class_total_marks DESC;

-- A5. Total marks per SUBJECT
-- [INDEX] idx_marks_subject_mark speeds up aggregation per subject
SELECT sub.subject_id, sub.subject_name,
       SUM(m.mark) AS subject_total_marks,
       COUNT(m.mark_id) AS entries
FROM subjects sub
LEFT JOIN marks m ON m.subject_id = sub.subject_id
GROUP BY sub.subject_id, sub.subject_name
ORDER BY subject_total_marks DESC;

-- ─────────────────────────────────────────────────────────────
-- B. AVERAGE MARK QUERIES
-- ─────────────────────────────────────────────────────────────

-- B1. Average mark for ONE student
-- [FUNCTION] fn_calculate_average — replaces AVG subquery
SELECT student_id, student_name,
       fn_calculate_average(student_id) AS average_mark
FROM students
WHERE student_id = 1;

-- B2. Average mark for ALL students
-- [FUNCTION] fn_calculate_average per row
SELECT s.student_id, s.student_name, s.grade,
       fn_calculate_average(s.student_id) AS average_mark
FROM students s
ORDER BY average_mark DESC;

-- B3. Average mark via VIEW (cleanest)
-- [VIEW] vw_student_summary has average_mark pre-computed
SELECT student_id, student_name, average_mark
FROM vw_student_summary
ORDER BY average_mark DESC;

-- B4. Average mark per SUBJECT
-- [FUNCTION] fn_get_subject_average — avoids writing AVG+JOIN every time
SELECT sub.subject_id, sub.subject_name,
       fn_get_subject_average(sub.subject_id) AS average_mark
FROM subjects sub
ORDER BY average_mark DESC;

-- B5. Average mark per CLASS
-- [FUNCTION] fn_get_class_average + [VIEW] vw_class_performance
SELECT class_id, class_name, class_average
FROM vw_class_performance
ORDER BY class_average DESC;

-- B6. Average mark per SUBJECT with subject details
-- [VIEW] vw_student_subject_marks grouped by subject
SELECT subject_name,
       ROUND(AVG(mark), 2)  AS average_mark,
       MAX(mark)             AS highest_mark,
       MIN(mark)             AS lowest_mark,
       COUNT(student_id)     AS total_students
FROM vw_student_subject_marks
GROUP BY subject_name
ORDER BY average_mark DESC;

-- ─────────────────────────────────────────────────────────────
-- C. PASS / FAIL QUERIES
-- ─────────────────────────────────────────────────────────────

-- C1. Pass/Fail for ONE student (overall)
-- [FUNCTION] fn_get_status — returns 'PASS', 'FAIL', or 'NO MARKS'
SELECT student_id, student_name,
       fn_calculate_average(student_id) AS average_mark,
       fn_get_status(student_id)        AS status
FROM students
WHERE student_id = 1;

-- C2. Pass/Fail for ALL students (overall)
-- [FUNCTION] fn_get_status per row — eliminates CASE WHEN AVG(...) pattern
SELECT s.student_id, s.student_name, s.grade,
       fn_calculate_average(s.student_id) AS average_mark,
       fn_get_status(s.student_id)        AS status
FROM students s
ORDER BY average_mark DESC;

-- C3. Pass/Fail via VIEW (simplest — status is a column)
-- [VIEW] vw_student_summary has status = 'PASS' / 'FAIL' computed
SELECT student_id, student_name, average_mark, status
FROM vw_student_summary
ORDER BY status ASC, average_mark DESC;

-- C4. ALL PASSING students
-- [VIEW] vw_student_summary — filter status column directly
SELECT student_id, student_name, average_mark, `rank`
FROM vw_student_summary
WHERE status = 'PASS'
ORDER BY `rank` ASC;

-- C5. ALL FAILING students
-- [VIEW] vw_student_summary
SELECT student_id, student_name, average_mark
FROM vw_student_summary
WHERE status = 'FAIL'
ORDER BY average_mark DESC;

-- C6. Pass/Fail at SUBJECT LEVEL (per student per subject)
-- [VIEW] vw_student_subject_marks provides mark + percentage per subject
SELECT student_name, subject_name, mark, percentage,
       CASE
           WHEN mark >= 50 THEN 'PASS'
           ELSE 'FAIL'
       END AS subject_status
FROM vw_student_subject_marks
ORDER BY student_name ASC, subject_name ASC;

-- C7. Pass/Fail subject level for ONE student
-- [VIEW] vw_student_subject_marks + CASE — no raw JOINs needed
SELECT subject_name, mark, percentage,
       CASE WHEN mark >= 50 THEN 'PASS' ELSE 'FAIL' END AS subject_status
FROM vw_student_subject_marks
WHERE student_id = 1
ORDER BY subject_name ASC;

-- C8. Count of passed/failed subjects per student
-- [INDEX] idx_marks_student_mark speeds this up
SELECT s.student_id, s.student_name,
       SUM(CASE WHEN m.mark >= 50 THEN 1 ELSE 0 END) AS passed_subjects,
       SUM(CASE WHEN m.mark <  50 THEN 1 ELSE 0 END) AS failed_subjects,
       COUNT(m.mark_id)                               AS total_subjects
FROM students s
LEFT JOIN marks m ON m.student_id = s.student_id
GROUP BY s.student_id, s.student_name
ORDER BY failed_subjects DESC;

-- C9. Class-level Pass/Fail count
-- [VIEW] vw_class_performance for class context
SELECT cp.class_name, cp.student_count, cp.class_average,
       CASE WHEN cp.class_average >= 50 THEN 'ABOVE AVERAGE' ELSE 'BELOW AVERAGE' END AS class_status
FROM vw_class_performance cp
ORDER BY cp.class_average DESC;

-- ─────────────────────────────────────────────────────────────
-- D. RANK QUERIES
-- ─────────────────────────────────────────────────────────────

-- D1. Rank ALL students (simplest — rank is built into view)
-- [VIEW] vw_student_summary uses ROW_NUMBER() OVER (ORDER BY total DESC)
SELECT `rank`, student_id, student_name,
       total_marks, average_mark, status
FROM vw_student_summary
ORDER BY `rank` ASC;

-- D2. Top 5 students (leaderboard)
-- [VIEW] vw_student_summary
SELECT `rank`, student_name, total_marks, average_mark
FROM vw_student_summary
ORDER BY `rank` ASC
LIMIT 5;

-- D3. Rank ONE specific student
-- [VIEW] vw_student_summary — see where a student sits in the class
SELECT `rank`, student_name, total_marks, average_mark, status
FROM vw_student_summary
WHERE student_id = 1;

-- D4. Rank with DENSE_RANK (handles tied marks correctly)
-- [FUNCTION] fn_calculate_total used for the ORDER BY value
-- NOTE: Using CTE because MySQL prohibits stored functions in window ORDER BY
WITH student_totals AS (
    SELECT
        s.student_id,
        s.student_name,
        s.grade,
        fn_calculate_total(s.student_id)   AS total_marks,
        fn_calculate_average(s.student_id) AS average_mark,
        fn_get_status(s.student_id)        AS status
    FROM students s
)
SELECT
    *,
    DENSE_RANK() OVER (ORDER BY total_marks DESC) AS dense_rank
FROM student_totals
ORDER BY dense_rank ASC, student_name ASC;

-- D5. Rank WITHIN a specific CLASS
-- [INDEX] idx_students_class speeds up the class filter
WITH student_class_totals AS (
    SELECT
        s.student_id,
        s.student_name,
        s.class_id,
        c.class_name,
        fn_calculate_total(s.student_id)   AS total_marks,
        fn_calculate_average(s.student_id) AS average_mark
    FROM students s
    JOIN classes c ON s.class_id = c.class_id
)
SELECT
    *,
    DENSE_RANK() OVER (
        PARTITION BY class_id
        ORDER BY total_marks DESC
    ) AS class_rank
FROM student_class_totals
ORDER BY class_name ASC, class_rank ASC;

-- D6. Rank WITHIN a specific GRADE
-- [INDEX] idx_students_name used in ORDER BY
WITH student_grade_totals AS (
    SELECT
        s.student_id,
        s.student_name,
        s.grade,
        fn_calculate_total(s.student_id)   AS total_marks
    FROM students s
    WHERE s.grade = '9A'
)
SELECT
    *,
    DENSE_RANK() OVER (
        ORDER BY total_marks DESC
    ) AS grade_rank
FROM student_grade_totals
ORDER BY grade_rank ASC;

-- D7. Full result sheet: Total + Average + Rank + Pass/Fail in one query
WITH student_full_results AS (
    SELECT
        s.student_id,
        s.student_name,
        s.grade,
        s.academic_year,
        s.semester,
        fn_calculate_total(s.student_id)   AS total_marks,
        fn_calculate_average(s.student_id) AS average_mark,
        fn_get_status(s.student_id)        AS status
    FROM students s
)
SELECT
    *,
    DENSE_RANK() OVER (ORDER BY total_marks DESC) AS `rank`
FROM student_full_results
ORDER BY `rank` ASC, student_name ASC;

-- D8. Full result sheet via VIEW + FUNCTION (cleanest version)
-- [VIEW] vw_student_summary has rank, average, status pre-computed
-- Add grade from students table with a simple JOIN
SELECT
    vss.`rank`,
    vss.student_id,
    vss.student_name,
    s.grade,
    s.academic_year,
    s.semester,
    vss.total_marks,
    vss.average_mark,
    vss.status
FROM vw_student_summary vss
JOIN students s ON s.student_id = vss.student_id
ORDER BY vss.`rank` ASC;

-- D9. Rank via Stored Procedure (full report per student)
-- [PROCEDURE] sp_get_student_report returns rank-related stats internally
CALL sp_get_student_report(1);

-- ─────────────────────────────────────────────────────────────
-- E. COMBINED: Total + Average + Pass/Fail + Rank in one sheet
-- ─────────────────────────────────────────────────────────────

-- E1. Complete academic result card per student (all in one query)
-- [VIEW]      vw_student_summary  — rank, total, average, status
-- [VIEW]      vw_student_subject_marks — per-subject marks and percentage
-- [FUNCTION]  fn_calculate_total, fn_calculate_average, fn_get_status
-- [INDEX]     idx_marks_student_subject for fast subject mark lookups
SELECT
    vss.`rank`                                       AS overall_rank,
    vss.student_id,
    vss.student_name,
    s.grade,
    s.academic_year,
    s.semester,
    vss.total_subjects,
    vss.total_marks,
    vss.average_mark,
    vss.status                                       AS overall_status,
    GROUP_CONCAT(
        CONCAT(vsm.subject_name, ': ', vsm.mark, '/', vsm.total_mark)
        ORDER BY vsm.subject_name ASC
        SEPARATOR ' | '
    )                                                AS subject_marks
FROM vw_student_summary vss
JOIN students s ON s.student_id = vss.student_id
LEFT JOIN vw_student_subject_marks vsm ON vsm.student_id = vss.student_id
GROUP BY vss.`rank`, vss.student_id, vss.student_name,
         s.grade, s.academic_year, s.semester,
         vss.total_subjects, vss.total_marks, vss.average_mark, vss.status
ORDER BY vss.`rank` ASC;

-- E2. Class result sheet with subject-level Pass/Fail
-- [VIEW] vw_student_subject_marks + [VIEW] vw_student_summary
SELECT
    vss.`rank`,
    vss.student_name,
    s.grade,
    vsm.subject_name,
    vsm.mark,
    vsm.percentage,
    CASE WHEN vsm.mark >= 50 THEN 'PASS' ELSE 'FAIL' END AS subject_status,
    vss.total_marks,
    vss.average_mark,
    vss.status AS overall_status
FROM vw_student_summary vss
JOIN students s ON s.student_id = vss.student_id
LEFT JOIN vw_student_subject_marks vsm ON vsm.student_id = vss.student_id
ORDER BY vss.`rank` ASC, vsm.subject_name ASC;

-- ============================================================
-- SECTION 10: ERROR HANDLING & VALIDATION EXAMPLES
-- ============================================================

-- ERROR HANDLING: Procedure Result Codes
-- [PROCEDURE] sp_insert_mark returns result codes for different scenarios

-- Scenario 1: Successful mark insertion
CALL sp_insert_mark(1, 1, 85, @code, @msg);
SELECT @code AS result_code, @msg AS message;
-- Expected: @code = 0, @msg = 'Mark inserted successfully'

-- Scenario 2: Student not found (result_code = -1)
CALL sp_insert_mark(9999, 1, 85, @code, @msg);
SELECT @code AS result_code, @msg AS message;
-- Expected: @code = -1, @msg = 'Student not found'

-- Scenario 3: Subject not found (result_code = -2)
CALL sp_insert_mark(1, 9999, 85, @code, @msg);
SELECT @code AS result_code, @msg AS message;
-- Expected: @code = -2, @msg = 'Subject not found'

-- Scenario 4: Mark out of range (result_code = -3)
CALL sp_insert_mark(1, 1, 150, @code, @msg);
SELECT @code AS result_code, @msg AS message;
-- Expected: @code = -3, @msg = 'Mark must be between 0 and 100'

-- Scenario 5: Duplicate mark (result_code = -4)
-- First insert succeeds
CALL sp_insert_mark(1, 1, 85, @code, @msg);
-- Second insert for same student+subject fails
CALL sp_insert_mark(1, 1, 90, @code, @msg);
SELECT @code AS result_code, @msg AS message;
-- Expected: @code = -4, @msg = 'Mark already exists for this student-subject combination'

-- Scenario 6: Mark exceeds subject total (result_code = -5)
-- Assuming subject 1 has total_mark = 100
CALL sp_insert_mark(1, 1, 101, @code, @msg);
SELECT @code AS result_code, @msg AS message;
-- Expected: @code = -5, @msg = 'Mark cannot exceed subject total mark'

-- ERROR HANDLING: Checking result codes in application logic
-- Pattern: Always check @result_code before proceeding
CALL sp_add_student('Test Student', 'Male', '9A', 1, '2025/2026', '1', @id, @code, @msg);
IF @code = 0 THEN
    SELECT CONCAT('Success! New student ID: ', @id) AS result;
ELSE
    SELECT CONCAT('Error (', @code, '): ', @msg) AS error;
END IF;

-- ============================================================
-- SECTION 11: TRANSACTION & ROLLBACK EXAMPLES
-- ============================================================

-- TRANSACTION 1: Multi-step student enrollment (atomic operation)
-- [TRIGGER] Triggers fire within transaction and can cause rollback
START TRANSACTION;
    -- Step 1: Add student
    CALL sp_add_student('John Doe', 'Male', '9A', 1, '2025/2026', '1', @student_id, @code1, @msg1);
    
    -- Step 2: Check if student was added successfully
    IF @code1 <> 0 THEN
        ROLLBACK;
        SELECT CONCAT('Failed to add student: ', @msg1) AS error;
    ELSE
        -- Step 3: Add marks for multiple subjects
        CALL sp_insert_mark(@student_id, 1, 85, @code2, @msg2);
        IF @code2 <> 0 THEN
            ROLLBACK;
            SELECT CONCAT('Failed to add mark: ', @msg2) AS error;
        ELSE
            CALL sp_insert_mark(@student_id, 2, 90, @code3, @msg3);
            IF @code3 <> 0 THEN
                ROLLBACK;
                SELECT CONCAT('Failed to add mark: ', @msg3) AS error;
            ELSE
                -- All steps successful, commit
                COMMIT;
                SELECT CONCAT('Student ', @student_id, ' enrolled successfully with marks') AS success;
            END IF;
        END IF;
    END IF;

-- TRANSACTION 2: Bulk mark update with validation
-- [TRIGGER] trg_mark_update_validation fires for each update
START TRANSACTION;
    UPDATE marks SET mark = 88 WHERE student_id = 1 AND subject_id = 1;
    UPDATE marks SET mark = 92 WHERE student_id = 1 AND subject_id = 2;
    UPDATE marks SET mark = 95 WHERE student_id = 1 AND subject_id = 3;
    -- If any trigger rejects (mark < 0 or > 100), entire transaction rolls back
    COMMIT;

-- TRANSACTION 3: Semester promotion with rollback on error
-- [INDEX] idx_students_class speeds up the WHERE clause
START TRANSACTION;
    -- Promote all students in class 1 from semester 1 to semester 2
    UPDATE students 
    SET semester = '2' 
    WHERE class_id = 1 AND semester = '1' AND academic_year = '2025/2026';
    
    -- Verify update count
    SELECT ROW_COUNT() AS students_promoted;
    
    -- If no students were promoted, rollback
    IF ROW_COUNT() = 0 THEN
        ROLLBACK;
        SELECT 'No students found to promote' AS warning;
    ELSE
        COMMIT;
        SELECT 'Semester promotion completed' AS success;
    END IF;

-- TRANSACTION 4: Using SAVEPOINT for partial rollback
START TRANSACTION;
    -- Insert first mark
    INSERT INTO marks (student_id, subject_id, teacher_id, mark) VALUES (1, 1, 1, 85);
    SAVEPOINT sp1;
    
    -- Insert second mark
    INSERT INTO marks (student_id, subject_id, teacher_id, mark) VALUES (1, 2, 1, 90);
    SAVEPOINT sp2;
    
    -- Insert third mark (might fail)
    INSERT INTO marks (student_id, subject_id, teacher_id, mark) VALUES (1, 3, 1, 95);
    
    -- If third insert failed, rollback to sp2 (keeps first two)
    -- Otherwise commit all
    COMMIT;

-- ============================================================
-- SECTION 12: AUDIT LOG ANALYSIS
-- ============================================================

-- AUDIT LOG 1: View all changes to marks table
-- [TRIGGER] trg_mark_audit_log, trg_mark_audit_log_update, trg_mark_audit_log_delete
SELECT 
    log_id,
    operation,
    record_id,
    old_values,
    new_values,
    changed_at
FROM audit_log
WHERE table_name = 'marks'
ORDER BY changed_at DESC
LIMIT 20;

-- AUDIT LOG 2: Track changes for specific student's marks
-- [FUNCTION] JSON_EXTRACT to parse JSON values
SELECT 
    log_id,
    operation,
    changed_at,
    JSON_EXTRACT(old_values, '$.mark') AS old_mark,
    JSON_EXTRACT(new_values, '$.mark') AS new_mark,
    JSON_EXTRACT(new_values, '$.subject_id') AS subject_id
FROM audit_log
WHERE table_name = 'marks'
  AND (JSON_EXTRACT(old_values, '$.student_id') = 1 
       OR JSON_EXTRACT(new_values, '$.student_id') = 1)
ORDER BY changed_at DESC;

-- AUDIT LOG 3: Find all mark changes within date range
-- [INDEX] idx_audit_log_date speeds up date filtering
SELECT 
    log_id,
    operation,
    record_id,
    changed_at,
    JSON_EXTRACT(new_values, '$.student_id') AS student_id,
    JSON_EXTRACT(new_values, '$.mark') AS mark
FROM audit_log
WHERE table_name = 'marks'
  AND changed_at BETWEEN '2025-01-01' AND '2025-12-31'
  AND operation IN ('INSERT', 'UPDATE')
ORDER BY changed_at DESC;

-- AUDIT LOG 4: Detect who updated marks and when
-- [TRIGGER] Audit log captures all changes automatically
SELECT 
    log_id,
    operation,
    record_id,
    changed_at,
    JSON_EXTRACT(old_values, '$.mark') AS previous_mark,
    JSON_EXTRACT(new_values, '$.mark') AS current_mark,
    JSON_EXTRACT(new_values, '$.teacher_id') AS teacher_id
FROM audit_log
WHERE table_name = 'marks'
  AND operation = 'UPDATE'
ORDER BY changed_at DESC
LIMIT 50;

-- AUDIT LOG 5: Analyze mark change patterns
-- Find marks that were changed multiple times
SELECT 
    record_id,
    COUNT(*) AS change_count,
    MIN(changed_at) AS first_change,
    MAX(changed_at) AS last_change,
    GROUP_CONCAT(DISTINCT operation) AS operations
FROM audit_log
WHERE table_name = 'marks'
GROUP BY record_id
HAVING change_count > 1
ORDER BY change_count DESC;

-- ============================================================
-- SECTION 13: DATA INTEGRITY & VALIDATION CHECKS
-- ============================================================

-- INTEGRITY CHECK 1: Verify no orphaned marks (marks without students)
-- [INDEX] idx_marks_student_subject speeds up this check
SELECT m.mark_id, m.student_id, m.subject_id, m.mark
FROM marks m
LEFT JOIN students s ON m.student_id = s.student_id
WHERE s.student_id IS NULL;
-- Expected: Empty result set (no orphaned marks)

-- INTEGRITY CHECK 2: Verify no orphaned marks (marks without subjects)
SELECT m.mark_id, m.student_id, m.subject_id, m.mark
FROM marks m
LEFT JOIN subjects sub ON m.subject_id = sub.subject_id
WHERE sub.subject_id IS NULL;
-- Expected: Empty result set

-- INTEGRITY CHECK 3: Verify all marks are within valid range (0-100)
-- [TRIGGER] trg_mark_insert_validation and trg_mark_update_validation prevent this
SELECT mark_id, student_id, subject_id, mark
FROM marks
WHERE mark < 0 OR mark > 100;
-- Expected: Empty result set (triggers prevent invalid marks)

-- INTEGRITY CHECK 4: Verify no duplicate marks (one mark per student per subject)
-- [PROCEDURE] sp_insert_mark prevents duplicates
SELECT student_id, subject_id, COUNT(*) AS mark_count
FROM marks
GROUP BY student_id, subject_id
HAVING mark_count > 1;
-- Expected: Empty result set (no duplicates)

-- INTEGRITY CHECK 5: Verify all students have valid class assignments
SELECT s.student_id, s.student_name, s.class_id
FROM students s
LEFT JOIN classes c ON s.class_id = c.class_id
WHERE s.class_id IS NOT NULL AND c.class_id IS NULL;
-- Expected: Empty result set (all students have valid classes)

-- INTEGRITY CHECK 6: Verify all subjects have valid departments
SELECT s.subject_id, s.subject_name, s.department_id
FROM subjects s
LEFT JOIN departments d ON s.department_id = d.department_id
WHERE d.department_id IS NULL;
-- Expected: Empty result set (all subjects have valid departments)

-- INTEGRITY CHECK 7: Verify all teachers have valid departments
SELECT t.teacher_id, t.teacher_name, t.department_id
FROM teachers t
LEFT JOIN departments d ON t.department_id = d.department_id
WHERE t.department_id IS NOT NULL AND d.department_id IS NULL;
-- Expected: Empty result set (all teachers have valid departments)

-- INTEGRITY CHECK 8: Verify homeroom teacher constraint (one per class)
-- [TRIGGER] trg_teacher_homeroom_constraint enforces this
SELECT assigned_class_id, COUNT(*) AS homeroom_count
FROM teachers
WHERE role = 'Homeroom Teacher' AND assigned_class_id IS NOT NULL
GROUP BY assigned_class_id
HAVING homeroom_count > 1;
-- Expected: Empty result set (no class has multiple homeroom teachers)

-- ============================================================
-- SECTION 14: PERFORMANCE OPTIMIZATION & QUERY ANALYSIS
-- ============================================================

-- PERFORMANCE 1: Explain query plan for student marks lookup
-- [INDEX] idx_marks_student_subject should be used
EXPLAIN SELECT * FROM vw_student_subject_marks WHERE student_id = 1;
-- Expected: Using index 'idx_marks_student_subject'

-- PERFORMANCE 2: Explain query plan for ranking query
-- [VIEW] vw_student_summary uses ROW_NUMBER() efficiently
EXPLAIN SELECT * FROM vw_student_summary ORDER BY `rank` ASC;
-- Expected: Efficient execution using view

-- PERFORMANCE 3: Explain query plan for class performance
-- [INDEX] idx_students_class should be used
EXPLAIN SELECT * FROM vw_class_performance WHERE class_id = 1;
-- Expected: Using index for class filtering

-- PERFORMANCE 4: Compare slow query vs optimized query
-- SLOW: Without index (full table scan)
SELECT s.student_id, s.student_name, COUNT(m.mark_id) AS mark_count
FROM students s
LEFT JOIN marks m ON s.student_id = m.student_id
WHERE s.student_name LIKE '%John%'
GROUP BY s.student_id, s.student_name;

-- OPTIMIZED: With index on student_name
-- [INDEX] idx_students_name speeds this up
SELECT s.student_id, s.student_name, COUNT(m.mark_id) AS mark_count
FROM students s
LEFT JOIN marks m ON s.student_id = m.student_id
WHERE s.student_name = 'John Doe'
GROUP BY s.student_id, s.student_name;

-- PERFORMANCE 5: Update table statistics for optimizer
-- Run this periodically to keep query plans optimal
ANALYZE TABLE students;
ANALYZE TABLE marks;
ANALYZE TABLE subjects;
ANALYZE TABLE teachers;
ANALYZE TABLE classes;
ANALYZE TABLE departments;
ANALYZE TABLE audit_log;

-- ============================================================
-- SECTION 15: BULK OPERATIONS & BATCH PROCESSING
-- ============================================================

-- BULK INSERT 1: Add multiple students efficiently
-- [TRIGGER] Triggers fire for each row but transaction is atomic
INSERT INTO students (student_name, gender, grade, class_id, academic_year, semester)
VALUES 
    ('Student One', 'Male', '9A', 1, '2025/2026', '1'),
    ('Student Two', 'Female', '9A', 1, '2025/2026', '1'),
    ('Student Three', 'Male', '9B', 2, '2025/2026', '1'),
    ('Student Four', 'Female', '9B', 2, '2025/2026', '1');

-- BULK INSERT 2: Add multiple marks efficiently
-- [TRIGGER] trg_mark_insert_validation fires for each row
INSERT INTO marks (student_id, subject_id, teacher_id, mark)
VALUES 
    (1, 1, 1, 85),
    (1, 2, 1, 90),
    (1, 3, 2, 88),
    (2, 1, 1, 92),
    (2, 2, 1, 87),
    (2, 3, 2, 91);

-- BULK UPDATE 1: Update all marks for a subject
-- [INDEX] idx_marks_subject_mark speeds this up
UPDATE marks
SET mark = mark + 5
WHERE subject_id = 1 AND mark < 95;

-- BULK UPDATE 2: Promote all students to next semester
-- [INDEX] idx_students_class speeds this up
UPDATE students
SET semester = '2'
WHERE academic_year = '2025/2026' AND semester = '1';

-- BULK DELETE 1: Remove all marks for a student
-- [TRIGGER] trg_mark_audit_log_delete logs each deletion
DELETE FROM marks
WHERE student_id = 1;

-- BULK DELETE 2: Remove students with no marks
-- [INDEX] idx_marks_student_subject used in subquery
DELETE FROM students
WHERE student_id NOT IN (
    SELECT DISTINCT student_id FROM marks
);

-- ============================================================
-- SECTION 16: ADVANCED REPORTING & ANALYTICS
-- ============================================================

-- REPORT 1: Semester-over-semester performance comparison
-- Compare student performance between semesters
SELECT 
    s.student_id,
    s.student_name,
    s.grade,
    s.academic_year,
    s.semester,
    fn_calculate_average(s.student_id) AS semester_average,
    fn_get_status(s.student_id) AS semester_status
FROM students s
WHERE s.academic_year = '2025/2026'
ORDER BY s.student_id, s.semester;

-- REPORT 2: Year-over-year performance trend
-- Track student progress across academic years
SELECT 
    s.student_id,
    s.student_name,
    s.academic_year,
    fn_calculate_average(s.student_id) AS yearly_average,
    COUNT(DISTINCT m.subject_id) AS subjects_taken
FROM students s
LEFT JOIN marks m ON s.student_id = m.student_id
GROUP BY s.student_id, s.student_name, s.academic_year
ORDER BY s.student_id, s.academic_year;

-- REPORT 3: Subject difficulty ranking (by average marks)
-- Identify hardest and easiest subjects
SELECT 
    sub.subject_id,
    sub.subject_name,
    d.department_name,
    fn_get_subject_average(sub.subject_id) AS average_mark,
    COUNT(m.mark_id) AS total_marks_recorded,
    MIN(m.mark) AS lowest_mark,
    MAX(m.mark) AS highest_mark
FROM subjects sub
LEFT JOIN departments d ON sub.department_id = d.department_id
LEFT JOIN marks m ON sub.subject_id = m.subject_id
GROUP BY sub.subject_id, sub.subject_name, d.department_name
ORDER BY average_mark ASC;

-- REPORT 4: Teacher performance analysis
-- Analyze average marks given by each teacher
SELECT 
    t.teacher_id,
    t.teacher_name,
    d.department_name,
    COUNT(DISTINCT m.mark_id) AS marks_given,
    ROUND(AVG(m.mark), 2) AS average_mark_given,
    MIN(m.mark) AS lowest_mark_given,
    MAX(m.mark) AS highest_mark_given
FROM teachers t
LEFT JOIN departments d ON t.department_id = d.department_id
LEFT JOIN marks m ON t.teacher_id = m.teacher_id
GROUP BY t.teacher_id, t.teacher_name, d.department_name
ORDER BY average_mark_given DESC;

-- REPORT 5: Class performance trend
-- Track class average over time
SELECT 
    c.class_id,
    c.class_name,
    s.academic_year,
    s.semester,
    fn_get_class_average(c.class_id) AS class_average,
    COUNT(DISTINCT s.student_id) AS student_count
FROM classes c
LEFT JOIN students s ON c.class_id = s.class_id
GROUP BY c.class_id, c.class_name, s.academic_year, s.semester
ORDER BY c.class_id, s.academic_year, s.semester;

-- ============================================================
-- SECTION 17: EDGE CASES & BOUNDARY TESTING
-- ============================================================

-- EDGE CASE 1: Student with no marks
-- [FUNCTION] fn_get_status returns 'NO MARKS' for students without marks
SELECT 
    s.student_id,
    s.student_name,
    fn_calculate_total(s.student_id) AS total_marks,
    fn_calculate_average(s.student_id) AS average_mark,
    fn_get_status(s.student_id) AS status
FROM students s
WHERE s.student_id NOT IN (SELECT DISTINCT student_id FROM marks);

-- EDGE CASE 2: Subject with no marks recorded
-- [VIEW] vw_student_subject_marks will have no rows for this subject
SELECT 
    sub.subject_id,
    sub.subject_name,
    COUNT(m.mark_id) AS marks_recorded
FROM subjects sub
LEFT JOIN marks m ON sub.subject_id = m.subject_id
GROUP BY sub.subject_id, sub.subject_name
HAVING marks_recorded = 0;

-- EDGE CASE 3: Boundary value - mark = 0 (minimum)
-- [TRIGGER] trg_mark_insert_validation allows 0 (valid range 0-100)
INSERT INTO marks (student_id, subject_id, teacher_id, mark) VALUES (1, 1, 1, 0);
-- Expected: Success (0 is valid)

-- EDGE CASE 4: Boundary value - mark = 100 (maximum)
-- [TRIGGER] trg_mark_insert_validation allows 100
INSERT INTO marks (student_id, subject_id, teacher_id, mark) VALUES (1, 2, 1, 100);
-- Expected: Success (100 is valid)

-- EDGE CASE 5: Boundary value - mark = -1 (invalid minimum)
-- [TRIGGER] trg_mark_insert_validation rejects this
INSERT INTO marks (student_id, subject_id, teacher_id, mark) VALUES (1, 3, 1, -1);
-- Expected: Error - Mark must be between 0 and 100

-- EDGE CASE 6: Boundary value - mark = 101 (invalid maximum)
-- [TRIGGER] trg_mark_insert_validation rejects this
INSERT INTO marks (student_id, subject_id, teacher_id, mark) VALUES (1, 4, 1, 101);
-- Expected: Error - Mark must be between 0 and 100

-- EDGE CASE 7: NULL values in optional fields
-- [PROCEDURE] sp_add_student handles NULL class_id
CALL sp_add_student(
    'Unassigned Student',
    'Male',
    '10A',
    NULL,  -- NULL class_id (optional)
    '2025/2026',
    '1',
    @id,
    @code,
    @msg
);
SELECT @id AS student_id, @code AS code, @msg AS message;

-- EDGE CASE 8: Empty result sets
-- Query that returns no rows (student with no marks)
SELECT * FROM vw_student_subject_marks WHERE student_id = 9999;
-- Expected: Empty result set (no error)

-- EDGE CASE 9: Duplicate prevention
-- [PROCEDURE] sp_insert_mark prevents duplicate marks
CALL sp_insert_mark(1, 1, 85, @code, @msg);
-- First call succeeds
CALL sp_insert_mark(1, 1, 90, @code, @msg);
-- Second call fails with @code = -4 (duplicate)

-- EDGE CASE 10: Class average with mixed marks
-- Class with students having 0, 50, 100 marks
-- [FUNCTION] fn_get_class_average should calculate correctly
SELECT 
    c.class_id,
    c.class_name,
    fn_get_class_average(c.class_id) AS class_average,
    MIN(m.mark) AS lowest_mark,
    MAX(m.mark) AS highest_mark
FROM classes c
LEFT JOIN students s ON c.class_id = s.class_id
LEFT JOIN marks m ON s.student_id = m.student_id
GROUP BY c.class_id, c.class_name;

-- ============================================================
-- SECTION 18: BEST PRACTICES & TROUBLESHOOTING
-- ============================================================

-- BEST PRACTICE 1: Always check procedure result codes
-- ✓ CORRECT: Check result code before proceeding
CALL sp_insert_mark(1, 1, 85, @code, @msg);
IF @code = 0 THEN
    SELECT 'Mark inserted successfully' AS result;
ELSE
    SELECT CONCAT('Error: ', @msg) AS error;
END IF;

-- ✗ INCORRECT: Ignoring result code
CALL sp_insert_mark(1, 1, 85, @code, @msg);
SELECT 'Mark inserted' AS result;  -- Might be false!

-- BEST PRACTICE 2: Use transactions for multi-step operations
-- ✓ CORRECT: Atomic operation with rollback on error
START TRANSACTION;
    CALL sp_add_student('John', 'Male', '9A', 1, '2025/2026', '1', @id, @c1, @m1);
    IF @c1 = 0 THEN
        CALL sp_insert_mark(@id, 1, 85, @c2, @m2);
        IF @c2 = 0 THEN
            COMMIT;
        ELSE
            ROLLBACK;
        END IF;
    ELSE
        ROLLBACK;
    END IF;

-- ✗ INCORRECT: No transaction (partial updates possible)
CALL sp_add_student('John', 'Male', '9A', 1, '2025/2026', '1', @id, @c1, @m1);
CALL sp_insert_mark(@id, 1, 85, @c2, @m2);
-- If second call fails, student exists but has no marks

-- BEST PRACTICE 3: Use views for complex queries
-- ✓ CORRECT: Simple, readable, maintainable
SELECT * FROM vw_student_summary WHERE status = 'PASS' ORDER BY `rank`;

-- ✗ INCORRECT: Complex JOIN repeated everywhere
SELECT s.student_id, s.student_name, SUM(m.mark) AS total,
       AVG(m.mark) AS average,
       CASE WHEN AVG(m.mark) >= 50 THEN 'PASS' ELSE 'FAIL' END AS status,
       ROW_NUMBER() OVER (ORDER BY SUM(m.mark) DESC) AS `rank`
FROM students s
LEFT JOIN marks m ON s.student_id = m.student_id
GROUP BY s.student_id, s.student_name
HAVING status = 'PASS'
ORDER BY `rank`;

-- BEST PRACTICE 4: Use functions for calculations
-- ✓ CORRECT: Consistent, reusable, maintainable
SELECT s.student_id, s.student_name,
       fn_calculate_total(s.student_id) AS total,
       fn_calculate_average(s.student_id) AS average,
       fn_get_status(s.student_id) AS status
FROM students s;

-- ✗ INCORRECT: Manual calculations repeated
SELECT s.student_id, s.student_name,
       SUM(m.mark) AS total,
       AVG(m.mark) AS average,
       CASE WHEN AVG(m.mark) >= 50 THEN 'PASS' ELSE 'FAIL' END AS status
FROM students s
LEFT JOIN marks m ON s.student_id = m.student_id
GROUP BY s.student_id, s.student_name;

-- BEST PRACTICE 5: Use procedures for validation
-- ✓ CORRECT: Validation at database level
CALL sp_insert_mark(1, 1, 85, @code, @msg);
-- Validates: student exists, subject exists, mark in range, no duplicate

-- ✗ INCORRECT: Validation only in application
INSERT INTO marks (student_id, subject_id, teacher_id, mark) VALUES (1, 1, 1, 85);
-- No validation - invalid data can be inserted if app code has bugs

-- TROUBLESHOOTING 1: Procedure returns error code -1 (student not found)
-- Check if student_id exists
SELECT * FROM students WHERE student_id = 1;
-- If empty, student doesn't exist - use correct student_id

-- TROUBLESHOOTING 2: Procedure returns error code -4 (duplicate mark)
-- Check if mark already exists for this student-subject combination
SELECT * FROM marks WHERE student_id = 1 AND subject_id = 1;
-- If found, update instead of insert: CALL sp_update_mark(1, 1, new_mark, @c, @m);

-- TROUBLESHOOTING 3: Query returns no results
-- Check if data exists
SELECT COUNT(*) FROM students;
SELECT COUNT(*) FROM marks;
-- If counts are 0, insert sample data first

-- TROUBLESHOOTING 4: Slow query performance
-- Check if indexes are being used
EXPLAIN SELECT * FROM marks WHERE student_id = 1;
-- Look for "Using index" in Extra column
-- If not using index, run: ANALYZE TABLE marks;

-- TROUBLESHOOTING 5: Trigger not firing
-- Verify trigger exists
SELECT * FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_NAME = 'trg_mark_insert_validation';
-- If empty, trigger doesn't exist - run 05-triggers.sql

-- ============================================================
-- SUMMARY: HOW EACH CONCEPT REDUCES CRUD COMPLEXITY
-- ============================================================
/*
  1. VIEWS (READ)
     Before : 3-4 table JOINs repeated in every SELECT query
     After  : SELECT * FROM vw_student_subject_marks WHERE student_id = ?
     Views  : vw_student_subject_marks, vw_student_summary,
               vw_class_performance, vw_teacher_subject_assignment,
               vw_department_performance

  2. STORED PROCEDURES (CREATE / UPDATE / READ)
     Before : Raw INSERT/UPDATE with manual validation in application code
     After  : CALL sp_add_student(...); CALL sp_insert_mark(...);
     Procs  : sp_add_student, sp_insert_mark, sp_update_mark,
               sp_get_student_report

  3. FUNCTIONS (READ / COMPUTE)
     Before : Subqueries or manual SUM/AVG/CASE expressions inside every SELECT
     After  : fn_calculate_total(id), fn_calculate_average(id), fn_get_status(id)
     Funcs  : fn_calculate_total, fn_calculate_average, fn_get_status,
               fn_get_subject_average, fn_get_class_average

  4. TRIGGERS (CREATE / UPDATE / DELETE — automatic)
     Before : Application code must validate mark range + write audit log manually
     After  : Triggers auto-validate (BEFORE) and auto-log (AFTER) — zero app code
     Triggers: trg_mark_insert_validation, trg_mark_update_validation,
                trg_mark_update_timestamp, trg_mark_audit_log,
                trg_mark_audit_log_update, trg_mark_audit_log_delete,
                trg_teacher_homeroom_constraint

  5. INDEXES (READ — performance)
     Before : Full table scan on every WHERE / JOIN / ORDER BY column
     After  : Index lookup — milliseconds vs seconds on large data
     Indexes: idx_marks_student_subject, idx_marks_student_mark,
               idx_marks_subject_mark, idx_students_class,
               idx_students_name, idx_subjects_name,
               idx_teachers_name, idx_departments_name,
               idx_audit_log_date, idx_marks_value_range

  SECTIONS IN THIS FILE:
  ─────────────────────
  1. Departments CRUD
  2. Classes CRUD
  3. Students CRUD
  4. Teachers CRUD
  5. Subjects CRUD
  6. Marks CRUD
  7. Admins CRUD
  8. Reports & Dashboards
  9. Rank, Total, Average & Pass/Fail Queries
  10. Error Handling & Validation Examples
  11. Transaction & Rollback Examples
  12. Audit Log Analysis
  13. Data Integrity & Validation Checks
  14. Performance Optimization & Query Analysis
  15. Bulk Operations & Batch Processing
  16. Advanced Reporting & Analytics
  17. Edge Cases & Boundary Testing
  18. Best Practices & Troubleshooting
*/