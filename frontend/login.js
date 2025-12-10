document.addEventListener('DOMContentLoaded', () => {
  updateNav();
  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      document.getElementById('login-result').textContent = JSON.stringify(data, null, 2);
      if (res.ok && data.token) {
        setToken(data.token);
        state.user = data.user || null;
        updateNav();
        window.location.href = 'game.html';
      }
    } catch (err) {
      document.getElementById('login-result').textContent = String(err);
    }
  });
});
