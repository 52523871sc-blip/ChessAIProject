Auth Frontend

Overview
- Static HTML/CSS/JS UI for registration, login, and profile editing

Run
- Option A: open index.html directly in a browser
- Option B: start a local static server
  - python3 -m http.server 5500
  - Open http://localhost:5500/

Backend API
- Base URL: http://localhost:8080/api
- Register: POST /auth/register
- Login:    POST /auth/login
- Profile:  GET/PUT /profile/me (requires Authorization: Bearer <token>)

Behavior
- Login stores the token in localStorage
- Profile view loads and updates email, full name, and bio
