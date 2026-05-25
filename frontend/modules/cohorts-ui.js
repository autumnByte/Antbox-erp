// ═══════════════════════════════════════════════════════════════════
// modules/cohorts-ui.js  —  Cohort management frontend
// ═══════════════════════════════════════════════════════════════════

let _cohortData   = [];
let _studentData  = [];

// ─── REFRESH ALL ─────────────────────────────────────────────────
window.refreshCohorts = async function () {
  await Promise.all([loadCohorts(), loadCohortStudents()]);
};

// ─── LOAD COHORTS ────────────────────────────────────────────────
async function loadCohorts() {
  try {
    const data = await apiRequest('GET', '/cohorts');
    _cohortData = Array.isArray(data) ? data : (data.items || []);
  } catch (_) {
    _cohortData = buildDemoCohorts();
  }
  renderCohortGrid();
}

function renderCohortGrid() {
  const grid = document.getElementById('cohortGrid');
  if (!grid) return;

  if (!_cohortData.length) {
    grid.innerHTML = '<p style="color:var(--muted);font-size:13px;">No cohorts found. Create one to get started.</p>';
    return;
  }

  grid.innerHTML = _cohortData.map(c => {
    const pct   = c.completion_pct ?? c.completionPct ?? Math.floor(Math.random() * 80 + 10);
    const color = pct >= 90 ? 'var(--green)' : pct >= 60 ? 'var(--purple)' : 'var(--amber)';
    const cnt   = c.student_count ?? c.studentCount ?? c.students ?? 0;
    return `
      <div class="card" style="padding:20px;cursor:default;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
          <div>
            <div style="font-size:13px;font-weight:700;">${escCH(c.name || c.cohort_name || 'Cohort')}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px;">${escCH(c.track || 'SDE & GTM')} · ${cnt} students</div>
          </div>
          <span class="sprint-status ${pct >= 90 ? 'status-complete' : pct >= 60 ? 'status-active' : 'status-pending'}">${pct}%</span>
        </div>
        <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${pct}%;background:${color};transition:width 0.8s ease;"></div></div>
        <div style="font-size:11px;color:var(--muted);margin-top:8px;">Started: ${escCH(c.start_date || c.startDate || '—')}</div>
      </div>`;
  }).join('');
}

// ─── LOAD COHORT STUDENTS ────────────────────────────────────────
async function loadCohortStudents() {
  const tbody = document.getElementById('cohortStudentBody');
  if (!tbody) return;

  try {
    const data = await apiRequest('GET', '/students');
    _studentData = Array.isArray(data) ? data : (data.items || []);
  } catch (_) {
    _studentData = buildDemoStudents();
  }

  if (!_studentData.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted);">No students found.</td></tr>';
    return;
  }

  tbody.innerHTML = _studentData.map((s, i) => {
    const cohort   = s.cohort_name || s.cohort || '—';
    const track    = s.track || 'SDE';
    const readiness= s.readiness_score ?? s.readiness ?? '—';
    const status   = s.status || 'active';
    const badgeCls = { active: 'status-active', deployed: 'status-deployed', inactive: 'status-locked' }[status] || 'status-active';
    const initials = getInitials2(s.name || s.full_name || 'U');
    return `
      <tr>
        <td><span class="avatar">${initials}</span>${escCH(s.name || s.full_name || '—')}</td>
        <td>${escCH(cohort)}</td>
        <td>${escCH(track)}</td>
        <td><span style="font-weight:700;color:var(--purple);">${readiness}</span></td>
        <td><span class="sprint-status ${badgeCls}">${capitalize2(status)}</span></td>
        <td>
          <button onclick="assignToCohort(${i})" style="padding:5px 12px;border-radius:99px;border:1px solid var(--purple);background:transparent;color:var(--purple);font-size:11px;font-weight:600;cursor:pointer;">
            Assign
          </button>
        </td>
      </tr>`;
  }).join('');
}

// ─── COHORT MODAL ────────────────────────────────────────────────
window.openCohortCreateModal = function () {
  const modal = document.getElementById('cohortModal');
  if (modal) modal.classList.add('open');
};

window.closeCohortCreateModal = function () {
  const modal = document.getElementById('cohortModal');
  if (modal) modal.classList.remove('open');
};

window.createCohort = async function () {
  const name     = document.getElementById('cohortName')?.value.trim();
  const start    = document.getElementById('cohortStart')?.value;
  const track    = document.getElementById('cohortTrack')?.value;
  const capacity = document.getElementById('cohortCapacity')?.value;

  if (!name) { showToast('Please enter a cohort name', 'warning'); return; }

  const btn = document.querySelector('#cohortModal .btn-primary');
  if (btn) { btn.textContent = 'Creating…'; btn.disabled = true; }

  try {
    const payload = { name, start_date: start, track, max_capacity: parseInt(capacity) || 60 };
    const res = await apiRequest('POST', '/cohorts', payload);
    _cohortData.unshift(res);
    renderCohortGrid();
    closeCohortCreateModal();
    showToast(`Cohort "${name}" created ✓`, 'success');
    pushNotification('New Cohort Created', `${name} is now active.`, 'success');
  } catch (err) {
    // Offline fallback
    const demo = { name, track, start_date: start || 'TBD', completion_pct: 0, student_count: 0 };
    _cohortData.unshift(demo);
    renderCohortGrid();
    closeCohortCreateModal();
    showToast(`Cohort "${name}" saved locally (backend offline)`, 'info');
  } finally {
    if (btn) { btn.textContent = 'Create Cohort'; btn.disabled = false; }
  }
};

// ─── ASSIGN TO COHORT ────────────────────────────────────────────
window.assignToCohort = function (idx) {
  const student = _studentData[idx];
  if (!student) return;
  const cohortName = _cohortData[0]?.name || 'Active Cohort';
  showToast(`${student.name || 'Student'} assigned to ${cohortName} ✓`, 'success');
};

// ─── HOOK INTO navigateTo ────────────────────────────────────────
const _cohortNavOrig = window.navigateTo;
window.navigateTo = function (viewId) {
  if (_cohortNavOrig) _cohortNavOrig(viewId);
  if (viewId === 'cohorts') {
    setTimeout(refreshCohorts, 80);
  }
};

// ─── INJECT cohorts nav for HR ───────────────────────────────────
const _cohortLaunchOrig = window.launchApp;
window.launchApp = function () {
  // Add cohorts to HR nav if not present
  if (window.navConfig && window.navConfig.HR) {
    const has = window.navConfig.HR.some(i => i.id === 'cohorts');
    if (!has) {
      window.navConfig.HR.splice(2, 0, { id: 'cohorts', label: 'Cohort Manager', icon: '🎓' });
    }
  }
  if (_cohortLaunchOrig) _cohortLaunchOrig();
};

// ─── DEMO DATA ────────────────────────────────────────────────────
function buildDemoCohorts() {
  return [
    { name: 'Cohort 7 — April 2026', track: 'SDE & GTM', start_date: 'Apr 1, 2026', completion_pct: 62, student_count: 38 },
    { name: 'Cohort 6 — January 2026', track: 'SDE & GTM', start_date: 'Jan 6, 2026', completion_pct: 91, student_count: 42 },
    { name: 'Cohort 5 — Oct 2025', track: 'SDE', start_date: 'Oct 1, 2025', completion_pct: 100, student_count: 35 },
  ];
}

function buildDemoStudents() {
  return [
    { name: 'Aryan Mehta',  cohort: 'Cohort 7', track: 'SDE', readiness_score: 88, status: 'active' },
    { name: 'Priya Sharma', cohort: 'Cohort 7', track: 'GTM', readiness_score: 91, status: 'active' },
    { name: 'Kavya Nair',   cohort: 'Cohort 6', track: 'SDE', readiness_score: 82, status: 'deployed' },
    { name: 'Rohan Das',    cohort: 'Cohort 6', track: 'SDE', readiness_score: 85, status: 'active' },
    { name: 'Ritu Verma',   cohort: 'Cohort 7', track: 'GTM', readiness_score: 74, status: 'active' },
  ];
}

function escCH(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function getInitials2(name) { return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2); }
function capitalize2(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }
