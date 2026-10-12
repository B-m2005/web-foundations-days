# School Database Design

## Tables

**students** - stores each student's name and email address.
The email column is UNIQUE because no two students can share
the same email address.

**courses** - stores the title and description of each course
offered by the school.

**enrolments** - links students to courses and records the
grade each student received. It is the join table that makes
the many-to-many relationship between students and courses
possible.

## Relationships

**students → enrolments** is one-to-many: one student can have
many enrolments but each enrolment row belongs to exactly one
student.

**courses → enrolments** is one-to-many: one course can have
many enrolments but each enrolment row belongs to exactly one
course.

**students ↔ courses** is many-to-many: a student can enrol on
many courses and a course can have many students. A direct link
between the two tables is not possible in SQL, so a join table
(enrolments) is needed. Each row in enrolments represents one
student-course pair and also stores the grade for that pairing.

The UNIQUE constraint on (student_id, course_id) prevents the
same student from enrolling on the same course twice.

## Index

```sql
CREATE INDEX idx_enrolments_student_id ON enrolments(student_id);
```

This index speeds up the very common query of finding all
courses for a given student. Without it, SQLite must scan every
row in enrolments; with it, it jumps straight to the matching
rows.

## SQL or NoSQL?

SQL is the right choice for this system. Student records,
courses and enrolments have a fixed, well-defined structure
that maps naturally to tables and columns. The relationships
between them are enforced by foreign keys, which prevents
orphaned enrolment rows. Queries such as counting students per
course or finding unenrolled students are expressed cleanly
with JOIN and GROUP BY. A NoSQL store such as MongoDB would
make these cross-collection queries harder to write and would
give up the referential integrity that an academic record
system requires.
