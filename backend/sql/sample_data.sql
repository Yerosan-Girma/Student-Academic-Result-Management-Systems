USE student_academic_management_v2;

-- Default password for sample teachers: teacher123
SET @teacher_hash = '$2b$10$j4BvY04l1vl4SdyAYzokKuCWwSQ4zFAMnR8CUKzIZfQPSHcs6/lG2';

-- Departments (subject-based, scalable)
INSERT INTO departments (department_name) VALUES
  ('Maths'),
  ('English'),
  ('Biology'),
  ('Chemistry'),
  ('Physics')
ON DUPLICATE KEY UPDATE
  department_name = VALUES(department_name);

-- Classes (managed as their own entity, while remaining compatible with existing reports/marks logic)
INSERT INTO classes (class_name, description) VALUES
  ('9A', 'Grade 9 Section A'),
  ('9B', 'Grade 9 Section B'),
  ('10A', 'Grade 10 Section A'),
  ('10B', 'Grade 10 Section B')
ON DUPLICATE KEY UPDATE
  description = VALUES(description);

-- Default subjects (scalable: you can add more subjects later)
INSERT INTO subjects (subject_name, department_id, total_mark) VALUES
  ('Maths', (SELECT department_id FROM departments WHERE department_name = 'Maths' LIMIT 1), 100),
  ('English', (SELECT department_id FROM departments WHERE department_name = 'English' LIMIT 1), 100),
  ('Biology', (SELECT department_id FROM departments WHERE department_name = 'Biology' LIMIT 1), 100),
  ('Chemistry', (SELECT department_id FROM departments WHERE department_name = 'Chemistry' LIMIT 1), 100),
  ('Physics', (SELECT department_id FROM departments WHERE department_name = 'Physics' LIMIT 1), 100)
ON DUPLICATE KEY UPDATE
  subject_name = VALUES(subject_name),
  department_id = VALUES(department_id),
  total_mark = VALUES(total_mark);

-- Default teachers (subject-based departments)
INSERT INTO teachers (
  teacher_name,
  department_id,
  assigned_class,
  assigned_class_id,
  role,
  username,
  password_hash
)
SELECT 'Mr. Genet',
       (SELECT department_id FROM departments WHERE department_name = 'Maths' LIMIT 1),
       NULL,
       NULL,
       'Subject Teacher',
       'genet',
       @teacher_hash
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE teacher_name = 'Mr. Genet');

INSERT INTO teachers (
  teacher_name,
  department_id,
  assigned_class,
  assigned_class_id,
  role,
  username,
  password_hash
)
SELECT 'Ms. Alemu',
       (SELECT department_id FROM departments WHERE department_name = 'English' LIMIT 1),
       NULL,
       NULL,
       'Subject Teacher',
       'alemu',
       @teacher_hash
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE teacher_name = 'Ms. Alemu');

INSERT INTO teachers (
  teacher_name,
  department_id,
  assigned_class,
  assigned_class_id,
  role,
  username,
  password_hash
)
SELECT 'Mr. Tola',
       (SELECT department_id FROM departments WHERE department_name = 'Biology' LIMIT 1),
       NULL,
       NULL,
       'Subject Teacher',
       'tola',
       @teacher_hash
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE teacher_name = 'Mr. Tola');

INSERT INTO teachers (
  teacher_name,
  department_id,
  assigned_class,
  assigned_class_id,
  role,
  username,
  password_hash
)
SELECT 'Ms. OLyad',
       (SELECT department_id FROM departments WHERE department_name = 'Chemistry' LIMIT 1),
       NULL,
       NULL,
       'Subject Teacher',
       'olyad',
       @teacher_hash
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE teacher_name = 'Ms. OLyad');

INSERT INTO teachers (
  teacher_name,
  department_id,
  assigned_class,
  assigned_class_id,
  role,
  username,
  password_hash
)
SELECT 'Mr. Alemayehu',
       (SELECT department_id FROM departments WHERE department_name = 'Physics' LIMIT 1),
       NULL,
       NULL,
       'Subject Teacher',
       'alemayehu',
       @teacher_hash
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE teacher_name = 'Mr. Alemayehu');

-- One homeroom teacher per class (example class: 9A)
INSERT INTO teachers (
  teacher_name,
  department_id,
  assigned_class,
  assigned_class_id,
  role,
  username,
  password_hash
)
SELECT 'Addisu',
       (SELECT department_id FROM departments WHERE department_name = 'Maths' LIMIT 1),
       '9A',
       (SELECT class_id FROM classes WHERE class_name = '9A' LIMIT 1),
       'Homeroom Teacher',
       'addisu',
       @teacher_hash
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE role = 'Homeroom Teacher' AND assigned_class = '9A');

UPDATE teachers t
LEFT JOIN classes c ON c.class_name = TRIM(t.assigned_class)
SET t.assigned_class_id = c.class_id
WHERE t.assigned_class IS NOT NULL
  AND TRIM(t.assigned_class) <> ''
  AND (t.assigned_class_id IS NULL OR t.assigned_class_id <> c.class_id);

-- Ensure sample teachers have login credentials (if they already existed)
UPDATE teachers
SET username = 'genet', password_hash = @teacher_hash
WHERE teacher_name = 'Mr. Genet' AND (username IS NULL OR username = '');

UPDATE teachers
SET username = 'alemu', password_hash = @teacher_hash
WHERE teacher_name = 'Ms. Alemu' AND (username IS NULL OR username = '');

UPDATE teachers
SET username = 'tola', password_hash = @teacher_hash
WHERE teacher_name = 'Mr. Tola' AND (username IS NULL OR username = '');

UPDATE teachers
SET username = 'olyad', password_hash = @teacher_hash
WHERE teacher_name = 'Ms. OLyad' AND (username IS NULL OR username = '');

UPDATE teachers
SET username = 'alemayehu', password_hash = @teacher_hash
WHERE teacher_name = 'Mr. Alemayehu' AND (username IS NULL OR username = '');

UPDATE teachers
SET username = 'addisu', password_hash = @teacher_hash
WHERE teacher_name = 'Addisu' AND (username IS NULL OR username = '');

-- Assign subject teachers to subjects (department must match)
UPDATE subjects
SET teacher_id = (SELECT teacher_id FROM teachers WHERE teacher_name = 'Mr. Genet' LIMIT 1)
WHERE subject_name = 'Maths';

UPDATE subjects
SET teacher_id = (SELECT teacher_id FROM teachers WHERE teacher_name = 'Ms. Alemu' LIMIT 1)
WHERE subject_name = 'English';

UPDATE subjects
SET teacher_id = (SELECT teacher_id FROM teachers WHERE teacher_name = 'Mr. Tola' LIMIT 1)
WHERE subject_name = 'Biology';

UPDATE subjects
SET teacher_id = (SELECT teacher_id FROM teachers WHERE teacher_name = 'Ms. OLyad' LIMIT 1)
WHERE subject_name = 'Chemistry';

UPDATE subjects
SET teacher_id = (SELECT teacher_id FROM teachers WHERE teacher_name = 'Mr. Alemayehu' LIMIT 1)
WHERE subject_name = 'Physics';

-- Admin user is created automatically by the backend on first start if none exists:
--   username: admin
--   password: admin123
