// ═══════════════════════════════════════════════════════════════════
// scripts/app.js
// ═══════════════════════════════════════════════════════════════════

// ─── GLOBAL STATE ─────────────────────────────────────────────────
window.antboxState = {
  role: null,
  token: null,
  userName: "",
  checkedIn: false,
  checkinTime: null,
  currentTrack: "SDE",
  talentFilter: "all",
  currentView: null,
};

// ─── NAV CONFIG ───────────────────────────────────────────────────
window.navConfig = {
  Student: [
    { id: "overview", label: "Overview", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>` },
    { id: "sprints", label: "Sprint Modules", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>` },
    { id: "readiness", label: "Readiness Score", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>` },
    { id: "leave", label: "Leave Request", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>` },
  ],

  Intern: [
    { id: "overview", label: "Overview", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>` },
    { id: "checkin", label: "Check In / Out", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>` },
    { id: "sprints", label: "Tasks", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>` },
    { id: "readiness", label: "Readiness", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>` },
    { id: "stipend", label: "My Stipend", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>` },
    { id: "leave", label: "Leave Request", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>` },
  ],

  Deployed: [
    { id: "overview", label: "Overview", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>` },
    { id: "checkin", label: "Check In / Out", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>` },
    { id: "ppo", label: "PPO Tracker", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>` },
    { id: "stipend", label: "My Stipend", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>` },
    { id: "leave", label: "Leave Request", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>` },
  ],

  Staff: [
    { id: "overview", label: "Overview", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>` },
    { id: "pipeline", label: "B2B Pipeline", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>` },
    { id: "talent", label: "Talent Shortlister", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>` },
    { id: "leave", label: "Leave Request", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>` },
    { id: "salary", label: "My Salary", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>` },
  ],

  HR: [
    { id: "overview", label: "Overview", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>` },
    { id: "analytics", label: "Analytics", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>` },
    { id: "cohorts", label: "Cohort Manager", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>` },
    { id: "hr-leave", label: "Leave Approvals", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>` },
    { id: "payroll-engine", label: "Payroll Engine", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>` },
    { id: "stipend-processor", label: "Stipend Processor", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>` },
    { id: "payroll-analytics", label: "Payroll Analytics", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>` },
    { id: "org", label: "Identity Control", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>` },
  ],
};

// ─── TOAST ────────────────────────────────────────────────────────
window.showToast = function (msg, type = "info") {
  const container = document.getElementById("toastContainer");

  if (!container) {
    console.log(type, msg);
    return;
  }

  const toast = document.createElement("div");

  toast.className = `toast ${type}`;
  toast.textContent = msg;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";

    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
};

// ─── NAVIGATION ───────────────────────────────────────────────────
window.navigateTo = function (viewId) {
  const allowedViews = (window.navConfig[window.antboxState.role] || []).map(
    (v) => v.id,
  );

  // Payroll dispatcher owns its own view IDs — don't block them
  const _payrollManagedViews = [
    "stipend",
    "salary",
    "payroll-engine",
    "stipend-processor",
    "payroll-analytics",
  ];

  if (
    !allowedViews.includes(viewId) &&
    !_payrollManagedViews.includes(viewId)
  ) {
    console.warn("Unauthorized view:", viewId);

    return;
  }

  document
    .querySelectorAll(".page-view")
    .forEach((v) => v.classList.remove("active"));

  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));

  const view = document.getElementById(`view-${viewId}`);

  const navBtn = document.getElementById(`nav-${viewId}`);

  if (view) {
    view.classList.add("active");
  }

  if (navBtn) {
    navBtn.classList.add("active");
  }
  // ─── PAYROLL VIEW DISPATCHERS ─────────────────────
  try {
    if (viewId === "stipend") {
      const _bRole = (window.antboxState?.backendRole || "").toLowerCase();
      if (
        _bRole === "admin" &&
        typeof window.renderHRStipendProcessor === "function"
      ) {
        window.renderHRStipendProcessor();
      } else if (typeof window.renderInternPayroll === "function") {
        window.renderInternPayroll();
      }
    }

    if (viewId === "salary" && typeof window.renderStaffSalary === "function") {
      window.renderStaffSalary();
    }

    if (
      viewId === "payroll-engine" &&
      typeof window.renderHRPayrollEngine === "function"
    ) {
      window.renderHRPayrollEngine();
    }

    if (
      viewId === "stipend-processor" &&
      typeof window.renderStipendProcessor === "function"
    ) {
      window.renderStipendProcessor();
    }

    if (
      viewId === "payroll-analytics" &&
      typeof window.renderPayrollAnalytics === "function"
    ) {
      window.renderPayrollAnalytics();
    }
  } catch (e) {
    console.error("Payroll route dispatch failed:", e);
  }
  window.antboxState.currentView = viewId;
};

// ─── SIDEBAR ──────────────────────────────────────────────────────
window.buildSidebar = function () {
  const userName = document.getElementById("sidebarUserName");

  const userRole = document.getElementById("sidebarUserRole");

  if (userName) {
    userName.textContent = window.antboxState.userName;
  }

  if (userRole) {
    userRole.textContent =
      {
        Student: "Bootcamp Student · Demo ID",

        Intern: "Active Intern · Real ID",

        Deployed: "Deployed Intern · Razorpay",

        Staff: "Sales & Operations",

        HR: "HR / Executive Root",
      }[window.antboxState.role] || window.antboxState.role;
  }

  const nav = document.getElementById("sidebarNav");

  if (!nav) return;

  nav.innerHTML = "";

  (window.navConfig[window.antboxState.role] || []).forEach((item) => {
    const btn = document.createElement("button");

    btn.className = "nav-item";

    btn.id = `nav-${item.id}`;

    btn.innerHTML = `<span class="nav-icon">${item.icon}</span><span class="nav-label">${item.label}</span>`;

    btn.onclick = () => navigateTo(item.id);

    nav.appendChild(btn);
  });
};

// ─── OVERVIEW ─────────────────────────────────────────────────────
window.buildOverview = function () {
  const role = window.antboxState.role;

  const title = document.getElementById("overviewTitle");

  const desc = document.getElementById("overviewDesc");

  if (title) {
    title.textContent = `${role} Dashboard`;
  }

  if (desc) {
    desc.textContent = "Operational overview";
  }

  const stats = document.getElementById("statsRow");

  if (stats) {
    let statsHTML = "";

    if (role === "Student") {
      statsHTML = `
        <div class="stat-card purple-card">
          <div class="stat-label">Readiness</div>
          <div class="stat-value">82</div>
          <div class="stat-delta">↑ Stable</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Modules</div>
          <div class="stat-value">14</div>
          <div class="stat-delta">In Progress</div>
        </div>
      `;
    } else if (role === "Intern" || role === "Deployed") {
      statsHTML = `
        <div class="stat-card purple-card">
          <div class="stat-label">Attendance</div>
          <div class="stat-value">96%</div>
          <div class="stat-delta">↑ Excellent</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Tasks</div>
          <div class="stat-value">14</div>
          <div class="stat-delta">In Progress</div>
        </div>
      `;
    } else if (role === "Staff") {
      statsHTML = `
        <div class="stat-card purple-card">
          <div class="stat-label">Clients</div>
          <div class="stat-value">12</div>
          <div class="stat-delta">↑ 3 New</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Deployments</div>
          <div class="stat-value">28</div>
          <div class="stat-delta">Active</div>
        </div>
      `;
    } else if (role === "HR") {
      statsHTML = `
        <div class="stat-card purple-card">
          <div class="stat-label">Employees</div>
          <div class="stat-value">84</div>
          <div class="stat-delta">↑ Growing</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Payroll</div>
          <div class="stat-value">₹4.2L</div>
          <div class="stat-delta">June Cycle</div>
        </div>
      `;
    }

    stats.innerHTML = statsHTML;
  }

  const grid = document.getElementById("overviewGrid");

  if (!grid) return;

  // IMPORTANT FIX
  grid.innerHTML = "";

  if (role === "Student") {
    if (window.buildStudentOverviewGrid) {
      buildStudentOverviewGrid(grid);
    }
  } else if (role === "Intern" || role === "Deployed") {
    if (window.buildInternOverviewGrid) {
      buildInternOverviewGrid(grid);
    }
  } else if (role === "Staff") {
    grid.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            Staff Operations
          </div>
        </div>

        <div class="card-body">
          <p>
            Monitor client pipelines,
            deployments and staffing.
          </p>
        </div>
      </div>
    `;
  } else if (role === "HR") {
    if (window.buildHROverviewGrid) {
      buildHROverviewGrid(grid);
    }
  }
};

// ─── APP LAUNCH ──────────────────────────────────────────────────
window.launchApp = function () {
  const landing = document.getElementById("landing-page");

  const shell = document.getElementById("app-shell");

  if (landing) {
    landing.style.display = "none";
  }

  if (shell) {
    shell.style.display = "flex";
  }

  buildSidebar();

  buildOverview();

  if (window.buildTalentTable) {
    buildTalentTable();
  }

  if (window.buildLeaveRequests) {
    buildLeaveRequests();
  }

  if (window.buildUserRegistry) {
    buildUserRegistry();
  }

  if (window.buildAttGrid) {
    buildAttGrid();
  }

  if (window.startClock) {
    startClock();
  }

  navigateTo("overview");

  // Initialize payroll view for the active role on app launch
  if (window._dispatchPayrollView) {
    const bRole = (window.antboxState?.backendRole || "").toLowerCase();
    if (bRole === "intern" || bRole === "client") {
      // Pre-render intern stipend so it's ready on first click
      setTimeout(() => {
        if (window.renderInternPayroll) window.renderInternPayroll();
      }, 300);
    } else if (bRole === "staff") {
      setTimeout(() => {
        if (window.renderStaffSalary) window.renderStaffSalary();
      }, 300);
    }
  }

  if (window.checkConnectivity) {
    checkConnectivity();

    setInterval(checkConnectivity, 30000);
  }

  // FIXED BUG
  if (window.antboxState.role === "HR" && window.injectAnalyticsView) {
    injectAnalyticsView();
  }
};

// ─── AUTO RESTORE SESSION ────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (window.restoreSession) {
    restoreSession();
  }
});
