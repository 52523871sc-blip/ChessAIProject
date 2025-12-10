const API_BASE = 'http://localhost:8081/api';

const state = {
  token: localStorage.getItem('token') || null,
  user: null,
};

function setToken(token) {
  state.token = token || null;
  if (state.token) localStorage.setItem('token', state.token);
  else localStorage.removeItem('token');
}

function updateUserLabel() {
  const label = document.getElementById('user-label');
  if (!label) return;
  label.textContent = state.user && state.user.username ? `Hello, ${state.user.username}` : '';
}

function updateNav() {
  const loggedIn = !!state.token;
  const navLogin = document.getElementById('nav-login');
  const navProfile = document.getElementById('nav-profile');
  const navGame = document.getElementById('nav-game');
  const btnLogout = document.getElementById('logout-btn');
  if (navLogin) navLogin.classList.toggle('hidden', loggedIn);
  if (navProfile) navProfile.classList.toggle('hidden', !loggedIn);
  if (navGame) navGame.classList.toggle('hidden', !loggedIn);
  if (btnLogout) btnLogout.classList.toggle('hidden', !loggedIn);
  updateUserLabel();
}

function ensureLoggedIn() {
  if (!state.token) {
    window.location.href = 'login.html';
  }
}

async function fetchProfile() {
  if (!state.token) return null;
  const res = await fetch(`${API_BASE}/profile/me`, {
    headers: { 'Authorization': `Bearer ${state.token}` }
  });
  const data = await res.json();
  if (res.ok) {
    state.user = data;
    updateUserLabel();
    return data;
  }
  return null;
}

function logout() {
  setToken(null);
  state.user = null;
  updateNav();
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  updateNav();
  const btnLogout = document.getElementById('logout-btn');
  if (btnLogout) btnLogout.addEventListener('click', logout);
});
