document.addEventListener('DOMContentLoaded', async () => {
  ensureLoggedIn();
  updateNav();
  const info = document.getElementById('profile-info');
  const data = await fetchProfile();
  if (!data) { info.textContent = 'Failed to load profile'; return; }
  info.textContent = `Logged in as ${data.username} (${data.email})`;
  document.getElementById('pf-username').textContent = data.username || '';
  document.getElementById('pf-email').textContent = data.email || '';
  document.getElementById('pf-fullName').textContent = data.fullName || '';
  document.getElementById('pf-bio').textContent = data.bio || '';

  const form = document.getElementById('profile-form');
  form.email.value = data.email || '';
  form.fullName.value = data.fullName || '';
  form.bio.value = data.bio || '';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    try {
      const res = await fetch(`${API_BASE}/profile/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify(payload)
      });
      const data2 = await res.json();
      document.getElementById('profile-result').textContent = JSON.stringify(data2, null, 2);
      if (res.ok) {
        state.user = data2;
        updateUserLabel();
        document.getElementById('pf-email').textContent = data2.email || '';
        document.getElementById('pf-fullName').textContent = data2.fullName || '';
        document.getElementById('pf-bio').textContent = data2.bio || '';
      }
    } catch (err) {
      document.getElementById('profile-result').textContent = String(err);
    }
  });
});
