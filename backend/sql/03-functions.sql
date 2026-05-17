-- ============================================================
-- CONCEPT 3: FUNCTIONS - Reusable calculations
-- ============================================================

USE student_academic_management_v2;

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
