-- Student Academic Record Management System (MySQL)
-- Normalized schema (>= 3NF) with PK/FK relationships.

CREATE DATABASE IF NOT EXISTS student_academic_management_v2
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE student_academic_management_v2;
-- Core lookup table (optional but recommended for 3NF)
CREATE TABLE IF NOT EXISTS departments (
  department_id INT NOT NULL AUTO_INCREMENT,
  department_name VARCHAR(100) NOT NULL,
  PRIMARY KEY (department_id),
  UNIQUE KEY uq_departments_name (department_name),
  KEY idx_departments_name (department_name)
) ENGINE=InnoDB;

-- Admins for session-based authentication
CREATE TABLE IF NOT EXISTS admins (
  admin_id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (admin_id),
  UNIQUE KEY uq_admins_username (username)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS classes (
  class_id INT NOT NULL AUTO_INCREMENT,
  class_name VARCHAR(50) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (class_id),
  UNIQUE KEY uq_classes_name (class_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS students (
  student_id INT NOT NULL AUTO_INCREMENT,
  student_name VARCHAR(150) NOT NULL,
  gender ENUM('Male','Female','Other') NOT NULL,
  grade VARCHAR(20) NOT NULL,
  class_id INT NULL,
  academic_year VARCHAR(20) NOT NULL,
  semester VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id),
  KEY idx_students_class (class_id),
  KEY idx_students_name (student_name),
  CONSTRAINT fk_students_class
    FOREIGN KEY (class_id)
    REFERENCES classes (class_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS teachers (
  teacher_id INT NOT NULL AUTO_INCREMENT,
  teacher_name VARCHAR(150) NOT NULL,
  username VARCHAR(50) NULL,
  password_hash VARCHAR(255) NULL,
  department_id INT NOT NULL,
  assigned_class VARCHAR(50) NULL,
  assigned_class_id INT NULL,
  role ENUM('Homeroom Teacher','Subject Teacher') NOT NULL DEFAULT 'Subject Teacher',
  homeroom_class VARCHAR(50)
    GENERATED ALWAYS AS (
      CASE
        WHEN role = 'Homeroom Teacher' THEN assigned_class
        ELSE NULL
      END
    ) STORED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (teacher_id),
  KEY idx_teachers_department (department_id),
  KEY idx_teachers_assigned_class_id (assigned_class_id),
  KEY idx_teachers_name (teacher_name),
  UNIQUE KEY uq_teachers_username (username),
  UNIQUE KEY uq_homeroom_class (homeroom_class),
  CONSTRAINT chk_teacher_homeroom_class
    CHECK (role <> 'Homeroom Teacher' OR assigned_class IS NOT NULL),
  CONSTRAINT fk_teachers_assigned_class
    FOREIGN KEY (assigned_class_id)
    REFERENCES classes (class_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_teachers_department
    FOREIGN KEY (department_id)
    REFERENCES departments (department_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- TRIGGER FOR TEACHERS TABLE (defined immediately after table)
-- ============================================================

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

CREATE TABLE IF NOT EXISTS subjects (
  subject_id INT NOT NULL AUTO_INCREMENT,
  subject_name VARCHAR(150) NOT NULL,
  department_id INT NOT NULL,
  teacher_id INT NULL,
  start_year INT NULL,
  total_mark INT NOT NULL DEFAULT 100,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (subject_id),
  UNIQUE KEY uq_subjects_name (subject_name),
  KEY idx_subjects_department (department_id),
  KEY idx_subjects_teacher (teacher_id),
  KEY idx_subjects_name (subject_name),
  CONSTRAINT chk_subject_start_year CHECK (start_year IS NULL OR (start_year >= 1900 AND start_year <= 2999)),
  CONSTRAINT chk_subject_total_mark CHECK (total_mark = 100),
  CONSTRAINT fk_subjects_department
    FOREIGN KEY (department_id)
    REFERENCES departments (department_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_subjects_teacher
    FOREIGN KEY (teacher_id)
    REFERENCES teachers (teacher_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS marks (
  mark_id INT NOT NULL AUTO_INCREMENT,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  teacher_id INT NULL,
  mark INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (mark_id),
  UNIQUE KEY uq_marks_student_subject (student_id, subject_id),
  KEY idx_marks_student (student_id),
  KEY idx_marks_subject (subject_id),
  KEY idx_marks_teacher (teacher_id),
  KEY idx_marks_student_subject (student_id, subject_id),
  KEY idx_marks_student_mark (student_id, mark),
  KEY idx_marks_subject_mark (subject_id, mark),
  KEY idx_marks_value_range (mark),
  CONSTRAINT fk_marks_student
    FOREIGN KEY (student_id)
    REFERENCES students (student_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_marks_subject
    FOREIGN KEY (subject_id)
    REFERENCES subjects (subject_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_marks_teacher
    FOREIGN KEY (teacher_id)
    REFERENCES teachers (teacher_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT chk_mark_range CHECK (mark >= 0 AND mark <= 100)
) ENGINE=InnoDB;

-- ============================================================
-- TRIGGERS FOR MARKS TABLE (defined immediately after table)
-- ============================================================

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

DROP TRIGGER IF EXISTS trg_mark_update_timestamp;
DELIMITER //
CREATE TRIGGER trg_mark_update_timestamp
BEFORE UPDATE ON marks
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- ============================================================
-- AUDIT LOG TABLE (needed for triggers)
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  log_id INT NOT NULL AUTO_INCREMENT,
  table_name VARCHAR(50) NOT NULL,
  operation VARCHAR(10) NOT NULL,
  record_id INT NOT NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  changed_by VARCHAR(50) NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  KEY idx_audit_table (table_name),
  KEY idx_audit_operation (operation),
  KEY idx_audit_date (changed_at)
) ENGINE=InnoDB;

-- ============================================================
-- AUDIT LOG TRIGGERS FOR MARKS TABLE
-- ============================================================

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

-- ============================================================
-- SECTION: VIEWS (must be defined after all tables)
-- ============================================================

DROP VIEW IF EXISTS vw_student_subject_marks;
CREATE VIEW vw_student_subject_marks AS
SELECT
    s.student_id,
    s.student_name,
    sub.subject_name,
    m.mark,
    sub.total_mark AS total_mark,
    ROUND((m.mark / sub.total_mark) * 100, 2) AS percentage
FROM marks m
JOIN students s ON m.student_id = s.student_id
JOIN subjects sub ON m.subject_id = sub.subject_id;

DROP VIEW IF EXISTS vw_student_summary;
CREATE VIEW vw_student_summary AS
SELECT
    s.student_id,
    s.student_name,
    COUNT(m.subject_id) AS total_subjects,
    SUM(m.mark) AS total_marks,
    ROUND(AVG(m.mark), 2) AS average_mark,
    ROW_NUMBER() OVER (ORDER BY SUM(m.mark) DESC) AS rank,
    CASE
        WHEN AVG(m.mark) >= 50 THEN 'PASS'
        ELSE 'FAIL'
    END AS status
FROM students s
LEFT JOIN marks m ON s.student_id = m.student_id
GROUP BY s.student_id, s.student_name;

DROP VIEW IF EXISTS vw_class_performance;
CREATE VIEW vw_class_performance AS
SELECT
    c.class_id,
    c.class_name,
    COUNT(DISTINCT s.student_id) AS student_count,
    COUNT(m.mark_id) AS mark_count,
    ROUND(AVG(m.mark), 2) AS class_average,
    MAX(m.mark) AS highest_mark,
    MIN(m.mark) AS lowest_mark
FROM classes c
LEFT JOIN students s ON s.class_id = c.class_id
LEFT JOIN marks m ON s.student_id = m.student_id
GROUP BY c.class_id, c.class_name;

DROP VIEW IF EXISTS vw_teacher_subject_assignment;
CREATE VIEW vw_teacher_subject_assignment AS
SELECT
    t.teacher_id,
    t.teacher_name,
    d.department_name AS subject_department,
    sub.subject_name,
    sub.subject_id,
    COUNT(DISTINCT m.student_id) AS students_graded,
    ROUND(AVG(m.mark), 2) AS average_mark_given
FROM teachers t
JOIN departments d ON t.department_id = d.department_id
LEFT JOIN subjects sub ON t.teacher_id = sub.teacher_id
LEFT JOIN marks m ON t.teacher_id = m.teacher_id AND sub.subject_id = m.subject_id
GROUP BY t.teacher_id, t.teacher_name, d.department_name, sub.subject_name, sub.subject_id;

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
    MIN(m.mark) AS lowest_mark
FROM departments d
LEFT JOIN teachers t ON d.department_id = t.department_id
LEFT JOIN subjects sub ON d.department_id = sub.department_id
LEFT JOIN marks m ON sub.subject_id = m.subject_id
LEFT JOIN students s ON m.student_id = s.student_id
GROUP BY d.department_id, d.department_name;

-- ============================================================
-- SECTION: FUNCTIONS
-- ============================================================

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

DROP FUNCTION IF EXISTS fn_get_class_average;
DELIMITER //
CREATE FUNCTION fn_get_class_average(p_class_id INT) RETURNS DECIMAL(5,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_class_avg DECIMAL(5,2);
    SELECT ROUND(AVG(m.mark), 2) INTO v_class_avg
    FROM marks m JOIN students s ON m.student_id = s.student_id
    WHERE s.class_id = p_class_id;
    RETURN IFNULL(v_class_avg, 0.00);
END //
DELIMITER ;

-- ============================================================
-- SECTION: STORED PROCEDURES
-- ============================================================

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

DROP PROCEDURE IF EXISTS sp_get_student_report;
DELIMITER //
CREATE PROCEDURE sp_get_student_report(IN p_student_id INT)
BEGIN
    SELECT
        s.student_id,
        s.student_name,
        s.gender,
        c.class_name,
        s.academic_year,
        s.semester,
        fn_calculate_total(s.student_id) AS total_marks,
        fn_calculate_average(s.student_id) AS average_mark,
        fn_get_status(s.student_id) AS status,
        COUNT(m.subject_id) AS subject_count,
        MAX(m.mark) AS highest_mark,
        MIN(m.mark) AS lowest_mark,
        (SELECT COUNT(*) FROM marks m2 WHERE m2.student_id = s.student_id AND m2.mark >= 50) AS passed_subjects,
        (SELECT COUNT(*) FROM marks m3 WHERE m3.student_id = s.student_id AND m3.mark < 50) AS failed_subjects
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.class_id
    LEFT JOIN marks m ON s.student_id = m.student_id
    WHERE s.student_id = p_student_id
    GROUP BY s.student_id, s.student_name, s.gender, c.class_name, s.academic_year, s.semester;
END //
DELIMITER ;
