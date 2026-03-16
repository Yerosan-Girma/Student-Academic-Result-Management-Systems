-- Migration: add teacher login credentials and teacher_id on marks.
-- Run once on existing databases.

USE student_academic_management;

ALTER TABLE teachers
  ADD COLUMN username VARCHAR(50) NULL,
  ADD COLUMN password_hash VARCHAR(255) NULL,
  ADD UNIQUE KEY uq_teachers_username (username);

ALTER TABLE marks
  ADD COLUMN teacher_id INT NULL,
  ADD KEY idx_marks_teacher (teacher_id),
  ADD CONSTRAINT fk_marks_teacher
    FOREIGN KEY (teacher_id)
    REFERENCES teachers (teacher_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;
