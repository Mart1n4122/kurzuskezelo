import Database from "better-sqlite3";
import bcrypt from "bcrypt";

const db = new Database("database/courses.db");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password_hash TEXT,
    role TEXT CHECK(role IN ('teacher', 'student'))
);

CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    teacher_id INTEGER
);

CREATE TABLE IF NOT EXISTS enrollments (
    course_id INTEGER,
    user_id INTEGER,
    PRIMARY KEY (course_id, user_id)
);
`);

function seed() {
    const userCount = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;

    if (userCount > 0) {
        console.log("Az adatbázis már tartalmaz adatokat, seed elhagyva.");
        return;
    }

    console.log("➡️ Seeding indul…");

    const hashPassword = (pw) => bcrypt.hashSync(pw, 10);

    const insertUser = db.prepare(`
        INSERT INTO users (name, email, password_hash, role)
        VALUES (?, ?, ?, ?)
    `);

    const teacher1 = insertUser.run(
        "Kiss Béla",
        "bela@example.com",
        hashPassword("password123"),
        "teacher"
    ).lastInsertRowid;

    const teacher2 = insertUser.run(
        "Nagy Mária",
        "maria@example.com",
        hashPassword("password123"),
        "teacher"
    ).lastInsertRowid;

    const student1 = insertUser.run(
        "Tóth Gergő",
        "gergo@example.com",
        hashPassword("password123"),
        "student"
    ).lastInsertRowid;

    const student2 = insertUser.run(
        "Szabó Anna",
        "anna@example.com",
        hashPassword("password123"),
        "student"
    ).lastInsertRowid;

    const insertCourse = db.prepare(`
        INSERT INTO courses (title, description, teacher_id)
        VALUES (?, ?, ?)
    `);

    const course1 = insertCourse.run(
        "JavaScript Alapok",
        "Bevezetés a JS világába",
        teacher1
    ).lastInsertRowid;

    const course2 = insertCourse.run(
        "Backend fejlesztés Node.js-sel",
        "API-k, adatbázis, middleware",
        teacher2
    ).lastInsertRowid;

    const enroll = db.prepare(`
        INSERT INTO enrollments (course_id, user_id)
        VALUES (?, ?)
    `);

    enroll.run(course1, student1);
    enroll.run(course1, student2);
    enroll.run(course2, student1);

    console.log("Seeding kész!");
}
seed();

export default db;
