-- ============================================================
-- APPLY ADVANCED DATABASE CONCEPTS COMPREHENSIVELY
-- Student Academic Management System
-- ============================================================
-- This file ensures all 5 advanced concepts are properly applied
-- to ALL tables and operations throughout the system
-- ============================================================

USE student_academic_management_v2;

-- ============================================================
-- CONCEPT 1: INDEXES - Optimize ALL frequently queried columns
-- ============================================================

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

-- ============================================================
-- CONCEPT 2: VIEWS - Provide consistent data access patterns
-- ============================================================

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

-- ============================================================
-- CONCEPT 3: FUNCTIONS - Reusable calculations
-- ============================================================

-- Function 1: Calculate total marks for student
DROP FUNCTION IF EXISTS fn_calculate_total;
DELIMITER //
CREATE FUNCTION fn_calculate_total(p_student_id INT) RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total INT;
    SELECT SUM(mark) INTO v_total FROM marks WHERE student_id = p_student_id;
    RETURN IFNULL(v_total, 0);
END //
DELIMITER ;

-- Function 2: Calculate average marks for student
DROP FUNCTION IF EXISTS fn_calculate_average;
DELIMITER //
CREATE FUNCTION fn_calculate_average(p_student_id INT) RETURNS DECIMAL(5,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_average DECIMAL(5,2);
    SELECT ROUND(AVG(mark), 2) INTO v_average FROM marks WHERE student_id = p_student_id;
    RETURN IFNULL(v_average, 0.00);
END //
DELIMITER ;

-- Function 3: Get student status (PASS/FAIL)
DROP FUNCTION IF EXISTS fn_get_status;
DELIMITER //
CREATE FUNCTION fn_get_status(p_student_id INT) RETURNS VARCHAR(10)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_average DECIMAL(5,2);
    DECLARE v_status VARCHAR(10);
    SELECT ROUND(AVG(mark), 2) INTO v_average FROM marks WHERE student_id = p_student_id;
    IF v_average IS NULL THEN
        SET v_status = 'NO MARKS';
    ELSEIF v_average >= 50 THEN
        SET v_status = 'PASS';
    ELSE
        SET v_status = 'FAIL';
    END IF;
    RETURN v_status;
END //
DELIMITER ;

-- Function 4: Get subject average
DROP FUNCTION IF EXISTS fn_get_subject_average;
DELIMITER //
CREATE FUNCTION fn_get_subject_average(p_subject_id INT) RETURNS DECIMAL(5,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_average DECIMAL(5,2);
    SELECT ROUND(AVG(mark), 2) INTO v_average FROM marks WHERE subject_id = p_subject_id;
    RETURN IFNULL(v_average, 0.00);
END //
DELIMITER ;

-- Function 5: Get class average
DROP FUNCTION IF EXISTS fn_get_class_average;
DELIMITER //
CREATE FUNCTION fn_get_class_average(p_class_id INT) RETURNS DECIMAL(5,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_class_avg DECIMAL(5,2);
    SELECT ROUND(AVG(m.mark), 2) INTO v_class_avg
    FROM marks m 
    JOIN students s ON m.student_id = s.student_id
    WHERE s.class_id = p_class_id;
    RETURN IFNULL(v_class_avg, 0.00);
END //
DELIMITER ;

-- Function 6: Get department average
DROP FUNCTION IF EXISTS fn_get_department_average;
DELIMITER //
CREATE FUNCTION fn_get_department_average(p_department_id INT) RETURNS DECIMAL(5,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_dept_avg DECIMAL(5,2);
    SELECT ROUND(AVG(m.mark), 2) INTO v_dept_avg
    FROM marks m
    JOIN subjects sub ON m.subject_id = sub.subject_id
    WHERE sub.department_id = p_department_id;
    RETURN IFNULL(v_dept_avg, 0.00);
END //
DELIMITER ;

-- Function 7: Count passed subjects for student
DROP FUNCTION IF EXISTS fn_count_passed_subjects;
DELIMITER //
CREATE FUNCTION fn_count_passed_subjects(p_student_id INT) RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_count INT;
    SELECT COUNT(*) INTO v_count FROM marks WHERE student_id = p_student_id AND mark >= 50;
    RETURN IFNULL(v_count, 0);
END //
DELIMITER ;

-- Function 8: Count failed subjects for student
DROP FUNCTION IF EXISTS fn_count_failed_subjects;
DELIMITER //
CREATE FUNCTION fn_count_failed_subjects(p_student_id INT) RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_count INT;
    SELECT COUNT(*) INTO v_count FROM marks WHERE student_id = p_student_id AND mark < 50;
    RETURN IFNULL(v_count, 0);
END //
DELIMITER ;

-- ============================================================
-- CONCEPT 4: STORED PROCEDURES - Complex business logic
-- ============================================================

-- Procedure 1: Add student with validation
DROP PROCEDURE IF EXISTS sp_add_student;
DELIMITER //
CREATE PROCEDURE sp_add_student(
    IN p_student_name VARCHAR(150),
    IN p_gender ENUM('Male','Female','Other'),
    IN p_grade VARCHAR(20),
    IN p_class_id INT,
    IN p_academic_year VARCHAR(20),
    IN p_semester VARCHAR(20),
    OUT p_student_id INT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_class_exists INT;
    
    IF p_class_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_class_exists FROM classes WHERE class_id = p_class_id;
        IF v_class_exists = 0 THEN
            SET p_result_code = -1;
            SET p_result_message = 'Error: Class ID does not exist';
            SET p_student_id = NULL;
            LEAVE proc_label;
        END IF;
    END IF;
    
    IF p_student_name IS NULL OR p_student_name = '' THEN
        SET p_result_code = -2;
        SET p_result_message = 'Error: Student name is required';
        SET p_student_id = NULL;
        LEAVE proc_label;
    END IF;
    
    IF p_grade IS NULL OR p_grade = '' THEN
        SET p_result_code = -3;
        SET p_result_message = 'Error: Grade is required';
        SET p_student_id = NULL;
        LEAVE proc_label;
    END IF;
    
    INSERT INTO students (student_name, gender, grade, class_id, academic_year, semester)
    VALUES (p_student_name, p_gender, p_grade, p_class_id, p_academic_year, p_semester);
    
    SET p_student_id = LAST_INSERT_ID();
    SET p_result_code = 0;
    SET p_result_message = CONCAT('Student added successfully. ID: ', p_student_id);
END //
DELIMITER ;

-- Procedure 2: Insert mark with validation
DROP PROCEDURE IF EXISTS sp_insert_mark;
DELIMITER //
CREATE PROCEDURE sp_insert_mark(
    IN p_student_id INT,
    IN p_subject_id INT,
    IN p_mark INT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_student_exists INT;
    DECLARE v_subject_exists INT;
    DECLARE v_mark_exists INT;
    DECLARE v_subject_total_mark INT;
    
    SELECT COUNT(*) INTO v_student_exists FROM students WHERE student_id = p_student_id;
    IF v_student_exists = 0 THEN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Student ID does not exist';
        LEAVE proc_label;
    END IF;
    
    SELECT COUNT(*) INTO v_subject_exists FROM subjects WHERE subject_id = p_subject_id;
    IF v_subject_exists = 0 THEN
        SET p_result_code = -2;
        SET p_result_message = 'Error: Subject ID does not exist';
        LEAVE proc_label;
    END IF;
    
    IF p_mark < 0 OR p_mark > 100 THEN
        SET p_result_code = -3;
        SET p_result_message = 'Error: Mark must be between 0 and 100';
        LEAVE proc_label;
    END IF;
    
    SELECT COUNT(*) INTO v_mark_exists FROM marks
    WHERE student_id = p_student_id AND subject_id = p_subject_id;
    IF v_mark_exists > 0 THEN
        SET p_result_code = -4;
        SET p_result_message = 'Error: Mark already exists for this student and subject';
        LEAVE proc_label;
    END IF;
    
    SELECT total_mark INTO v_subject_total_mark FROM subjects WHERE subject_id = p_subject_id;
    IF p_mark > v_subject_total_mark THEN
        SET p_result_code = -5;
        SET p_result_message = CONCAT('Error: Mark cannot exceed subject total mark of ', v_subject_total_mark);
        LEAVE proc_label;
    END IF;
    
    INSERT INTO marks (student_id, subject_id, mark) VALUES (p_student_id, p_subject_id, p_mark);
    SET p_result_code = 0;
    SET p_result_message = 'Mark inserted successfully';
END //
DELIMITER ;

-- Procedure 3: Update mark with validation
DROP PROCEDURE IF EXISTS sp_update_mark;
DELIMITER //
CREATE PROCEDURE sp_update_mark(
    IN p_student_id INT,
    IN p_subject_id INT,
    IN p_mark INT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_mark_exists INT;
    DECLARE v_subject_total_mark INT;
    
    IF p_mark < 0 OR p_mark > 100 THEN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Mark must be between 0 and 100';
        LEAVE proc_label;
    END IF;
    
    SELECT COUNT(*) INTO v_mark_exists FROM marks
    WHERE student_id = p_student_id AND subject_id = p_subject_id;
    IF v_mark_exists = 0 THEN
        SET p_result_code = -2;
        SET p_result_message = 'Error: Mark does not exist for this student and subject';
        LEAVE proc_label;
    END IF;
    
    SELECT total_mark INTO v_subject_total_mark FROM subjects WHERE subject_id = p_subject_id;
    IF p_mark > v_subject_total_mark THEN
        SET p_result_code = -3;
        SET p_result_message = CONCAT('Error: Mark cannot exceed subject total mark of ', v_subject_total_mark);
        LEAVE proc_label;
    END IF;
    
    UPDATE marks SET mark = p_mark WHERE student_id = p_student_id AND subject_id = p_subject_id;
    SET p_result_code = 0;
    SET p_result_message = 'Mark updated successfully';
END //
DELIMITER ;

-- Procedure 4: Get comprehensive student report
DROP PROCEDURE IF EXISTS sp_get_student_report;
DELIMITER //
CREATE PROCEDURE sp_get_student_report(IN p_student_id INT)
BEGIN
    SELECT
        s.student_id,
        s.student_name,
        s.gender,
        s.grade,
        c.class_name,
        s.academic_year,
        s.semester,
        fn_calculate_total(s.student_id) AS total_marks,
        fn_calculate_average(s.student_id) AS average_mark,
        fn_get_status(s.student_id) AS status,
        fn_count_passed_subjects(s.student_id) AS passed_subjects,
        fn_count_failed_subjects(s.student_id) AS failed_subjects,
        COUNT(m.subject_id) AS subject_count,
        MAX(m.mark) AS highest_mark,
        MIN(m.mark) AS lowest_mark
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.class_id
    LEFT JOIN marks m ON s.student_id = m.student_id
    WHERE s.student_id = p_student_id
    GROUP BY s.student_id, s.student_name, s.gender, s.grade, c.class_name, s.academic_year, s.semester;
END //
DELIMITER ;

-- ============================================================
-- CONCEPT 5: TRIGGERS - Automatic validation and audit logging
-- ============================================================

-- Trigger 1: Validate mark range on INSERT
DROP TRIGGER IF EXISTS trg_mark_insert_validation;
DELIMITER //
CREATE TRIGGER trg_mark_insert_validation
BEFORE INSERT ON marks
FOR EACH ROW
BEGIN
    IF NEW.mark < 0 OR NEW.mark > 100 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mark must be between 0 and 100';
    END IF;
END //
DELIMITER ;

-- Trigger 2: Validate mark range on UPDATE
DROP TRIGGER IF EXISTS trg_mark_update_validation;
DELIMITER //
CREATE TRIGGER trg_mark_update_validation
BEFORE UPDATE ON marks
FOR EACH ROW
BEGIN
    IF NEW.mark < 0 OR NEW.mark > 100 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mark must be between 0 and 100';
    END IF;
END //
DELIMITER ;

-- Trigger 3: Auto-update timestamp on mark UPDATE
DROP TRIGGER IF EXISTS trg_mark_update_timestamp;
DELIMITER //
CREATE TRIGGER trg_mark_update_timestamp
BEFORE UPDATE ON marks
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- Trigger 4: Audit log on mark INSERT
DROP TRIGGER IF EXISTS trg_mark_audit_log;
DELIMITER //
CREATE TRIGGER trg_mark_audit_log
AFTER INSERT ON marks
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, record_id, new_values)
    VALUES ('marks', 'INSERT', NEW.mark_id, JSON_OBJECT(
        'student_id', NEW.student_id,
        'subject_id', NEW.subject_id,
        'mark', NEW.mark,
        'teacher_id', NEW.teacher_id
    ));
END //
DELIMITER ;

-- Trigger 5: Audit log on mark UPDATE
DROP TRIGGER IF EXISTS trg_mark_audit_log_update;
DELIMITER //
CREATE TRIGGER trg_mark_audit_log_update
AFTER UPDATE ON marks
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, record_id, old_values, new_values)
    VALUES ('marks', 'UPDATE', NEW.mark_id,
        JSON_OBJECT('student_id', OLD.student_id, 'subject_id', OLD.subject_id, 'mark', OLD.mark, 'teacher_id', OLD.teacher_id),
        JSON_OBJECT('student_id', NEW.student_id, 'subject_id', NEW.subject_id, 'mark', NEW.mark, 'teacher_id', NEW.teacher_id)
    );
END //
DELIMITER ;

-- Trigger 6: Audit log on mark DELETE
DROP TRIGGER IF EXISTS trg_mark_audit_log_delete;
DELIMITER //
CREATE TRIGGER trg_mark_audit_log_delete
AFTER DELETE ON marks
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, record_id, old_values)
    VALUES ('marks', 'DELETE', OLD.mark_id, JSON_OBJECT(
        'student_id', OLD.student_id,
        'subject_id', OLD.subject_id,
        'mark', OLD.mark,
        'teacher_id', OLD.teacher_id
    ));
END //
DELIMITER ;

-- Trigger 7: Enforce homeroom teacher constraint
DROP TRIGGER IF EXISTS trg_teacher_homeroom_constraint;
DELIMITER //
CREATE TRIGGER trg_teacher_homeroom_constraint
BEFORE UPDATE ON teachers
FOR EACH ROW
BEGIN
    DECLARE v_existing_homeroom_teacher INT;
    IF NEW.role = 'Homeroom Teacher' AND NEW.assigned_class_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_existing_homeroom_teacher
        FROM teachers
        WHERE role = 'Homeroom Teacher' AND assigned_class_id = NEW.assigned_class_id AND teacher_id != NEW.teacher_id;
        IF v_existing_homeroom_teacher > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only one homeroom teacher allowed per class';
        END IF;
    END IF;
END //
DELIMITER ;

-- Trigger 8: Auto-update student timestamp
DROP TRIGGER IF EXISTS trg_student_update_timestamp;
DELIMITER //
CREATE TRIGGER trg_student_update_timestamp
BEFORE UPDATE ON students
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- Trigger 9: Auto-update teacher timestamp
DROP TRIGGER IF EXISTS trg_teacher_update_timestamp;
DELIMITER //
CREATE TRIGGER trg_teacher_update_timestamp
BEFORE UPDATE ON teachers
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- Trigger 10: Auto-update subject timestamp
DROP TRIGGER IF EXISTS trg_subject_update_timestamp;
DELIMITER //
CREATE TRIGGER trg_subject_update_timestamp
BEFORE UPDATE ON subjects
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- Trigger 11: Auto-update class timestamp
DROP TRIGGER IF EXISTS trg_class_update_timestamp;
DELIMITER //
CREATE TRIGGER trg_class_update_timestamp
BEFORE UPDATE ON classes
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- ============================================================
-- VERIFY ALL CONCEPTS ARE APPLIED
-- ============================================================

SELECT 'All 5 Advanced Database Concepts Applied Successfully!' AS status;
SELECT 'INDEXES: Created on all frequently queried columns' AS concept_1;
SELECT 'VIEWS: 7 views for consistent data access' AS concept_2;
SELECT 'FUNCTIONS: 8 functions for reusable calculations' AS concept_3;
SELECT 'PROCEDURES: 4 procedures for complex business logic' AS concept_4;
SELECT 'TRIGGERS: 11 triggers for validation and audit logging' AS concept_5;
