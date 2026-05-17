-- ============================================================
-- CONCEPT 2: VIEWS - Provide consistent data access patterns
-- ============================================================

USE student_academic_management_v2;

-- View 1: Student marks with percentages
DROP VIEW IF EXISTS vw_student_subject_marks;
CREATE VIEW vw_student_subject_marks AS
SELECT
    s.student_id,
    s.student_name,
    s.grade,
    s.academic_year,
    sub.subject_id,
    sub.subject_name,
    d.department_name,
    m.mark,
    sub.total_mark,
    ROUND((m.mark / sub.total_mark) * 100, 2) AS percentage,
    m.created_at,
    m.updated_at
FROM marks m
JOIN students s ON m.student_id = s.student_id
JOIN subjects sub ON m.subject_id = sub.subject_id
JOIN departments d ON sub.department_id = d.department_id;

-- View 2: Student rankings with status
DROP VIEW IF EXISTS vw_student_summary;
CREATE VIEW vw_student_summary AS
SELECT
    s.student_id,
    s.student_name,
    s.grade,
    s.academic_year,
    s.semester,
    c.class_name,
    COUNT(m.subject_id) AS total_subjects,
    SUM(m.mark) AS total_marks,
    ROUND(AVG(m.mark), 2) AS average_mark,
    ROW_NUMBER() OVER (ORDER BY SUM(m.mark) DESC) AS rank,
    CASE
        WHEN AVG(m.mark) >= 50 THEN 'PASS'
        ELSE 'FAIL'
    END AS status
FROM students s
LEFT JOIN classes c ON s.class_id = c.class_id
LEFT JOIN marks m ON s.student_id = m.student_id
GROUP BY s.student_id, s.student_name, s.grade, s.academic_year, s.semester, c.class_name;

-- View 3: Class performance analytics
DROP VIEW IF EXISTS vw_class_performance;
CREATE VIEW vw_class_performance AS
SELECT
    c.class_id,
    c.class_name,
    COUNT(DISTINCT s.student_id) AS student_count,
    COUNT(m.mark_id) AS mark_count,
    ROUND(AVG(m.mark), 2) AS class_average,
    MAX(m.mark) AS highest_mark,
    MIN(m.mark) AS lowest_mark,
    COUNT(DISTINCT s.academic_year) AS academic_years
FROM classes c
LEFT JOIN students s ON s.class_id = c.class_id
LEFT JOIN marks m ON s.student_id = m.student_id
GROUP BY c.class_id, c.class_name;

-- View 4: Teacher workload and grading statistics
DROP VIEW IF EXISTS vw_teacher_subject_assignment;
CREATE VIEW vw_teacher_subject_assignment AS
SELECT
    t.teacher_id,
    t.teacher_name,
    t.role,
    d.department_id,
    d.department_name,
    sub.subject_id,
    sub.subject_name,
    COUNT(DISTINCT m.student_id) AS students_graded,
    COUNT(m.mark_id) AS total_marks_recorded,
    ROUND(AVG(m.mark), 2) AS average_mark_given,
    MAX(m.mark) AS highest_mark_given,
    MIN(m.mark) AS lowest_mark_given
FROM teachers t
JOIN departments d ON t.department_id = d.department_id
LEFT JOIN subjects sub ON t.teacher_id = sub.teacher_id
LEFT JOIN marks m ON sub.subject_id = m.subject_id
GROUP BY t.teacher_id, t.teacher_name, t.role, d.department_id, d.department_name, sub.subject_id, sub.subject_name;

-- View 5: Department performance analysis
DROP VIEW IF EXISTS vw_department_performance;
CREATE VIEW vw_department_performance AS
SELECT
    d.department_id,
    d.department_name,
    COUNT(DISTINCT t.teacher_id) AS teacher_count,
    COUNT(DISTINCT sub.subject_id) AS subject_count,
    COUNT(DISTINCT s.student_id) AS student_count,
    COUNT(m.mark_id) AS total_marks_recorded,
    ROUND(AVG(m.mark), 2) AS department_average,
    MAX(m.mark) AS highest_mark,
    MIN(m.mark) AS lowest_mark,
    ROUND(STDDEV(m.mark), 2) AS mark_stddev
FROM departments d
LEFT JOIN teachers t ON d.department_id = t.department_id
LEFT JOIN subjects sub ON d.department_id = sub.department_id
LEFT JOIN marks m ON sub.subject_id = m.subject_id
LEFT JOIN students s ON m.student_id = s.student_id
GROUP BY d.department_id, d.department_name;

-- View 6: Subject difficulty analysis
DROP VIEW IF EXISTS vw_subject_difficulty;
CREATE VIEW vw_subject_difficulty AS
SELECT
    sub.subject_id,
    sub.subject_name,
    d.department_name,
    t.teacher_name,
    COUNT(DISTINCT m.student_id) AS students_taking,
    COUNT(m.mark_id) AS total_marks,
    ROUND(AVG(m.mark), 2) AS average_mark,
    MAX(m.mark) AS highest_mark,
    MIN(m.mark) AS lowest_mark,
    ROUND(STDDEV(m.mark), 2) AS mark_stddev,
    ROUND(SUM(CASE WHEN m.mark >= 50 THEN 1 ELSE 0 END) / COUNT(m.mark_id) * 100, 2) AS pass_rate
FROM subjects sub
LEFT JOIN departments d ON sub.department_id = d.department_id
LEFT JOIN teachers t ON sub.teacher_id = t.teacher_id
LEFT JOIN marks m ON sub.subject_id = m.subject_id
GROUP BY sub.subject_id, sub.subject_name, d.department_name, t.teacher_name;

-- View 7: Class-wise subject performance
DROP VIEW IF EXISTS vw_class_subject_performance;
CREATE VIEW vw_class_subject_performance AS
SELECT
    c.class_id,
    c.class_name,
    sub.subject_id,
    sub.subject_name,
    COUNT(DISTINCT s.student_id) AS students_in_class,
    COUNT(m.mark_id) AS marks_recorded,
    ROUND(AVG(m.mark), 2) AS class_subject_average,
    MAX(m.mark) AS highest_mark,
    MIN(m.mark) AS lowest_mark
FROM classes c
LEFT JOIN students s ON c.class_id = s.class_id
LEFT JOIN marks m ON s.student_id = m.student_id
LEFT JOIN subjects sub ON m.subject_id = sub.subject_id
GROUP BY c.class_id, c.class_name, sub.subject_id, sub.subject_name;
