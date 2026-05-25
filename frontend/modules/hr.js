// ═══════════════════════════════════════════════════════════════════
// modules/hr.js  —  Leave approvals, Identity Control, HR Overview
// All data fetched from backend — no hardcoded arrays.
// ═══════════════════════════════════════════════════════════════════

// ─── LEAVE REQUESTS ────────────────────────────────────────────────
window.buildLeaveRequests = async function () {
  const list = document.getElementById("leaveRequestList");
  if (!list) return;

  list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);">Loading leave requests…</div>`;

  try {
    const data = await apiRequest("GET", "/leaves?status=pending&limit=50");
    const leaves = Array.isArray(data) ? data : [];

    if (!leaves.length) {
      list.innerHTML = `<div style="text-align:center;padding:32px;color:var(--muted);">No pending leave requests.</div>`;
      return;
    }

    list.innerHTML = leaves
      .map((req) => {
        const initials = (req.user_name || "?")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        return `
        <div class="leave-request-card" id="leave-${req.id}">
          <div class="leave-avatar">${initials}</div>
          <div class="leave-info">
            <div class="leave-name">${escHtml(req.user_name || req.user_email || "—")}</div>
            <div class="leave-dates"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg> ${req.from_date} → ${req.to_date}</div>
            <div class="leave-reason">"${escHtml(req.reason)}"</div>
          </div>
          <div class="leave-actions">
            <button class="btn-approve" onclick="handleLeave('${req.id}', 'approved')">Approve</button>
            <button class="btn-reject"  onclick="handleLeave('${req.id}', 'rejected')">Reject</button>
          </div>
        </div>`;
      })
      .join("");
  } catch (err) {
    console.warn("Leave requests API error:", err.message);
    list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);">Unable to load leave requests. Is the backend running?</div>`;
  }
};

// ─── HANDLE LEAVE ─────────────────────────────────────────────────
window.handleLeave = async function (leaveId, action) {
  const card = document.getElementById(`leave-${leaveId}`);
  if (card) {
    card.style.opacity = "0.5";
    card.style.pointerEvents = "none";
  }

  try {
    await apiRequest("PATCH", `/leaves/${leaveId}`, { status: action });

    if (card) {
      const actions = card.querySelector(".leave-actions");
      if (actions) {
        actions.innerHTML = `
          <span class="sprint-status ${action === "approved" ? "status-complete" : "status-locked"}">
            ${action === "approved" ? "Approved" : "Rejected"}
          </span>`;
      }
    }

    showToast(
      `Leave ${action} successfully`,
      action === "approved" ? "success" : "warning",
    );

    // Refresh the pending counter in HR overview
    refreshHROverviewStats();
  } catch (err) {
    showToast(err.message || "Failed to update leave", "warning");
    if (card) {
      card.style.opacity = "1";
      card.style.pointerEvents = "";
    }
  }
};

// ─── USER REGISTRY (Identity Control) ─────────────────────────────
window.buildUserRegistry = async function () {
  const body = document.getElementById("userRegistryBody");
  if (!body) return;

  body.innerHTML =
    '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted);">Loading users…</td></tr>';

  try {
    const data = await apiRequest("GET", "/students?limit=200");
    const users = Array.isArray(data) ? data : [];

    if (!users.length) {
      body.innerHTML =
        '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted);">No users found.</td></tr>';
      return;
    }

    // Cache for upgradeUser()
    window._hrUserRegistry = users;

    const ROLE_LABEL = {
      student: "Student",
      intern: "Intern",
      staff: "Staff",
      admin: "Admin",
      client: "Deployed",
    };

    body.innerHTML = users
      .map(
        (u, i) => `
      <tr>
        <td>
          <span class="avatar">${getInitials(u.name || u.email)}</span>
          ${escHtml(u.name || u.email)}
        </td>
        <td>${escHtml(u.email)}</td>
        <td>
          <span class="sprint-status ${roleStatus(u.role)}">
            ${ROLE_LABEL[u.role] || u.role}
          </span>
        </td>
        <td>
          <span class="sprint-status ${u.id_type === "real" ? "status-active" : "status-pending"}">
            ${u.id_type === "real" ? "Real ID" : "Demo ID"}
          </span>
        </td>
        <td>${escHtml(u.track || "—")}</td>
        <td>${u.created_at ? new Date(u.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}</td>
        <td>
          ${
            u.id_type === "demo"
              ? `<button onclick="upgradeUser('${u.id}', ${i})" style="padding:6px 12px;border-radius:999px;border:1px solid var(--purple);background:transparent;cursor:pointer;color:var(--purple);font-size:12px;font-weight:600;">Upgrade</button>`
              : "—"
          }
        </td>
      </tr>`,
      )
      .join("");
  } catch (err) {
    console.warn("User registry API error:", err.message);
    body.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted);">Unable to load users. Backend offline?</td></tr>`;
  }
};

// ─── UPGRADE USER ─────────────────────────────────────────────────
window.upgradeUser = async function (userId, idx) {
  try {
    await apiRequest("POST", `/students/${userId}/convert`, {});
    showToast("User upgraded to Intern", "success");
    buildUserRegistry(); // Refresh table from DB
  } catch (err) {
    showToast(err.message || "Upgrade failed", "warning");
  }
};

// ─── HR OVERVIEW STATS ────────────────────────────────────────────
window.refreshHROverviewStats = async function () {
  try {
    // Pending leaves count
    const leaves = await apiRequest("GET", "/leaves?status=pending&limit=1");
    // We just want the count — fetch with higher limit
    const allPending = await apiRequest(
      "GET",
      "/leaves?status=pending&limit=200",
    );
    const pendingCount = Array.isArray(allPending) ? allPending.length : 0;

    const pendingEl = document.getElementById("hr-pending-leaves");
    if (pendingEl)
      pendingEl.textContent = `${pendingCount} Leave Request${pendingCount !== 1 ? "s" : ""} Pending`;
  } catch (_) {
    /* non-critical */
  }

  try {
    const stats = await apiRequest("GET", "/payroll/stats/summary");
    const stipendEl = document.getElementById("hr-stipend-amount");
    if (stipendEl && stats.current_month_net !== undefined) {
      const amt = Number(stats.current_month_net).toLocaleString("en-IN");
      stipendEl.textContent = `₹${amt} processing`;
    }
  } catch (_) {
    /* non-critical */
  }
};

// ─── ANALYTICS VIEW ───────────────────────────────────────────────
window.injectAnalyticsView = function () {
  if (document.getElementById("view-analytics")) return;

  const view = document.createElement("div");
  view.className = "page-view";
  view.id = "view-analytics";
  view.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Analytics</div>
        <div class="page-desc">Live KPI overview</div>
      </div>
      <button class="btn-primary" onclick="refreshAnalytics()">↻ Refresh</button>
    </div>
    <div class="stats-grid">
      <div class="stat-card purple-card">
        <div class="stat-label">Students</div>
        <div class="stat-value" id="analytics-students">—</div>
      </div>
      <div class="stat-card dark-card">
        <div class="stat-label">Interns</div>
        <div class="stat-value" id="analytics-interns">—</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Deployments</div>
        <div class="stat-value" id="analytics-deployments">—</div>
      </div>
    </div>`;

  document.getElementById("mainContent")?.appendChild(view);
};

window.refreshAnalytics = async function () {
  try {
    const data = await apiRequest("GET", "/analytics/overview");
    setEl("analytics-students", data.students || 0);
    setEl("analytics-interns", data.interns || 0);
    setEl("analytics-deployments", data.active_deployments || 0);
    showToast("Analytics refreshed", "success");
  } catch (err) {
    showToast("Analytics server offline", "warning");
  }
};

// ─── HR OVERVIEW GRID ─────────────────────────────────────────────
window.buildHROverviewGrid = function (grid) {
  grid.innerHTML = `
    <div class="card">
      <div class="card-header"><div class="card-title">Pending Actions</div></div>
      <div class="card-body">
        <div class="sprint-item">
          <div class="sprint-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></div>
          <div class="sprint-info">
            <div class="sprint-title" id="hr-pending-leaves">Leave Requests Pending</div>
            <div class="sprint-meta">Awaiting review</div>
          </div>
        </div>
        <div class="sprint-item">
          <div class="sprint-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg></div>
          <div class="sprint-info">
            <div class="sprint-title">Payroll Cycle Active</div>
            <div class="sprint-meta" id="hr-stipend-amount">Loading…</div>
          </div>
        </div>
      </div>
    </div>`;

  // Populate with real data
  refreshHROverviewStats();
};

// ─── HELPERS ──────────────────────────────────────────────────────
function setEl(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function getInitials(name) {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function escHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function roleStatus(role) {
  return (
    {
      intern: "status-active",
      admin: "status-complete",
      staff: "status-complete",
      client: "status-active",
      student: "status-pending",
    }[role] || "status-pending"
  );
}

// ─── DEMO ID GENERATION ───────────────────────────────────────────
// Called from Identity Control table for student rows
window.generateDemoId = async function (userId, idx) {
  const btn = document.getElementById(`demoid-btn-${userId}`);
  const cell = document.getElementById(`demoid-cell-${userId}`);
  if (btn) {
    btn.textContent = "Generating…";
    btn.disabled = true;
  }

  try {
    const result = await apiRequest(
      "POST",
      `/students/${userId}/generate-demo-id`,
      {},
    );

    showToast(`Demo ID: ${result.demo_id}`, "success");

    // Update the cell in-place
    if (cell) {
      cell.innerHTML = `
        <span style="font-family:monospace;font-size:12px;font-weight:700;color:var(--purple);">
          ${result.demo_id}
        </span>
        <button onclick="copyDemoId('${result.demo_id}')"
          style="margin-left:8px;padding:2px 8px;border-radius:4px;border:1px solid rgba(168,85,247,0.3);
                 background:transparent;cursor:pointer;color:var(--purple);font-size:10px;">
          Copy
        </button>`;
    }
    if (btn) btn.style.display = "none";
  } catch (err) {
    showToast(err.message || "Demo ID generation failed", "warning");
    if (btn) {
      btn.textContent = "Generate ID";
      btn.disabled = false;
    }
  }
};

window.copyDemoId = function (id) {
  navigator.clipboard
    ?.writeText(id)
    .then(() => showToast("Copied", "success"));
};

// ─── UPGRADED USER REGISTRY (with Demo ID column) ─────────────────
window.buildUserRegistry = async function () {
  const body = document.getElementById("userRegistryBody");
  if (!body) return;

  body.innerHTML =
    '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted);">Loading users…</td></tr>';

  try {
    const data = await apiRequest("GET", "/students?limit=200");
    const users = Array.isArray(data) ? data : [];

    if (!users.length) {
      body.innerHTML =
        '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted);">No users found.</td></tr>';
      return;
    }

    window._hrUserRegistry = users;

    const ROLE_LABEL = {
      student: "Student",
      intern: "Intern",
      staff: "Staff",
      admin: "Admin",
      client: "Deployed",
    };

    body.innerHTML = users
      .map((u) => {
        const isStudent = u.role === "student";
        const hasDemoId =
          u.demo_id && u.demo_id !== "null" && u.demo_id !== null;

        return `
        <tr>
          <td>
            <span class="avatar">${getInitials(u.name || u.email)}</span>
            ${escHtml(u.name || u.email)}
          </td>
          <td>${escHtml(u.email)}</td>
          <td>
            <span class="sprint-status ${roleStatus(u.role)}">
              ${ROLE_LABEL[u.role] || u.role}
            </span>
          </td>
          <td>
            <span class="sprint-status ${u.id_type === "real" ? "status-active" : "status-pending"}">
              ${u.id_type === "real" ? "Real ID" : "Demo ID"}
            </span>
          </td>
          <td id="demoid-cell-${u.id}">
            ${
              isStudent
                ? hasDemoId
                  ? `<span style="font-family:monospace;font-size:12px;font-weight:700;color:var(--purple);">${escHtml(u.demo_id)}</span>
                     <button onclick="copyDemoId('${escHtml(u.demo_id)}')"
                       style="margin-left:8px;padding:2px 8px;border-radius:4px;border:1px solid rgba(168,85,247,0.3);
                              background:transparent;cursor:pointer;color:var(--purple);font-size:10px;">Copy</button>`
                  : `<span style="color:var(--muted);font-size:12px;">Not generated</span>`
                : '<span style="color:var(--muted);font-size:12px;">N/A</span>'
            }
          </td>
          <td>${escHtml(u.track || "—")}</td>
          <td>${u.created_at ? new Date(u.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}</td>
          <td style="display:flex;gap:6px;flex-wrap:wrap;">
            ${
              isStudent
                ? `<button id="demoid-btn-${u.id}" onclick="generateDemoId('${u.id}')"
                   style="padding:5px 10px;border-radius:999px;border:1px solid rgba(168,85,247,0.4);
                          background:transparent;cursor:pointer;color:var(--purple);font-size:11px;font-weight:600;">
                   ${hasDemoId ? "↻ Regen ID" : "+ Generate ID"}
                 </button>
                 <button onclick="upgradeUser('${u.id}')"
                   style="padding:5px 10px;border-radius:999px;border:1px solid var(--purple);
                          background:transparent;cursor:pointer;color:var(--purple);font-size:11px;font-weight:600;">
                   Upgrade
                 </button>`
                : "—"
            }
          </td>
        </tr>`;
      })
      .join("");
  } catch (err) {
    console.warn("User registry API error:", err.message);
    body.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted);">Unable to load users. Backend offline?</td></tr>`;
  }
};
// ═══════════════════════════════════════════════════════════════════
// ADD USER MODAL
// ═══════════════════════════════════════════════════════════════════

window.openAddUserModal = function () {
  const modal = document.getElementById("addUserModal");
  if (modal) modal.classList.add("open");
};

window.closeAddUserModal = function () {
  const modal = document.getElementById("addUserModal");
  if (modal) modal.classList.remove("open");

  const err = document.getElementById("auError");
  if (err) {
    err.style.display = "none";
    err.innerText = "";
  }
};

window.submitAddUser = async function () {
  const name = document.getElementById("auName")?.value.trim();
  const email = document.getElementById("auEmail")?.value.trim();
  const password = document.getElementById("auPwd")?.value.trim();
  const role = document.getElementById("auRole")?.value;
  const track = document.getElementById("auTrack")?.value;
  const college = document.getElementById("auCollege")?.value.trim();

  const errBox = document.getElementById("auError");
  const submitBtn = document.getElementById("auSubmitBtn");

  if (errBox) {
    errBox.style.display = "none";
    errBox.innerText = "";
  }

  if (!name || !email || !password) {
    if (errBox) {
      errBox.innerText = "Please fill all required fields";
      errBox.style.display = "block";
    }
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.innerText = "Creating...";

    const result = await apiRequest("POST", "/auth/register", {
      name,
      email,
      password,
      role,
      track,
      college,
    });

    showToast("User created successfully", "success");

    closeAddUserModal();

    // Refresh registry table
    buildUserRegistry();
  } catch (err) {
    console.error("Add user error:", err);

    if (errBox) {
      errBox.innerText = err.message || "Failed to create user";
      errBox.style.display = "block";
    }

    showToast(err.message || "Failed to create user", "warning");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Create User";
  }
};
