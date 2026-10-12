CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT
);

CREATE TABLE enrolments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students (id),
    FOREIGN KEY (course_id) REFERENCES courses (id),
    UNIQUE (student_id, course_id)
);

INSERT INTO
    students (name, email)
VALUES (
        'Brian Marsh',
        'brian@school.ac.ke'
    ),
    (
        'Amina Odhiambo',
        'amina@school.ac.ke'
    ),
    (
        'Kelvin Mutua',
        'kelvin@school.ac.ke'
    );

INSERT INTO
    courses (title, description)
VALUES (
        'Web Foundations',
        'HTML, CSS and JavaScript basics'
    ),
    (
        'Database Systems',
        'SQL and relational database design'
    ),
    (
        'Python Basics',
        'Introduction to Python programming'
    );

INSERT INTO
    enrolments (student_id, course_id, grade)
VALUES (1, 1, 'A'),
    (1, 2, 'B'),
    (2, 1, 'A'),
    (2, 3, 'B+'),
    (3, 2, 'A-');

SELECT c.title, e.grade
FROM
    enrolments e
    JOIN students s ON s.id = e.student_id
    JOIN courses c ON c.id = e.course_id
WHERE
    s.name = 'Brian Marsh';

SELECT s.name, s.email, e.grade
FROM
    enrolments e
    JOIN students s ON s.id = e.student_id
    JOIN courses c ON c.id = e.course_id
WHERE
    c.title = 'Web Foundations';

SELECT c.title, COUNT(e.student_id) AS student_count
FROM courses c
    LEFT JOIN enrolments e ON c.id = e.course_id
GROUP BY
    c.id,
    c.title;

SELECT s.name, s.email
FROM students s
    LEFT JOIN enrolments e ON s.id = e.student_id
WHERE
    e.id IS NULL;

UPDATE enrolments
SET
    grade = 'A+'
WHERE
    student_id = 1
    AND course_id = 1;