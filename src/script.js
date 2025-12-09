const API = "http://localhost:3000/api";
let user = JSON.parse(localStorage.getItem("user") || "null");

function requireLogin() {
    if (!user) window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const userStatus = document.getElementById("userStatus");
    const userBadge  = document.getElementById("userBadge");
    const userMenu   = document.getElementById("userMenu");
    const logoutBtn  = document.getElementById("logoutBtn");

    if (!userStatus) return;

    const raw = localStorage.getItem("user");
    if (!raw) {
        userStatus.classList.add("hidden");
        return;
    }

    const u = JSON.parse(raw);
    user = u;

    userBadge.textContent = `${u.name} (${u.role})`;
    userStatus.classList.remove("hidden");

    userBadge.addEventListener("click", () => {
        userMenu.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
        if (!userStatus.contains(e.target)) {
            userMenu.classList.add("hidden");
        }
    });

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("user");
        window.location.href = "login.html";
    });

    const nav = document.querySelector("nav");
    if (nav && u.role === "teacher" && !document.getElementById("newCourseLink")) {
        const link = document.createElement("a");
        link.href = "newcourse.html";
        link.id = "newCourseLink";
        link.textContent = "Új kurzus";
        nav.appendChild(link);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) loginBtn.addEventListener("click", login);
});

async function login() {
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    let r = await fetch(API + "/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ email, password })
    });

    let data = await r.json();
    if (data.error) return alert(data.error);

    localStorage.setItem("user", JSON.stringify(data));
    window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const registerBtn = document.getElementById("registerBtn");
    if (registerBtn) registerBtn.addEventListener("click", register);
});

async function register() {
    let name = document.getElementById("name").value;
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let role = document.getElementById("role").value;

    let r = await fetch(API + "/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ name, email, password, role })
    });

    let data = await r.json();
    if (data.error) return alert(data.error);

    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    if (location.pathname.endsWith("index.html") ||
        location.pathname.endsWith("/") ) {
        loadCourses();
    }
});

async function loadCourses() {
    let r = await fetch(API + "/courses");
    let courses = await r.json();

    const list = document.getElementById("list");
    if (!list) return;
    list.innerHTML = "";

    courses.forEach(c => {
        let div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
            <div class="card-body">
              <h3>${c.title}</h3>
              <p>${c.description}</p>
              <p><b>Oktató:</b> ${c.teacher_name}</p>
            </div>
        `;

        if (user && user.role === "student") {
            let btn = document.createElement("button");
            btn.textContent = "Jelentkezés";
            btn.addEventListener("click", () => enroll(c.id));
            div.appendChild(btn);
        }

        list.appendChild(div);
    });
}

async function enroll(id) {
    let r = await fetch(API + `/courses/${id}/enroll`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ user_id: user.id })
    });

    let data = await r.json();
    if (data.error) return alert(data.error);
    alert("Sikeresen jelentkeztél!");
}

document.addEventListener("DOMContentLoaded", () => {
    if (location.pathname.endsWith("mycourses.html")) {
        requireLogin();
        loadMyCourses();
    }
});

async function loadMyCourses() {
    user = JSON.parse(localStorage.getItem("user") || "null");

    const list = document.getElementById("list");
    if (!list) return;
    list.innerHTML = "";

    if (!user) {
        list.innerHTML = `<div class="empty">Kérlek jelentkezz be.</div>`;
        return;
    }

    if (user.role === "teacher") {
        try {
            const r = await fetch(`${API}/teacher-courses?user_id=${user.id}`);
            if (r.ok) {
                const courses = await r.json();
                if (Array.isArray(courses) && courses.length > 0) {
                    renderTeacherCourses(courses, list);
                    return;
                }
            }
        } catch (err) {
            console.info("teacher-courses endpoint nem elérhető vagy hibás — fallback kliens-oldali szűrés fut.");
        }

        try {
            const r2 = await fetch(`${API}/courses`);
            const all = await r2.json();
            const my = all.filter(c => String(c.teacher_id) === String(user.id));
            if (!my.length) {
                list.innerHTML = `<div class="empty">Még nincs saját kurzusod.</div>`;
                return;
            }
            renderTeacherCourses(my, list);
            return;
        } catch (err) {
            console.error("Hiba az összes kurzus lekérésekor:", err);
            list.innerHTML = `<div class="empty">Hiba történt—próbáld újra később.</div>`;
            return;
        }
    }

    try {
        const r = await fetch(`${API}/mycourses?user_id=${user.id}`);
        if (!r.ok) {
            list.innerHTML = `<div class="empty">Hiba a kurzusok betöltésekor.</div>`;
            return;
        }
        const courses = await r.json();
        if (!courses.length) {
            list.innerHTML = `<div class="empty">Még nem jelentkeztél egy kurzusra sem.</div>`;
            return;
        }
        courses.forEach(c => {
            const div = document.createElement("div");
            div.className = "card";
            div.innerHTML = `
                <div class="card-body">
                  <h3>${c.title}</h3>
                  <p>${c.description}</p>
                </div>
            `;
            list.appendChild(div);
        });
    } catch (err) {
        console.error(err);
        list.innerHTML = `<div class="empty">Hiba történt—ellenőrizd a kapcsolatot.</div>`;
    }
}

function renderTeacherCourses(courses, container) {
    container.innerHTML = "";
    courses.forEach(c => {
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
            <div class="card-body">
              <h3>${c.title}</h3>
              <p>${c.description}</p>
              <p class="muted"><small>Kurzus ID: ${c.id}</small></p>
            </div>
        `;
        container.appendChild(div);
    });
}



document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("courseForm");
    if (!form) return;

    requireLogin();
    if (user.role !== "teacher") {
        alert("Ehhez oktatói jogosultság kell!");
        return window.location.href = "index.html";
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("title").value.trim();
        const description = document.getElementById("description").value.trim();

        let r = await fetch(API + "/courses", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                title,
                description,
                teacher_id: user.id
            })
        });

        if (r.ok) {
            alert("Kurzus rögzítve!");
            window.location.href = "index.html";
        } else {
            alert("Hiba történt a mentéskor.");
        }
    });
});
