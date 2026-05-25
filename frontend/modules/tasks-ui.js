// ═══════════════════════════════════════════════════════════════════
// modules/tasks-ui.js  —  Overview grid + task rendering only
//
// IMPORTANT: This file must NOT redefine window.antboxState,
// window.navConfig, window.buildSidebar, window.navigateTo, or
// window.launchApp — those all live in scripts/app.js and are
// loaded first. Redefining them here (tasks-ui loads last) would
// silently overwrite the correct payroll nav IDs and break routing.
// ═══════════════════════════════════════════════════════════════════

// ─── OVERVIEW ─────────────────────────────────────────────────────
window.buildOverview = function () {
  const role = window.antboxState.role;
  const title = document.getElementById("overviewTitle");
  const desc = document.getElementById("overviewDesc");

  if (title) title.textContent = `${role} Dashboard`;
  if (desc) desc.textContent = "Operational overview";

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
        </div>`;
    } else if (role === "Intern") {
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
        </div>`;
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
        </div>`;
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
        </div>`;
    }

    stats.innerHTML = statsHTML;
  }

  const grid = document.getElementById("overviewGrid");
  if (!grid) return;
  grid.innerHTML = "";

  if (role === "Student" && window.buildStudentOverviewGrid) {
    buildStudentOverviewGrid(grid);
  } else if (role === "Intern" && window.buildInternOverviewGrid) {
    buildInternOverviewGrid(grid);
  } else if (role === "Staff") {
    grid.innerHTML = `
      <div class="card">
        <div class="card-header"><div class="card-title">Staff Operations</div></div>
        <div class="card-body"><p>Monitor client pipelines, deployments and staffing.</p></div>
      </div>`;
  } else if (role === "HR" && window.buildHROverviewGrid) {
    buildHROverviewGrid(grid);
  }
};

// ─── AUTO RESTORE SESSION ────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (window.restoreSession) restoreSession();
});
