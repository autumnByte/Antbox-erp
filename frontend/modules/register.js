// ═══════════════════════════════════════════════════════════════════
// modules/register.js  —  Registration modal + API integration
// ═══════════════════════════════════════════════════════════════════

const REG_API_BASE = 'http://127.0.0.1:8000/api';

// ─── MODAL CONTROLS ──────────────────────────────────────────────
window.openRegisterModal = function () {
  const modal = document.getElementById('registerModal');
  if (modal) modal.classList.add('open');
};

window.closeRegisterModal = function () {
  const modal = document.getElementById('registerModal');
  if (modal) modal.classList.remove('open');
};

// ─── VALIDATION ──────────────────────────────────────────────────
function validateRegistration(name, email, pwd, pwdConfirm) {
  if (!name || name.trim().length < 2) {
    showToast('Please enter your full name', 'warning');
    return false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Please enter a valid email address', 'warning');
    return false;
  }
  if (!pwd || pwd.length < 6) {
    showToast('Password must be at least 6 characters', 'warning');
    return false;
  }
  if (pwd !== pwdConfirm) {
    showToast('Passwords do not match', 'warning');
    return false;
  }
  return true;
}

// ─── REGISTER HANDLER ────────────────────────────────────────────
window.doRegister = async function () {
  const name      = document.getElementById('regName')?.value.trim();
  const email     = document.getElementById('regEmail')?.value.trim();
  const pwd       = document.getElementById('regPwd')?.value;
  const pwdConf   = document.getElementById('regPwdConfirm')?.value;
  const role      = document.getElementById('regRole')?.value;
  const track     = document.getElementById('regTrack')?.value;
  const college   = document.getElementById('regCollege')?.value.trim();

  if (!validateRegistration(name, email, pwd, pwdConf)) return;

  const btn = document.querySelector('#registerModal .btn-primary');
  if (btn) {
    btn.textContent = 'Creating account…';
    btn.disabled = true;
  }

  try {
    // 1. Register the user
    const regRes = await fetch(`${REG_API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pwd, role, name, track, college }),
    });

    const regData = await regRes.json();

    if (!regRes.ok) {
      showToast(regData.detail || 'Registration failed', 'warning');
      return;
    }

    // 2. Auto-login after registration
    try {
      const loginRes = await fetch(`${REG_API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pwd }),
      });

      const loginData = await loginRes.json();

      if (loginRes.ok && loginData.access_token) {
        const mappedRole = mapRoleFromServer(loginData.role);
        const displayName = name || email.split('@')[0];

        window.antboxState.token       = loginData.access_token;
        window.antboxState.role        = mappedRole;
        window.antboxState.backendRole = loginData.role;
        window.antboxState.userId      = loginData.user_id;
        window.antboxState.userName    = displayName;

        localStorage.setItem('antbox_token',        loginData.access_token);
        localStorage.setItem('antbox_role',         mappedRole);
        localStorage.setItem('antbox_backend_role', loginData.role);
        localStorage.setItem('antbox_user_id',      loginData.user_id || '');
        localStorage.setItem('antbox_user',         displayName);

        closeRegisterModal();
        launchApp();
        showToast(`Welcome to Antbox, ${window.antboxState.userName}!`, 'success');
        return;
      }
    } catch (loginErr) {
      console.warn('Auto-login after register failed, opening login modal', loginErr);
    }

    // Fallback: close register, open login
    closeRegisterModal();
    openLoginModal();
    showToast('Account created! Please sign in.', 'success');

  } catch (err) {
    console.error('Register error:', err);
    showToast('Backend unreachable. Account not created.', 'warning');
  } finally {
    if (btn) {
      btn.textContent = 'Create Account';
      btn.disabled = false;
    }
  }
};

// ─── ROLE MAPPER (mirrors auth.js mapRole) ───────────────────────
function mapRoleFromServer(role) {
  return (
    {
      admin: 'HR',
      staff: 'Staff',
      intern: 'Intern',
      student: 'Student',
      client: 'Deployed',
    }[role] || 'Student'
  );
}
