import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import db from "../database/db.js";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/register", (req, res) => {
    const { name, email, password, role } = req.body;

    const hash = bcrypt.hashSync(password, 10);

    try {
        db.prepare(`
            INSERT INTO users (name, email, password_hash, role)
            VALUES (?, ?, ?, ?)
        `).run(name, email, hash, role);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: "Email already taken" });
    }
});

app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    const user = db.prepare(`SELECT * FROM users WHERE email=?`).get(email);

    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    if (!bcrypt.compareSync(password, user.password_hash))
        return res.status(400).json({ error: "Invalid credentials" });

    res.json({
        id: user.id,
        name: user.name,
        role: user.role
    });
});

app.get("/api/courses", (req, res) => {
    const courses = db.prepare(`
        SELECT c.*, u.name AS teacher_name
        FROM courses c
        LEFT JOIN users u ON u.id = c.teacher_id
    `).all();

    res.json(courses);
});

app.post("/api/courses", (req, res) => {
    const { title, description, teacher_id } = req.body;

    db.prepare(`
        INSERT INTO courses (title, description, teacher_id)
        VALUES (?, ?, ?)
    `).run(title, description, teacher_id);

    res.json({ success: true });
});

app.post("/api/courses/:id/enroll", (req, res) => {
    const course_id = req.params.id;
    const { user_id } = req.body;

    try {
        db.prepare(`
            INSERT INTO enrollments (course_id, user_id)
            VALUES (?, ?)
        `).run(course_id, user_id);
        res.json({ success: true });
    } catch {
        res.status(400).json({ error: "Already enrolled" });
    }
});

app.get("/api/mycourses", (req, res) => {
    const user_id = req.query.user_id;

    const courses = db.prepare(`
        SELECT c.*
        FROM courses c
        JOIN enrollments e ON e.course_id = c.id
        WHERE e.user_id = ?
    `).all(user_id);

    res.json(courses);
});

app.get("/api/teacher-courses", (req, res) => {
    db.all("SELECT * FROM courses WHERE teacher_id = ?", [req.query.user_id], (err, rows) => {
        res.json(rows);
    });
});


app.listen(3000, () => console.log("Server running on http://localhost:3000"));
