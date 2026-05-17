-- ============================================================
-- CONCEPT 5: TRIGGERS - Automatic validation and audit logging
-- ============================================================

USE student_academic_management_v2;

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
