USE student_academic_management;

ALTER TABLE students
  ADD COLUMN class_id INT NULL AFTER grade,
  ADD INDEX idx_students_class (class_id);

UPDATE students s
JOIN classes c ON c.class_name = TRIM(s.grade)
SET s.class_id = c.class_id
WHERE TRIM(s.grade) <> '';

ALTER TABLE students
  ADD CONSTRAINT fk_students_class
  FOREIGN KEY (class_id)
  REFERENCES classes (class_id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;

ALTER TABLE teachers
  ADD COLUMN assigned_class_id INT NULL AFTER assigned_class,
  ADD INDEX idx_teachers_assigned_class_id (assigned_class_id);

UPDATE teachers t
JOIN classes c ON c.class_name = TRIM(t.assigned_class)
SET t.assigned_class_id = c.class_id
WHERE t.assigned_class IS NOT NULL
  AND TRIM(t.assigned_class) <> '';

ALTER TABLE teachers
  ADD CONSTRAINT fk_teachers_assigned_class
  FOREIGN KEY (assigned_class_id)
  REFERENCES classes (class_id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;
