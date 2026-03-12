USE student_academic_management;

-- Departments
INSERT INTO departments (department_name) VALUES
  ('General'),
  ('Science'),
  ('Languages')
ON DUPLICATE KEY UPDATE
  department_name = VALUES(department_name);

-- Default subjects (scalable: you can add more subjects later)
INSERT INTO subjects (subject_name, department_id, total_mark) VALUES
  ('Maths', (SELECT department_id FROM departments WHERE department_name = 'General' LIMIT 1), 100),
  ('English', (SELECT department_id FROM departments WHERE department_name = 'Languages' LIMIT 1), 100),
  ('Biology', (SELECT department_id FROM departments WHERE department_name = 'Science' LIMIT 1), 100),
  ('Chemistry', (SELECT department_id FROM departments WHERE department_name = 'Science' LIMIT 1), 100),
  ('Physics', (SELECT department_id FROM departments WHERE department_name = 'Science' LIMIT 1), 100)
ON DUPLICATE KEY UPDATE
  subject_name = VALUES(subject_name),
  department_id = VALUES(department_id),
  total_mark = VALUES(total_mark);

-- Admin user is created automatically by the backend on first start if none exists:
--   username: admin
--   password: admin123
