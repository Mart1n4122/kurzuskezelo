# kurzuskezelo

12. Online kurzuskezelő
    Kurzusok nyilvántartása. Role: oktató vagy diák. Az oktató rögzíthet kurzust, a diák jelentkezhet kurzusra, vagy megnézheti a kurzusokat.

Végpontok:
GET /api/courses
POST /api/courses (oktató)
POST /api/courses/:id/enroll
GET /api/mycourses

Táblák:
users(id, name, email, password_hash, role)
courses(id, title, description, teacher_id)
enrollments(course_id, user_id)

Frontend:
Kurzuslista
Saját kurzusaim oldal
Login / Register oldal
