// ═══════════════════════════════════════════════════════════════════
// modules/auth.js  —  Authentication, session, API helper
// ═══════════════════════════════════════════════════════════════════

const API_BASE = "http://127.0.0.1:8000/api";

// ─── GLOBAL STATE ─────────────────────────────────────────────────
window.antboxState = window.antboxState || {
  token: null,
  role: null, // UI role: Student | Intern | Staff | HR
  backendRole: null, // Raw backend enum: student | intern | client | staff | admin
  userId: null,
  userName: "",
  checkedIn: false,
  checkinTime: null,
  currentTrack: "SDE",
  talentFilter: "all",
  currentView: null,
};

// ─── ROLE MAP: backend enum → UI key ──────────────────────────────
// "Deployed" (client) is removed as a separate UI role.
// client backend users land in the Intern dashboard view.
const ROLE_MAP = {
  admin: "HR",
  staff: "Staff",
  intern: "Intern",
  student: "Student",
  client: "Intern", // Deployed interns use the Intern dashboard
};

function mapRole(backendRole) {
  return ROLE_MAP[backendRole] || "Student";
}

// ─── API REQUEST HELPER ───────────────────────────────────────────
window.apiRequest = async function (method, path, body = null) {
  const token =
    window.antboxState.token || localStorage.getItem("antbox_token");

  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (res.status === 401) {
    doLogout();
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    let err = { detail: "Request failed" };
    try {
      err = await res.json();
    } catch {}
    throw new Error(err.detail || "Request failed");
  }

  return res.json();
};

// ─── CONNECTIVITY CHECK ───────────────────────────────────────────
window.checkConnectivity = async function () {
  const badge = document.getElementById("connectivityBadge");
  const label = document.getElementById("connectivityLabel");
  try {
    await fetch("http://127.0.0.1:8000/health");
    if (badge) badge.className = "connectivity-badge live";
    if (label) label.textContent = "⚡ Live";
  } catch {
    if (badge) badge.className = "connectivity-badge offline";
    if (label) label.textContent = "◌ Offline";
  }
};

// ─── MODAL CONTROLS ───────────────────────────────────────────────
window.openLoginModal = function () {
  document.getElementById("loginModal")?.classList.add("open");
};
window.closeLoginModal = function () {
  document.getElementById("loginModal")?.classList.remove("open");
};

// ─── PREFILL ROLE ─────────────────────────────────────────────────
window.prefillRole = function (role) {
  // Map UI pill labels → login select values
  const roleValueMap = {
    Student: "student",
    Intern: "intern",
    Staff: "staff",
    HR: "admin",
  };
  const select = document.getElementById("loginRole");
  if (select) select.value = roleValueMap[role] || "student";
  openLoginModal();
  showToast(`Role pre-selected: ${role}. Enter your credentials.`, "info");
};

// ─── EMAIL LOGIN ──────────────────────────────────────────────────
window.doLogin = async function () {
  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPwd")?.value;

  if (!email || !password) {
    showToast("Please enter email and password", "warning");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.detail || "Login failed", "warning");
      return;
    }

    const uiRole = mapRole(data.role);
    window.antboxState.backendRole = data.role;

    window.antboxState.token = data.access_token;
    window.antboxState.role = uiRole;
    window.antboxState.backendRole = data.role;
    window.antboxState.userId = data.user_id;
    window.antboxState.userName =
      data.name ||
      email
        .split("@")[0]
        .replace(".", " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

    localStorage.setItem("antbox_token", data.access_token);
    localStorage.setItem("antbox_role", uiRole);
    localStorage.setItem("antbox_backend_role", data.role);
    localStorage.setItem("antbox_user_id", data.user_id || "");
    localStorage.setItem("antbox_user", window.antboxState.userName);

    closeLoginModal();
    launchApp();
    showToast(`Welcome back, ${window.antboxState.userName} ✓`, "success");
  } catch (err) {
    console.error(err);
    showToast(err.message || "Backend unreachable", "warning");
  }
};

// ─── LOGOUT ──────────────────────────────────────────────────────
window.doLogout = function () {
  [
    "antbox_token",
    "antbox_role",
    "antbox_backend_role",
    "antbox_user_id",
    "antbox_user",
  ].forEach((k) => localStorage.removeItem(k));

  window.antboxState = {
    token: null,
    role: null,
    backendRole: null,
    userId: null,
    userName: "",
    checkedIn: false,
    checkinTime: null,
    currentTrack: "SDE",
    talentFilter: "all",
    currentView: null,
  };

  const shell = document.getElementById("app-shell");
  const landing = document.getElementById("landing-page");
  if (shell) shell.style.display = "none";
  if (landing) landing.style.display = "flex";

  showToast("Signed out successfully", "info");
};

// ─── SESSION RESTORE ─────────────────────────────────────────────
window.restoreSession = function () {
  const token = localStorage.getItem("antbox_token");
  const role = localStorage.getItem("antbox_role");
  const bRole = localStorage.getItem("antbox_backend_role");
  const userId = localStorage.getItem("antbox_user_id");
  const userName = localStorage.getItem("antbox_user");

  if (token && role) {
    window.antboxState.token = token;
    window.antboxState.role = role;
    window.antboxState.backendRole = bRole || null;
    window.antboxState.userId = userId || null;
    window.antboxState.userName = userName || role;

    launchApp();
  }
};
