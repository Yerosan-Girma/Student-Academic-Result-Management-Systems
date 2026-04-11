USE student_academic_management;

CREATE TABLE IF NOT EXISTS classes (
  class_id INT NOT NULL AUTO_INCREMENT,
  class_name VARCHAR(50) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (class_id),
  UNIQUE KEY uq_classes_name (class_name)
) ENGINE=InnoDB;

INSERT INTO classes (class_name)
SELECT legacy_classes.class_name
FROM (
  SELECT DISTINCT TRIM(grade) AS class_name
  FROM students
  WHERE grade IS NOT NULL AND TRIM(grade) <> ''
  UNION
  SELECT DISTINCT TRIM(assigned_class) AS class_name
  FROM teachers
  WHERE assigned_class IS NOT NULL AND TRIM(assigned_class) <> ''
) AS legacy_classes
ON DUPLICATE KEY UPDATE
  class_name = VALUES(class_name);
