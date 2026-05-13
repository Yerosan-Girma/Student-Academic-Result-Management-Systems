-- Created by GitHub Copilot in SSMS - review carefully before executing
-- ============================================================
-- CRUD OPERATIONS WITH 5 CONCEPTS APPLIED (T-SQL Version)
-- ============================================================

-- 1. DEPARTMENTS

-- CREATE
INSERT INTO departments(department_name) VALUES('Maths');

-- READ
SELECT department_id, department_name
FROM departments
ORDER BY department_name ASC;

-- READ WITH COUNTS
SELECT d.department_id, d.department_name,
       COUNT(DISTINCT t.teacher_id) AS teacher_count,
       COUNT(DISTINCT s.subject_id) AS subject_count
FROM departments d
LEFT JOIN teachers t ON t.department_id = d.department_id
LEFT JOIN subjects s ON s.department_id = d.department_id
GROUP BY d.department_id, d.department_name
ORDER BY d.department_name ASC;

-- READ BY ID
SELECT department_id, department_name
FROM departments
WHERE department_id = 1;

-- UPDATE
UPDATE departments
SET department_name = 'English'
WHERE department_id = 1;

-- DELETE PREVIEW
SELECT d.department_id, d.department_name,
       COUNT(DISTINCT t.teacher_id) AS teacher_count,
       COUNT(DISTINCT s.subject_id) AS subject_count
FROM departments d
LEFT JOIN teachers t ON t.department_id = d.department_id
LEFT JOIN subjects s ON s.department_id = d.department_id
WHERE d.department_id = 1
GROUP BY d.department_id, d.department_name;

-- DELETE SAFE
DELETE FROM departments
WHERE department_id = 1
AND NOT EXISTS (SELECT 1 FROM teachers t WHERE t.department_id = departments.department_id)
AND NOT EXISTS (SELECT 1 FROM subjects s WHERE s.department_id = departments.department_id);

-- 2. ADMINS

-- CREATE
INSERT INTO admins(username, password_hash)
VALUES('admin1', @admin_hash);

-- READ
SELECT admin_id, username, password_hash
FROM admins
WHERE username = 'admin';

SELECT admin_id, username, created_at
FROM admins
ORDER BY admin_id ASC;

-- UPDATE
UPDATE admins
SET password_hash = @admin_hash
WHERE username = 'admin2';

-- DELETE
DELETE FROM admins
WHERE admin_id = 2 AND username <> 'admin';

-- 3. STUDENTS

-- CREATE
INSERT INTO students(student_name, gender, grade, academic_year, semester)
VALUES('Abel Tesfaye', 'Male', '9A', '2025/2026', '1');

-- READ
SELECT student_id, student_name, gender, grade, academic_year, semester
FROM students
ORDER BY student_id DESC;

-- READ BY ID
SELECT student_id, student_name, gender, grade, academic_year, semester
FROM students WHERE student_id = 1;

-- READ BY GRADE
SELECT student_id, student_name, gender, grade, academic_year, semester
FROM students WHERE grade = '9A'
ORDER BY student_id DESC;

-- READ BY ACADEMIC YEAR
SELECT student_id, student_name, gender, grade, academic_year, semester
FROM students WHERE academic_year = '2025/2026'
ORDER BY student_id DESC;

-- READ BY SEMESTER
SELECT student_id, student_name, gender, grade, academic_year, semester
FROM students WHERE semester = '1'
ORDER BY student_id DESC;

-- READ BY COMPOSITE FILTERS
SELECT student_id, student_name, gender, grade, academic_year, semester
FROM students
WHERE grade = '9A' AND academic_year = '2025/2026' AND semester = '1'
ORDER BY student_id DESC;

-- READ BY MULTIPLE IDs
SELECT student_id, student_name, gender, grade, academic_year, semester
FROM students WHERE student_id IN (1, 2, 3);

-- READ WITH ORDER BY NAME
SELECT student_id, student_name, gender, grade, academic_year, semester
FROM students
WHERE grade = '9A' AND semester = '1'
ORDER BY student_name ASC;

-- UPDATE
UPDATE students
SET student_name = 'Abel T.', gender = 'Male', grade = '9A',
    academic_year = '2025/2026', semester = '2'
WHERE student_id = 1;

UPDATE students
SET grade = '10A', academic_year = '2026/2027', semester = '1'
WHERE student_id = 1;

-- UPDATE BULK
UPDATE students
SET semester = '2'
WHERE grade = '9A' AND academic_year = '2025/2026' AND semester = '1';

-- DELETE PREVIEW
SELECT s.student_id, s.student_name,
       COUNT(m.mark_id) AS marks_to_be_deleted
FROM students s
LEFT JOIN marks m ON m.student_id = s.student_id
WHERE s.student_id = 1
GROUP BY s.student_id, s.student_name;

-- DELETE
DELETE FROM students WHERE student_id = 1;

-- 4. TEACHERS

-- CREATE
INSERT INTO teachers(teacher_name, department_id, assigned_class, role, username, password_hash)
VALUES('Mr. Bekele',
 (SELECT TOP(1) department_id FROM departments WHERE department_name = 'Maths'),
 NULL, 'Subject Teacher', 'bekele', @teacher_hash);

-- CREATE HOMEROOM TEACHER
INSERT INTO teachers(teacher_name, department_id, assigned_class, role, username, password_hash)
VALUES('Ms. Hana',
 (SELECT TOP(1) department_id FROM departments WHERE department_name = 'English'),
 '9B', 'Homeroom Teacher', 'hana', @teacher_hash);

-- READ
SELECT t.teacher_id, t.teacher_name, t.department_id, d.department_name,
       t.assigned_class, t.role, t.username
FROM teachers t
LEFT JOIN departments d ON d.department_id = t.department_id
ORDER BY t.teacher_id DESC;

-- READ BY ID
SELECT teacher_id, teacher_name, department_id, assigned_class, role, username
FROM teachers WHERE teacher_id = 1;

-- READ BY USERNAME
SELECT teacher_id, teacher_name, department_id, assigned_class, role, username, password_hash
FROM teachers WHERE username = 'genet';

-- READ BY DEPARTMENT AND ROLE
SELECT teacher_id, teacher_name, department_id, role
FROM teachers
WHERE department_id = (SELECT TOP(1) department_id FROM departments WHERE department_name = 'Maths')
AND role = 'Subject Teacher'
ORDER BY teacher_name ASC;

-- READ HOMEROOM TEACHERS BY CLASS
SELECT teacher_id, teacher_name, assigned_class
FROM teachers
WHERE role = 'Homeroom Teacher' AND assigned_class = '9B';

-- READ HOMEROOM TEACHERS BY CLASS EXCLUDING SPECIFIC
SELECT teacher_id, teacher_name, assigned_class
FROM teachers
WHERE role = 'Homeroom Teacher'
AND assigned_class = '9B'
AND teacher_id <> 5;

-- UPDATE
DECLARE @new_teacher_hash VARBINARY(MAX) = NULL;
UPDATE teachers
SET teacher_name = 'Mr. Bekele T.',
    department_id = (SELECT TOP(1) department_id FROM departments WHERE department_name = 'Maths'),
    assigned_class = NULL,
    role = 'Subject Teacher',
    username = 'bekelet',
    password_hash = COALESCE(@new_teacher_hash, password_hash)
WHERE teacher_id = 1;

-- UPDATE HOMEROOM WITH CONFLICT CHECK
-- (T-SQL does not support UPDATE with JOIN directly; use MERGE or a CTE)
;WITH conflict AS (
    SELECT teacher_id
    FROM teachers
    WHERE role = 'Homeroom Teacher'
      AND assigned_class = '10A'
      AND teacher_id <> 1
)
UPDATE teachers
SET role = 'Homeroom Teacher', assigned_class = '10A'
WHERE teacher_id = 1 AND NOT EXISTS (SELECT 1 FROM conflict);

-- UPDATE REMOVE HOMEROOM
UPDATE teachers
SET role = 'Subject Teacher', assigned_class = NULL
WHERE teacher_id = 1;

-- UPDATE PASSWORD
UPDATE teachers
SET password_hash = @teacher_hash
WHERE username = 'bekelet';

-- DELETE PREVIEW
SELECT t.teacher_id, t.teacher_name,
       COUNT(DISTINCT s.subject_id) AS subjects_that_will_be_unassigned,
       COUNT(DISTINCT m.mark_id) AS marks_that_will_lose_teacher_reference
FROM teachers t
LEFT JOIN subjects s ON s.teacher_id = t.teacher_id
LEFT JOIN marks m ON m.teacher_id = t.teacher_id
WHERE t.teacher_id = 1
GROUP BY t.teacher_id, t.teacher_name;

-- DELETE
DELETE FROM teachers WHERE teacher_id = 1;

-- 5. SUBJECTS

-- CREATE
INSERT INTO subjects(subject_name, department_id, teacher_id, start_year, total_mark)
VALUES('Civics',
 (SELECT TOP(1) department_id FROM departments WHERE department_name = 'English'),
 NULL, NULL, 100);

-- CREATE WITH TEACHER ASSIGNMENT
INSERT INTO subjects(subject_name, department_id, teacher_id, start_year, total_mark)
SELECT TOP(1) 'Mathematics', d.department_id, t.teacher_id, 2024, 100
FROM departments d
JOIN teachers t ON t.department_id = d.department_id
WHERE d.department_name = 'Maths'
AND t.username = 'genet'
AND t.role = 'Subject Teacher';

-- 6. MARKS

-- READ: all marks with joins
SELECT m.mark_id, m.student_id, st.student_name,
       m.subject_id, sb.subject_name,
       m.teacher_id, t.teacher_name, m.mark
FROM marks m
JOIN students st ON st.student_id = m.student_id
JOIN subjects sb ON sb.subject_id = m.subject_id
LEFT JOIN teachers t ON t.teacher_id = m.teacher_id
ORDER BY m.mark_id DESC;

-- READ: marks for one student
SELECT m.mark_id, m.student_id, st.student_name,
       m.subject_id, sb.subject_name,
       m.teacher_id, t.teacher_name, m.mark
FROM marks m
JOIN students st ON st.student_id = m.student_id
JOIN subjects sb ON sb.subject_id = m.subject_id
LEFT JOIN teachers t ON t.teacher_id = m.teacher_id
WHERE m.student_id = 1
ORDER BY sb.subject_name ASC;

-- READ: marks for one subject
SELECT m.mark_id, m.student_id, st.student_name,
       m.subject_id, sb.subject_name,
       m.teacher_id, t.teacher_name, m.mark
FROM marks m
JOIN students st ON st.student_id = m.student_id
JOIN subjects sb ON sb.subject_id = m.subject_id
LEFT JOIN teachers t ON t.teacher_id = m.teacher_id
WHERE m.subject_id = 1
ORDER BY m.mark_id DESC;

-- READ: marks by teacher
SELECT m.mark_id, m.student_id, st.student_name,
       m.subject_id, sb.subject_name,
       m.teacher_id, t.teacher_name, m.mark
FROM marks m
JOIN students st ON st.student_id = m.student_id
JOIN subjects sb ON sb.subject_id = m.subject_id
LEFT JOIN teachers t ON t.teacher_id = m.teacher_id
WHERE m.teacher_id = 1
ORDER BY m.mark_id DESC;



-- CHECK subject-teacher authorization
SELECT subject_id
FROM subjects
WHERE subject_id = 1 AND teacher_id = 1;

-- CHECK student eligibility
SELECT st.student_id, st.student_name, st.academic_year,
       sb.subject_id, sb.subject_name, sb.start_year
FROM students st
JOIN subjects sb ON sb.subject_id = 1
WHERE st.student_id = 1
AND (sb.start_year IS NULL OR
     CAST(SUBSTRING(st.academic_year, 1, 4) AS INT) >= sb.start_year);

-- UPSERT: single mark (MERGE pattern)
MERGE INTO marks AS target
USING (SELECT 1 AS student_id, 1 AS subject_id, 1 AS teacher_id, 88 AS mark) AS source
ON target.student_id = source.student_id AND target.subject_id = source.subject_id
WHEN MATCHED THEN
    UPDATE SET mark = source.mark, teacher_id = source.teacher_id, updated_at = SYSDATETIME()
WHEN NOT MATCHED THEN
    INSERT (student_id, subject_id, teacher_id, mark, updated_at)
    VALUES (source.student_id, source.subject_id, source.teacher_id, source.mark, SYSDATETIME());

-- UPSERT: admin entry
MERGE INTO marks AS target
USING (SELECT 2 AS student_id, 1 AS subject_id, NULL AS teacher_id, 74 AS mark) AS source
ON target.student_id = source.student_id AND target.subject_id = source.subject_id
WHEN MATCHED THEN
    UPDATE SET mark = source.mark, teacher_id = source.teacher_id, updated_at = SYSDATETIME()
WHEN NOT MATCHED THEN
    INSERT (student_id, subject_id, teacher_id, mark, updated_at)
    VALUES (source.student_id, source.subject_id, source.teacher_id, source.mark, SYSDATETIME());

-- BULK SAVE (BY SUBJECT)
BEGIN TRANSACTION;

MERGE INTO marks AS target
USING (SELECT 1 AS student_id, 1 AS subject_id, 1 AS teacher_id, 85 AS mark) AS source
ON target.student_id = source.student_id AND target.subject_id = source.subject_id
WHEN MATCHED THEN UPDATE SET mark = source.mark
WHEN NOT MATCHED THEN INSERT (student_id, subject_id, teacher_id, mark) VALUES (source.student_id, source.subject_id, source.teacher_id, source.mark);

MERGE INTO marks AS target
USING (SELECT 2 AS student_id, 1 AS subject_id, 1 AS teacher_id, 91 AS mark) AS source
ON target.student_id = source.student_id AND target.subject_id = source.subject_id
WHEN MATCHED THEN UPDATE SET mark = source.mark
WHEN NOT MATCHED THEN INSERT (student_id, subject_id, teacher_id, mark) VALUES (source.student_id, source.subject_id, source.teacher_id, source.mark);

MERGE INTO marks AS target
USING (SELECT 3 AS student_id, 1 AS subject_id, 1 AS teacher_id, 67 AS mark) AS source
ON target.student_id = source.student_id AND target.subject_id = source.subject_id
WHEN MATCHED THEN UPDATE SET mark = source.mark
WHEN NOT MATCHED THEN INSERT (student_id, subject_id, teacher_id, mark) VALUES (source.student_id, source.subject_id, source.teacher_id, source.mark);

COMMIT TRANSACTION;

-- BULK SAVE (BY STUDENT)
BEGIN TRANSACTION;

MERGE INTO marks AS target
USING (SELECT 1 AS student_id, 1 AS subject_id, NULL AS teacher_id, 80 AS mark) AS source
ON target.student_id = source.student_id AND target.subject_id = source.subject_id
WHEN MATCHED THEN UPDATE SET mark = source.mark
WHEN NOT MATCHED THEN INSERT (student_id, subject_id, teacher_id, mark) VALUES (source.student_id, source.subject_id, source.teacher_id, source.mark);

MERGE INTO marks AS target
USING (SELECT 1 AS student_id, 2 AS subject_id, NULL AS teacher_id, 72 AS mark) AS source
ON target.student_id = source.student_id AND target.subject_id = source.subject_id
WHEN MATCHED THEN UPDATE SET mark = source.mark
WHEN NOT MATCHED THEN INSERT (student_id, subject_id, teacher_id, mark) VALUES (source.student_id, source.subject_id, source.teacher_id, source.mark);

MERGE INTO marks AS target
USING (SELECT 1 AS student_id, 3 AS subject_id, NULL AS teacher_id, 90 AS mark) AS source
ON target.student_id = source.student_id AND target.subject_id = source.subject_id
WHEN MATCHED THEN UPDATE SET mark = source.mark
WHEN NOT MATCHED THEN INSERT (student_id, subject_id, teacher_id, mark) VALUES (source.student_id, source.subject_id, source.teacher_id, source.mark);

COMMIT TRANSACTION;

-- READ AFTER SAVE
SELECT mark_id, student_id, subject_id, teacher_id, mark
FROM marks
WHERE student_id = 1 AND subject_id = 1;

SELECT mark_id, student_id, subject_id, teacher_id, mark
FROM marks WHERE student_id = 1;

SELECT mark_id, student_id, subject_id, teacher_id, mark
FROM marks WHERE subject_id = 1;

-- UPDATE
UPDATE marks SET mark = 95 WHERE mark_id = 1;

-- DELETE
DELETE FROM marks WHERE mark_id = 1;

DELETE FROM marks
WHERE student_id = 1 AND subject_id = 1;

-- 7. REPORTS

-- SUBJECT LIST
SELECT subject_id, subject_name, total_mark, start_year
FROM subjects
ORDER BY subject_id ASC;

-- STUDENT LIST
SELECT student_id, student_name, gender, grade, academic_year, semester
FROM students
ORDER BY student_id ASC;

-- CLASS STUDENTS
SELECT student_id, student_name, gender, grade, academic_year, semester
FROM students
WHERE grade = '9A'
ORDER BY student_id ASC;

-- ALL MARKS
SELECT student_id, subject_id, mark FROM marks;

-- HOMEROOM TEACHERS
SELECT teacher_id, teacher_name, assigned_class
FROM teachers
WHERE role = 'Homeroom Teacher';

-- CLASS MARK SHEET
SELECT st.student_id, st.student_name, st.gender,
       st.grade, st.academic_year, st.semester,
       sb.subject_id, sb.subject_name, sb.total_mark,
       sb.start_year, m.mark,
       ht.teacher_name AS homeroom_teacher
FROM students st
LEFT JOIN marks m ON m.student_id = st.student_id
LEFT JOIN subjects sb ON sb.subject_id = m.subject_id
LEFT JOIN teachers ht
ON ht.assigned_class = st.grade AND ht.role = 'Homeroom Teacher'
ORDER BY st.student_name ASC, sb.subject_name ASC;

-- CLASS SUMMARY
WITH class_report AS (
    SELECT st.student_id, st.student_name, st.grade,
           st.academic_year, st.semester,
           SUM(m.mark) AS total,
           COUNT(m.mark_id) AS subject_count,
           ROUND(AVG(m.mark), 2) AS average
    FROM students st
    LEFT JOIN marks m ON m.student_id = st.student_id
    GROUP BY st.student_id, st.student_name, st.grade,
             st.academic_year, st.semester
)
SELECT student_id, student_name, grade,
       academic_year, semester, total, subject_count,
       average,
       CASE WHEN average >= 50 THEN 'PASS' ELSE 'FAIL' END AS status,
       DENSE_RANK() OVER(ORDER BY total DESC) AS class_rank
FROM class_report
ORDER BY class_rank ASC, student_name ASC;

-- 8. COMPUTATION SQL QUERIES

-- Total and Average Query (using functions, if defined)
SELECT s.student_id, s.student_name,
       dbo.fn_calculate_total(s.student_id) AS total_marks,
       dbo.fn_calculate_average(s.student_id) AS average_mark
FROM students s
WHERE s.student_id = @student_id;

-- Total and Average Query (Alternative without functions)
SELECT s.student_id, s.student_name,
       SUM(m.mark) AS total_marks,
       ROUND(AVG(m.mark), 2) AS average_mark
FROM students s
LEFT JOIN marks m ON s.student_id = m.student_id
GROUP BY s.student_id, s.student_name;

-- Rank Query
SELECT s.student_id, s.student_name,
       SUM(m.mark) AS total_marks,
       DENSE_RANK() OVER (ORDER BY SUM(m.mark) DESC) AS class_rank
FROM students s
LEFT JOIN marks m ON s.student_id = m.student_id
GROUP BY s.student_id, s.student_name
ORDER BY class_rank ASC, student_name ASC;

-- Pass/Fail Query (using functions, if defined)
SELECT s.student_id, s.student_name,
       dbo.fn_calculate_average(s.student_id) AS average_mark,
       dbo.fn_get_status(s.student_id) AS status
FROM students s
WHERE s.student_id = @student_id;

-- Pass/Fail Query (Alternative without functions)
SELECT s.student_id, s.student_name,
       ROUND(AVG(m.mark), 2) AS average_mark,
       CASE WHEN AVG(m.mark) >= 50 THEN 'PASS' ELSE 'FAIL' END AS status
FROM students s
LEFT JOIN marks m ON s.student_id = m.student_id
GROUP BY s.student_id, s.student_name;

-- Pass/Fail Query (Subject-level)
SELECT st.student_id, st.student_name,
       sb.subject_name, m.mark,
       CASE
         WHEN m.mark IS NULL THEN '-'
         WHEN m.mark >= 50 THEN 'PASS'
         ELSE 'FAIL'
       END AS subject_result
FROM students st
LEFT JOIN marks m ON m.student_id = st.student_id
LEFT JOIN subjects sb ON sb.subject_id = m.subject_id
ORDER BY sb.subject_name ASC;

-- STUDENT RESULT SHEET
SELECT st.student_id, st.student_name, st.gender,
       st.grade, st.academic_year, st.semester,
       sb.subject_name, sb.total_mark, m.mark,
       CASE
         WHEN m.mark IS NULL THEN '-'
         WHEN m.mark >= 50 THEN 'PASS'
         ELSE 'FAIL'
       END AS subject_result
FROM students st
LEFT JOIN marks m ON m.student_id = st.student_id
LEFT JOIN subjects sb ON sb.subject_id = m.subject_id
ORDER BY sb.subject_name ASC;