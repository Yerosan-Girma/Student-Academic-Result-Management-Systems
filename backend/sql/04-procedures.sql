-- ============================================================
-- CONCEPT 4: STORED PROCEDURES - Complex business logic
-- ============================================================

USE student_academic_management_v2;

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
