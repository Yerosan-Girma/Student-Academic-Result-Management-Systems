USE student_academic_management;

-- 1) Add the column (nullable first so existing rows won't fail)
ALTER TABLE students
  ADD COLUMN student_code VARCHAR(50) NULL AFTER student_id;

-- 2) Populate existing rows with a safe unique value
--    Update this pattern if your school uses a specific format (e.g., ABC001/16).
UPDATE students
SET student_code = CAST(student_id AS CHAR)
WHERE student_code IS NULL OR student_code = '';

-- 3) Enforce NOT NULL + UNIQUE once data is populated
ALTER TABLE students
  MODIFY student_code VARCHAR(50) NOT NULL;

ALTER TABLE students
  ADD UNIQUE KEY uq_students_code (student_code);
