// ═══════════════════════════════════════════════════════════════════
// modules/leave-ui.js  —  Leave application form for students/interns
// Wires to POST /api/leaves and GET /api/leaves (own records)
// ═══════════════════════════════════════════════════════════════════

// ─── INJECT LEAVE VIEW ───────────────────────────────────────────
// Called by launchApp if the role has a "leave" nav item.
// The HTML already has a #view-leave placeholder; this populates it.
window.buildLeaveView = async function () {
  const container = document.getElementById("view-leave");
  if (!container) return;

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Leave Request</div>
        <div class="page-desc">Apply for leave and view your history</div>
      </div>
    </div>

    <!-- Application form -->
    <div class="card" style="margin-bottom:24px;">
      <div class="card-header"><div class="card-title">Apply for Leave</div></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:16px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div>
            <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:6px;">From Date</label>
            <input type="date" id="leaveFromDate" style="width:100%;padding:10px 14px;background:var(--surface);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:var(--text);font-size:14px;">
          </div>
          <div>
            <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:6px;">To Date</label>
            <input type="date" id="leaveToDate" style="width:100%;padding:10px 14px;background:var(--surface);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:var(--text);font-size:14px;">
          </div>
        </div>
        <div>
          <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:6px;">Reason</label>
          <textarea id="leaveReason" rows="3" placeholder="Brief reason for leave…" style="width:100%;padding:10px 14px;background:var(--surface);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:var(--text);font-size:14px;resize:vertical;"></textarea>
        </div>
        <button class="btn-primary" onclick="submitLeaveRequest()" style="width:fit-content;">
          Submit Request
        </button>
      </div>
    </div>

    <!-- History -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">My Leave History</div>
        <button onclick="loadLeaveHistory()" style="background:transparent;border:1px solid rgba(255,255,255,0.1);padding:6px 12px;border-radius:6px;color:var(--muted);cursor:pointer;font-size:12px;">↻ Refresh</button>
      </div>
      <div class="card-body">
        <div id="leaveHistoryList" style="display:flex;flex-direction:column;gap:12px;">
          <div style="text-align:center;padding:24px;color:var(--muted);">Loading…</div>
        </div>
      </div>
    </div>`;

  loadLeaveHistory();
};

// ─── SUBMIT LEAVE ─────────────────────────────────────────────────
window.submitLeaveRequest = async function () {
  const from_date = document.getElementById("leaveFromDate")?.value;
  const to_date = document.getElementById("leaveToDate")?.value;
  const reason = document.getElementById("leaveReason")?.value?.trim();

  if (!from_date || !to_date || !reason) {
    showToast("Please fill in all fields", "warning");
    return;
  }
  if (from_date > to_date) {
    showToast("From date must be before To date", "warning");
    return;
  }

  try {
    await apiRequest("POST", "/leaves", { from_date, to_date, reason });
    showToast("Leave request submitted", "success");

    // Clear form
    document.getElementById("leaveFromDate").value = "";
    document.getElementById("leaveToDate").value = "";
    document.getElementById("leaveReason").value = "";

    // Push local notification
    if (window.pushNotification) {
      pushNotification(
        "Leave Submitted",
        `Your leave from ${from_date} to ${to_date} is pending review.`,
        "info",
      );
    }

    loadLeaveHistory();
  } catch (err) {
    showToast(err.message || "Failed to submit leave", "warning");
  }
};

// ─── LOAD LEAVE HISTORY ───────────────────────────────────────────
window.loadLeaveHistory = async function () {
  const list = document.getElementById("leaveHistoryList");
  if (!list) return;

  list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);">\u2026Loading\u2026</div>`;

  const bRole = (window.antboxState?.backendRole || "").toLowerCase();
  const isAdmin = bRole === "admin";
  const currentUserId = window.antboxState?.userId || "";

  try {
    const data = await apiRequest("GET", "/leaves?limit=50");
    // Client-side guard: backend now enforces own-only for non-admin,
    // but we filter here too as a defence-in-depth measure.
    const allLeaves = Array.isArray(data) ? data : [];
    const leaves = isAdmin
      ? allLeaves
      : allLeaves.filter((l) => l.user_id === currentUserId);

    if (!leaves.length) {
      list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);">No leave history yet.</div>`;
      return;
    }

    const statusIcon = {
      pending: "\u23f3",
      approved: "\u2713",
      rejected: "\u2715",
    };
    const statusClass = {
      pending: "status-pending",
      approved: "status-complete",
      rejected: "status-locked",
    };

    list.innerHTML = leaves
      .map(
        (l) => `
      <div style="display:flex;align-items:center;gap:16px;padding:14px;background:var(--surface);border-radius:10px;border:1px solid rgba(255,255,255,0.05);">
        <div style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;background:rgba(255,255,255,0.05);">
          ${statusIcon[l.status] || "?"}
        </div>
        <div style="flex:1;">
          <div style="font-weight:600;font-size:14px;margin-bottom:2px;">
            ${l.from_date} \u2192 ${l.to_date}
          </div>
          <div style="font-size:12px;color:var(--muted);">${escLeave(l.reason)}</div>
        </div>
        <span class="sprint-status ${statusClass[l.status] || "status-pending"}">
          ${capitalize(l.status)}
        </span>
      </div>`,
      )
      .join("");
  } catch (err) {
    list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);">Unable to load history. Backend offline?</div>`;
  }
};

// ─── HOOK INTO navigateTo ─────────────────────────────────────────
const _origNavigateTo_leave = window.navigateTo;
window.navigateTo = function (viewId) {
  if (_origNavigateTo_leave) _origNavigateTo_leave(viewId);
  if (viewId === "leave") setTimeout(buildLeaveView, 50);
};

// ─── HELPERS ─────────────────────────────────────────────────────
function escLeave(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : "";
}
