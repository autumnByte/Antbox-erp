// ═══════════════════════════════════════════════════════════════════
// modules/payroll-ui.js  —  Role-Separated Payroll Architecture
// Roles: intern | staff | admin  (backend canonical)
// UI:    Intern | Staff  | HR    (display labels)
// ═══════════════════════════════════════════════════════════════════

// ─── UTILS ──────────────────────────────────────────────────────────
function _fmt(n) {
  if (typeof n !== "number") n = parseFloat(n) || 0;
  return "₹" + n.toLocaleString("en-IN");
}
function _badge(s) {
  return (
    {
      paid: "status-complete",
      processed: "status-complete",
      pending: "status-pending",
      failed: "status-locked",
    }[s] || "status-pending"
  );
}
function _mon(m) {
  return (
    [
      "",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ][m] || m
  );
}
function _cap(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : "";
}
function _periodLabel(r) {
  const m = r.payroll_month || r.month;
  const y = r.payroll_year || r.year;
  return m && y ? `${_mon(m)} ${y}` : "—";
}
function _net(r) {
  return Number(r.net_salary || r.net_pay || r.stipend || 0);
}
function _base(r) {
  return Number(r.base_salary || r.base || r.stipend || 0);
}
function _role() {
  return (window.antboxState?.backendRole || "").toLowerCase();
}
function _email() {
  return (
    window.antboxState?.email ||
    localStorage.getItem("antbox_user_email") ||
    localStorage.getItem("antbox_user") ||
    ""
  ).toLowerCase();
}

// ─── DEMO DATA SETS ─────────────────────────────────────────────────

const DEMO_INTERN_PAYROLL = [
  {
    payroll_month: 5,
    payroll_year: 2025,
    employee_name: "Aryan Mehta",
    employee_email: "aryan@intern.antbox.io",
    employee_role: "intern",
    base_salary: 22000,
    bonus: 3000,
    deductions: 1500,
    net_pay: 23500,
    status: "processed",
  },
  {
    payroll_month: 4,
    payroll_year: 2025,
    employee_name: "Aryan Mehta",
    employee_email: "aryan@intern.antbox.io",
    employee_role: "intern",
    base_salary: 22000,
    bonus: 1500,
    deductions: 1500,
    net_pay: 22000,
    status: "paid",
  },
  {
    payroll_month: 3,
    payroll_year: 2025,
    employee_name: "Aryan Mehta",
    employee_email: "aryan@intern.antbox.io",
    employee_role: "intern",
    base_salary: 22000,
    bonus: 2000,
    deductions: 1500,
    net_pay: 22500,
    status: "paid",
  },
  {
    payroll_month: 5,
    payroll_year: 2025,
    employee_name: "Priya Sharma",
    employee_email: "priya@intern.antbox.io",
    employee_role: "intern",
    base_salary: 20000,
    bonus: 2000,
    deductions: 1200,
    net_pay: 20800,
    status: "pending",
  },
  {
    payroll_month: 4,
    payroll_year: 2025,
    employee_name: "Priya Sharma",
    employee_email: "priya@intern.antbox.io",
    employee_role: "intern",
    base_salary: 20000,
    bonus: 1500,
    deductions: 1200,
    net_pay: 20300,
    status: "paid",
  },
  {
    payroll_month: 3,
    payroll_year: 2025,
    employee_name: "Priya Sharma",
    employee_email: "priya@intern.antbox.io",
    employee_role: "intern",
    base_salary: 20000,
    bonus: 1000,
    deductions: 1200,
    net_pay: 19800,
    status: "paid",
  },
  {
    payroll_month: 5,
    payroll_year: 2025,
    employee_name: "Rohan Das",
    employee_email: "rohan@intern.antbox.io",
    employee_role: "intern",
    base_salary: 22000,
    bonus: 1000,
    deductions: 1500,
    net_pay: 21500,
    status: "processed",
  },
  {
    payroll_month: 4,
    payroll_year: 2025,
    employee_name: "Rohan Das",
    employee_email: "rohan@intern.antbox.io",
    employee_role: "intern",
    base_salary: 22000,
    bonus: 1000,
    deductions: 1500,
    net_pay: 21500,
    status: "paid",
  },
  {
    payroll_month: 5,
    payroll_year: 2025,
    employee_name: "Kavya Nair",
    employee_email: "kavya@intern.antbox.io",
    employee_role: "intern",
    base_salary: 25000,
    bonus: 0,
    deductions: 0,
    net_pay: 25000,
    status: "processed",
  },
  {
    payroll_month: 5,
    payroll_year: 2025,
    employee_name: "Dev Patel",
    employee_email: "dev@intern.antbox.io",
    employee_role: "intern",
    base_salary: 22000,
    bonus: 0,
    deductions: 2000,
    net_pay: 20000,
    status: "pending",
  },
];

const DEMO_STAFF_PAYROLL = [
  {
    payroll_month: 5,
    payroll_year: 2025,
    employee_name: "Ritika Anand",
    employee_email: "sales@antbox.io",
    employee_role: "staff",
    base_salary: 55000,
    bonus: 5000,
    deductions: 4000,
    net_pay: 56000,
    status: "processed",
  },
  {
    payroll_month: 4,
    payroll_year: 2025,
    employee_name: "Ritika Anand",
    employee_email: "sales@antbox.io",
    employee_role: "staff",
    base_salary: 55000,
    bonus: 5000,
    deductions: 4000,
    net_pay: 56000,
    status: "paid",
  },
  {
    payroll_month: 3,
    payroll_year: 2025,
    employee_name: "Ritika Anand",
    employee_email: "sales@antbox.io",
    employee_role: "staff",
    base_salary: 55000,
    bonus: 3000,
    deductions: 4000,
    net_pay: 54000,
    status: "paid",
  },
  {
    payroll_month: 5,
    payroll_year: 2025,
    employee_name: "Mohit Srivastav",
    employee_email: "ops@antbox.io",
    employee_role: "staff",
    base_salary: 60000,
    bonus: 6000,
    deductions: 4500,
    net_pay: 61500,
    status: "processed",
  },
  {
    payroll_month: 4,
    payroll_year: 2025,
    employee_name: "Mohit Srivastav",
    employee_email: "ops@antbox.io",
    employee_role: "staff",
    base_salary: 60000,
    bonus: 6000,
    deductions: 4500,
    net_pay: 61500,
    status: "paid",
  },
  {
    payroll_month: 3,
    payroll_year: 2025,
    employee_name: "Mohit Srivastav",
    employee_email: "ops@antbox.io",
    employee_role: "staff",
    base_salary: 60000,
    bonus: 4000,
    deductions: 4500,
    net_pay: 59500,
    status: "paid",
  },
  {
    payroll_month: 5,
    payroll_year: 2025,
    employee_name: "Sneha Kulkarni",
    employee_email: "bd@antbox.io",
    employee_role: "staff",
    base_salary: 52000,
    bonus: 4500,
    deductions: 3800,
    net_pay: 52700,
    status: "pending",
  },
  {
    payroll_month: 4,
    payroll_year: 2025,
    employee_name: "Sneha Kulkarni",
    employee_email: "bd@antbox.io",
    employee_role: "staff",
    base_salary: 52000,
    bonus: 4000,
    deductions: 3800,
    net_pay: 52200,
    status: "paid",
  },
];

const DEMO_HR_LEDGER = [
  ...DEMO_INTERN_PAYROLL,
  ...DEMO_STAFF_PAYROLL,
  {
    payroll_month: 5,
    payroll_year: 2025,
    employee_name: "Akash Gupta",
    employee_email: "ceo@antbox.io",
    employee_role: "admin",
    base_salary: 120000,
    bonus: 15000,
    deductions: 12000,
    net_pay: 123000,
    status: "processed",
  },
  {
    payroll_month: 4,
    payroll_year: 2025,
    employee_name: "Akash Gupta",
    employee_email: "ceo@antbox.io",
    employee_role: "admin",
    base_salary: 120000,
    bonus: 10000,
    deductions: 12000,
    net_pay: 118000,
    status: "paid",
  },
];

// ─── STATE ──────────────────────────────────────────────────────────
let _payData = [];

// ─── ROLE-AWARE DEMO SELECTOR ────────────────────────────────────────
function _getDemoData(backendRole) {
  const email = _email();
  if (backendRole === "intern" || backendRole === "client") {
    // Show only THIS intern's records. Fallback: first 3 rows
    const mine = DEMO_INTERN_PAYROLL.filter((r) => r.employee_email === email);
    return mine.length ? mine : DEMO_INTERN_PAYROLL.slice(0, 3);
  }
  if (backendRole === "staff") {
    const mine = DEMO_STAFF_PAYROLL.filter((r) => r.employee_email === email);
    return mine.length ? mine : DEMO_STAFF_PAYROLL.slice(0, 3);
  }
  return DEMO_HR_LEDGER; // admin sees everything
}

// ─── SKELETON ───────────────────────────────────────────────────────
function _skeleton(cols) {
  return Array.from(
    { length: 3 },
    () =>
      `<tr>${Array.from(
        { length: cols },
        () =>
          `<td><div style="height:14px;background:var(--border);border-radius:4px;animation:pulse 1.5s infinite;"></div></td>`,
      ).join("")}</tr>`,
  ).join("");
}

// ═══════════════════════════════════════════════════════════════════
// INTERN PAYROLL — personal stipend view only
// ═══════════════════════════════════════════════════════════════════
window.renderInternPayroll = function () {
  const container = document.getElementById("view-stipend");
  if (!container) return;

  try {
    container.innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">My Stipend</div>
          <div class="page-desc">Your personal stipend history, deductions and payment status.</div>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn-ghost" onclick="window._internExportCSV()">Export CSV</button>
          <button class="btn-primary" onclick="window._internDownloadPayslip()">⬇ Download Payslip</button>
        </div>
      </div>

      <div class="stats-grid cols-4" id="internStipendStats">
        <div class="stat-card purple-card">
          <div class="stat-label">Current Stipend</div>
          <div class="stat-value" id="ist-current">—</div>
          <div class="stat-delta" id="ist-month">Loading…</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Base Amount</div>
          <div class="stat-value" id="ist-base">—</div>
          <div class="stat-delta">This cycle</div>
        </div>
        <div class="stat-card dark-card">
          <div class="stat-label">Deductions</div>
          <div class="stat-value" id="ist-deductions" style="color:var(--red);">—</div>
          <div class="stat-delta down">Absences / policy</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Payment Status</div>
          <div class="stat-value" id="ist-status" style="font-size:18px;">—</div>
          <div class="stat-delta" id="ist-paid-at">—</div>
        </div>
      </div>

      <div class="card" style="margin-top:4px;">
        <div class="card-header">
          <div class="card-title">Stipend History</div>
          <span id="internPayrollMsg" style="font-size:12px;color:var(--muted);"></span>
        </div>
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Base Stipend</th>
                <th>Bonus</th>
                <th>Deductions</th>
                <th>Net Received</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="internStipendBody">
              ${_skeleton(6)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    _loadInternData();
  } catch (e) {
    console.error("renderInternPayroll error:", e);
    _showPayrollError(container, "stipend");
  }
};

async function _loadInternData() {
  let records = [];
  try {
    const data = await apiRequest("GET", "/payroll/my");
    records = Array.isArray(data) ? data : data.items || [];
  } catch (_) {}

  if (!records.length) {
    records = _getDemoData("intern");
    const msg = document.getElementById("internPayrollMsg");
    if (msg) msg.textContent = `${records.length} demo records`;
  } else {
    const msg = document.getElementById("internPayrollMsg");
    if (msg)
      msg.textContent = `${records.length} record${records.length !== 1 ? "s" : ""}`;
  }

  _payData = records;
  _renderInternTable(records);
  _renderInternStats(records);
}

function _renderInternStats(records) {
  if (!records.length) return;
  const latest = records[0];
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };
  set("ist-current", _fmt(_net(latest)));
  set("ist-base", _fmt(_base(latest)));
  set(
    "ist-deductions",
    `−${_fmt(Number(latest.deductions || latest.deduction || 0))}`,
  );
  set("ist-month", _periodLabel(latest));
  const st = latest.status || "pending";
  set(
    "ist-status",
    st === "paid"
      ? "Paid"
      : st === "processed"
        ? "Processing"
        : "⏳ Pending",
  );
  set("ist-paid-at", latest.paid_at ? `Paid on ${latest.paid_at}` : "—");
}

function _renderInternTable(records) {
  const tbody = document.getElementById("internStipendBody");
  if (!tbody) return;

  if (!records.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--muted);">
      <div class="card-icon-lg"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg></div>
      No stipend records found yet.
    </td></tr>`;
    return;
  }

  tbody.innerHTML = records
    .map(
      (r) => `
    <tr>
      <td><strong>${_periodLabel(r)}</strong></td>
      <td>${_fmt(_base(r))}</td>
      <td style="color:var(--green);">+${_fmt(Number(r.bonus || 0))}</td>
      <td style="color:var(--red);">−${_fmt(Number(r.deductions || r.deduction || 0))}</td>
      <td style="font-weight:700;">${_fmt(_net(r))}</td>
      <td><span class="sprint-status ${_badge(r.status || "pending")}">${_cap(r.status || "pending")}</span></td>
    </tr>
  `,
    )
    .join("");
}

window._internExportCSV = function () {
  if (!_payData.length) {
    showToast("No stipend data to export", "warning");
    return;
  }
  const headers = [
    "Period",
    "Base Stipend",
    "Bonus",
    "Deductions",
    "Net Received",
    "Status",
  ];
  const rows = _payData.map((r) => [
    _periodLabel(r),
    _base(r),
    r.bonus || 0,
    r.deductions || 0,
    _net(r),
    r.status || "",
  ]);
  _downloadCSV("antbox-stipend", headers, rows);
  showToast("Stipend CSV exported", "success");
};

window._internDownloadPayslip = function () {
  showToast("Generating payslip PDF… (demo)", "info");
  setTimeout(() => showToast("Payslip ready for download", "success"), 1800);
};

// ═══════════════════════════════════════════════════════════════════
// STAFF SALARY — personal salary view only
// ═══════════════════════════════════════════════════════════════════
window.renderStaffSalary = function () {
  const container = document.getElementById("view-salary");
  if (!container) return;

  try {
    container.innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">My Salary</div>
          <div class="page-desc">Your personal salary history, bonus and payment records.</div>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn-ghost" onclick="window._staffExportCSV()">Export CSV</button>
          <button class="btn-primary" onclick="window._staffDownloadSlip()">⬇ Salary Slip</button>
        </div>
      </div>

      <div class="stats-grid cols-4" id="staffSalaryStats">
        <div class="stat-card purple-card">
          <div class="stat-label">Monthly Salary</div>
          <div class="stat-value" id="sst-current">—</div>
          <div class="stat-delta" id="sst-month">Loading…</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Bonus</div>
          <div class="stat-value" id="sst-bonus" style="color:var(--green);">—</div>
          <div class="stat-delta">Performance incentive</div>
        </div>
        <div class="stat-card dark-card">
          <div class="stat-label">Deductions</div>
          <div class="stat-value" id="sst-deductions" style="color:var(--red);">—</div>
          <div class="stat-delta down">TDS / PF / leaves</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Net Salary</div>
          <div class="stat-value" id="sst-net">—</div>
          <div class="stat-delta" id="sst-status">—</div>
        </div>
      </div>

      <div class="card" style="margin-top:4px;">
        <div class="card-header">
          <div class="card-title">Salary History</div>
          <span id="staffPayrollMsg" style="font-size:12px;color:var(--muted);"></span>
        </div>
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Base Salary</th>
                <th>Bonus</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="staffSalaryBody">
              ${_skeleton(6)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    _loadStaffData();
  } catch (e) {
    console.error("renderStaffSalary error:", e);
    _showPayrollError(container, "salary");
  }
};

async function _loadStaffData() {
  let records = [];
  try {
    const data = await apiRequest("GET", "/payroll/my");
    records = Array.isArray(data) ? data : data.items || [];
  } catch (_) {}

  if (!records.length) {
    records = _getDemoData("staff");
    const msg = document.getElementById("staffPayrollMsg");
    if (msg) msg.textContent = `${records.length} demo records`;
  } else {
    const msg = document.getElementById("staffPayrollMsg");
    if (msg)
      msg.textContent = `${records.length} record${records.length !== 1 ? "s" : ""}`;
  }

  _payData = records;
  _renderStaffTable(records);
  _renderStaffStats(records);
}

function _renderStaffStats(records) {
  if (!records.length) return;
  const latest = records[0];
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };
  set("sst-current", _fmt(_base(latest)));
  set("sst-bonus", `+${_fmt(Number(latest.bonus || 0))}`);
  set(
    "sst-deductions",
    `−${_fmt(Number(latest.deductions || latest.deduction || 0))}`,
  );
  set("sst-net", _fmt(_net(latest)));
  set("sst-month", _periodLabel(latest));
  const st = latest.status || "pending";
  set(
    "sst-status",
    st === "paid"
      ? "Credited"
      : st === "processed"
        ? "Processing"
        : "⏳ Pending",
  );
}

function _renderStaffTable(records) {
  const tbody = document.getElementById("staffSalaryBody");
  if (!tbody) return;

  if (!records.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--muted);">
      <div class="card-icon-lg"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
      No salary records found yet.
    </td></tr>`;
    return;
  }

  tbody.innerHTML = records
    .map(
      (r) => `
    <tr>
      <td><strong>${_periodLabel(r)}</strong></td>
      <td>${_fmt(_base(r))}</td>
      <td style="color:var(--green);">+${_fmt(Number(r.bonus || 0))}</td>
      <td style="color:var(--red);">−${_fmt(Number(r.deductions || r.deduction || 0))}</td>
      <td style="font-weight:700;">${_fmt(_net(r))}</td>
      <td><span class="sprint-status ${_badge(r.status || "pending")}">${_cap(r.status || "pending")}</span></td>
    </tr>
  `,
    )
    .join("");
}

window._staffExportCSV = function () {
  if (!_payData.length) {
    showToast("No salary data to export", "warning");
    return;
  }
  const headers = [
    "Period",
    "Base Salary",
    "Bonus",
    "Deductions",
    "Net Salary",
    "Status",
  ];
  const rows = _payData.map((r) => [
    _periodLabel(r),
    _base(r),
    r.bonus || 0,
    r.deductions || 0,
    _net(r),
    r.status || "",
  ]);
  _downloadCSV("antbox-salary", headers, rows);
  showToast("Salary CSV exported", "success");
};

window._staffDownloadSlip = function () {
  showToast("Generating salary slip PDF… (demo)", "info");
  setTimeout(() => showToast("Salary slip ready", "success"), 1800);
};

// ═══════════════════════════════════════════════════════════════════
// HR / ADMIN PAYROLL ENGINE — full ledger + controls
// ═══════════════════════════════════════════════════════════════════
window.renderHRPayrollEngine = function () {
  const container = document.getElementById("view-payroll-engine");
  if (!container) return;

  try {
    container.innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">Payroll Engine</div>
          <div class="page-desc">Full payroll ledger — manage cycles, mark payments, generate payslips.</div>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn-ghost" onclick="window._hrExportCSV()">Export CSV</button>
          <button class="btn-primary" onclick="window._hrRunCycle()">▶ Run Payroll Cycle</button>
        </div>
      </div>

      <div class="stats-grid cols-4" id="hrPayrollStats">
        <div class="stat-card purple-card">
          <div class="stat-label">Total Outflow</div>
          <div class="stat-value" id="hps-outflow">₹0</div>
          <div class="stat-delta" id="hps-cycle">May 2025</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Employees Processed</div>
          <div class="stat-value" id="hps-count">0</div>
          <div class="stat-delta">This cycle</div>
        </div>
        <div class="stat-card dark-card">
          <div class="stat-label">Total Deductions</div>
          <div class="stat-value" id="hps-deductions" style="color:var(--red);">₹0</div>
          <div class="stat-delta down">Leaves / TDS</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pending Payments</div>
          <div class="stat-value" id="hps-pending" style="color:var(--amber);">0</div>
          <div class="stat-delta">Awaiting transfer</div>
        </div>
      </div>

      <div class="card" style="margin-top:4px;">
        <div class="card-header">
          <div class="card-title">Payroll Ledger</div>
          <div style="display:flex;gap:8px;align-items:center;">
            <input id="hrPaySearch" class="form-input" style="width:200px;height:32px;font-size:13px;border-radius:8px;padding:0 10px;" placeholder="Search employee…" oninput="window._hrFilterTable()" />
            <select id="hrPayFilter" class="form-input" style="width:130px;height:32px;font-size:13px;border-radius:8px;padding:0 8px;cursor:pointer;" onchange="window._hrFilterTable()">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processed">Processed</option>
              <option value="paid">Paid</option>
            </select>
            <span id="hrPayrollMsg" style="font-size:12px;color:var(--muted);white-space:nowrap;"></span>
          </div>
        </div>
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Employee</th>
                <th>Role</th>
                <th>Base</th>
                <th>Bonus</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="hrPayrollBody">
              ${_skeleton(9)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    _loadHRData();
  } catch (e) {
    console.error("renderHRPayrollEngine error:", e);
    _showPayrollError(container, "payroll engine");
  }
};

let _hrAllRecords = [];

async function _loadHRData() {
  let records = [];
  try {
    const data = await apiRequest("GET", "/payroll");
    records = Array.isArray(data) ? data : data.items || [];
  } catch (_) {}

  if (!records.length) {
    records = DEMO_HR_LEDGER;
    const msg = document.getElementById("hrPayrollMsg");
    if (msg) msg.textContent = `${records.length} demo records`;
  } else {
    const msg = document.getElementById("hrPayrollMsg");
    if (msg) msg.textContent = `${records.length} records`;
  }

  _hrAllRecords = records;
  _payData = records;
  _renderHRTable(records);
  _renderHRStats(records);
}

function _renderHRStats(records) {
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };
  const latest = records.filter(
    (r) =>
      (r.payroll_month || r.month) ===
      Math.max(...records.map((r) => r.payroll_month || r.month || 0)),
  );
  const totalNet = latest.reduce((a, r) => a + _net(r), 0);
  const totalDeduct = latest.reduce(
    (a, r) => a + Number(r.deductions || r.deduction || 0),
    0,
  );
  const pending = records.filter((r) => r.status === "pending").length;
  const period = latest[0] ? _periodLabel(latest[0]) : "—";

  set("hps-outflow", _fmt(totalNet));
  set("hps-cycle", period);
  set("hps-count", latest.length);
  set("hps-deductions", `−${_fmt(totalDeduct)}`);
  set("hps-pending", pending);
}

function _renderHRTable(records) {
  const tbody = document.getElementById("hrPayrollBody");
  if (!tbody) return;

  if (!records.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--muted);">
      <div class="card-icon-lg"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg></div>
      No payroll records found.
    </td></tr>`;
    return;
  }

  tbody.innerHTML = records
    .map((r, i) => {
      const roleLabel =
        {
          intern: "Intern",
          staff: "Staff",
          admin: "HR/Admin",
          client: "Deployed",
        }[r.employee_role] || _cap(r.employee_role || "—");
      const name = r.employee_name || r.employee_email || "—";
      const email = r.employee_email || "";
      const initials = name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
      const avatarColor = [
        "#7c3aed",
        "#3b82f6",
        "#10b981",
        "#f59e0b",
        "#ef4444",
        "#8b5cf6",
      ][i % 6];

      return `
      <tr data-email="${email.toLowerCase()}" data-status="${r.status || "pending"}">
        <td><strong>${_periodLabel(r)}</strong></td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="avatar" style="background:${avatarColor};width:28px;height:28px;font-size:11px;flex-shrink:0;">${initials}</span>
            <div>
              <div style="font-size:13px;font-weight:600;">${name}</div>
              <div style="font-size:11px;color:var(--muted);">${email}</div>
            </div>
          </div>
        </td>
        <td><span class="sprint-status" style="background:rgba(124,58,237,0.15);color:#a78bfa;">${roleLabel}</span></td>
        <td>${_fmt(_base(r))}</td>
        <td style="color:var(--green);">+${_fmt(Number(r.bonus || 0))}</td>
        <td style="color:var(--red);">−${_fmt(Number(r.deductions || r.deduction || 0))}</td>
        <td style="font-weight:700;">${_fmt(_net(r))}</td>
        <td><span class="sprint-status ${_badge(r.status || "pending")}">${_cap(r.status || "pending")}</span></td>
        <td>
          <div style="display:flex;gap:4px;">
            <button class="card-action" style="font-size:11px;padding:4px 8px;" onclick="window._hrMarkPaid(this, '${email}', ${i})" title="Mark Paid">Mark Paid</button>
            <button class="card-action" style="font-size:11px;padding:4px 8px;" onclick="showToast('Payslip generated','success')" title="Payslip"></button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

window._hrFilterTable = function () {
  const search = (
    document.getElementById("hrPaySearch")?.value || ""
  ).toLowerCase();
  const filter = document.getElementById("hrPayFilter")?.value || "all";
  const filtered = _hrAllRecords.filter((r) => {
    const name = (r.employee_name || r.employee_email || "").toLowerCase();
    const matchSearch = !search || name.includes(search);
    const matchStatus = filter === "all" || r.status === filter;
    return matchSearch && matchStatus;
  });
  _renderHRTable(filtered);
  const msg = document.getElementById("hrPayrollMsg");
  if (msg)
    msg.textContent = `${filtered.length} of ${_hrAllRecords.length} records`;
};

window._hrMarkPaid = function (btn, email, idx) {
  const row = btn.closest("tr");
  const statusCell = row?.querySelector(".sprint-status");
  if (statusCell) {
    statusCell.className = "sprint-status status-complete";
    statusCell.textContent = "Paid";
  }
  if (_hrAllRecords[idx]) _hrAllRecords[idx].status = "paid";
  btn.textContent = "Paid";
  btn.disabled = true;
  showToast(`Payment marked for ${email}`, "success");
};

window._hrRunCycle = function () {
  showToast("Payroll cycle initiated for all employees… (demo)", "info");
  setTimeout(
    () =>
      showToast("Payroll cycle complete — 14 records generated", "success"),
    2000,
  );
};

window._hrExportCSV = function () {
  if (!_hrAllRecords.length) {
    showToast("No payroll data to export", "warning");
    return;
  }
  const headers = [
    "Period",
    "Employee",
    "Email",
    "Role",
    "Base",
    "Bonus",
    "Deductions",
    "Net Pay",
    "Status",
  ];
  const rows = _hrAllRecords.map((r) => [
    _periodLabel(r),
    r.employee_name || "",
    r.employee_email || "",
    r.employee_role || "",
    _base(r),
    r.bonus || 0,
    r.deductions || 0,
    _net(r),
    r.status || "",
  ]);
  _downloadCSV("antbox-payroll-ledger", headers, rows);
  showToast("Payroll ledger exported", "success");
};

// ─── HR STIPEND PROCESSOR ───────────────────────────────────────────
window.renderHRStipendProcessor = function () {
  const container = document.getElementById("view-stipend-processor");
  if (!container) return;

  try {
    const internRecords = DEMO_INTERN_PAYROLL.filter(
      (r) => (r.payroll_month || r.month) === 5,
    );
    const totalBase = internRecords.reduce((a, r) => a + _base(r), 0);
    const totalDeduct = internRecords.reduce(
      (a, r) => a + Number(r.deductions || 0),
      0,
    );
    const totalNet = internRecords.reduce((a, r) => a + _net(r), 0);

    container.innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">Stipend Processor</div>
          <div class="page-desc">Automated net payout ledger for intern stipends — current cycle.</div>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn-ghost" onclick="window._stipendExportCSV()">Export CSV</button>
          <button class="btn-primary" onclick="window._runStipendCycle()">▶ Run Stipend Cycle</button>
        </div>
      </div>

      <div class="stats-grid cols-4">
        <div class="stat-card dark-card">
          <div class="stat-label">Total Base Outflow</div>
          <div class="stat-value">${_fmt(totalBase)}</div>
          <div class="stat-delta">May 2025</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Interns Processed</div>
          <div class="stat-value">${internRecords.length}</div>
          <div class="stat-delta">Active cycle</div>
        </div>
        <div class="stat-card dark-card">
          <div class="stat-label">Deductions Applied</div>
          <div class="stat-value" style="color:var(--red);">${_fmt(totalDeduct)}</div>
          <div class="stat-delta down">Unexcused absences</div>
        </div>
        <div class="stat-card purple-card">
          <div class="stat-label">Net Disbursed</div>
          <div class="stat-value">${_fmt(totalNet)}</div>
          <div class="stat-delta">Pending bank transfer</div>
        </div>
      </div>

      <div class="card" style="margin-top:4px;">
        <div class="card-header">
          <div class="card-title">Stipend Ledger — May 2025</div>
          <button class="card-action" onclick="window._stipendExportCSV()">Export CSV</button>
        </div>
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Intern</th>
                <th>Email</th>
                <th>Base Stipend</th>
                <th>Bonus</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${internRecords
                .map((r, i) => {
                  const name = r.employee_name || r.employee_email || "—";
                  const initials = name
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase();
                  const colors = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b"];
                  return `<tr>
                  <td><span class="avatar" style="background:${colors[i % 4]};">${initials}</span>${name}</td>
                  <td style="font-size:12px;color:var(--muted);">${r.employee_email || "—"}</td>
                  <td>${_fmt(_base(r))}</td>
                  <td style="color:var(--green);">+${_fmt(Number(r.bonus || 0))}</td>
                  <td style="color:var(--red);">−${_fmt(Number(r.deductions || 0))}</td>
                  <td style="font-weight:700;">${_fmt(_net(r))}</td>
                  <td><span class="sprint-status ${_badge(r.status || "pending")}">${_cap(r.status || "pending")}</span></td>
                  <td><button class="card-action" style="font-size:11px;padding:4px 8px;" onclick="showToast('Stipend marked paid','success')">Mark Paid</button></td>
                </tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (e) {
    console.error("renderHRStipendProcessor error:", e);
    _showPayrollError(container, "stipend processor");
  }
};

window._runStipendCycle = function () {
  showToast("Stipend cycle initiated for May 2025… (demo)", "info");
  setTimeout(
    () =>
      showToast("Stipend cycle complete — all interns processed", "success"),
    2000,
  );
};

window._stipendExportCSV = function () {
  const records = DEMO_INTERN_PAYROLL.filter(
    (r) => (r.payroll_month || r.month) === 5,
  );
  const headers = [
    "Intern",
    "Email",
    "Base Stipend",
    "Bonus",
    "Deductions",
    "Net Pay",
    "Status",
  ];
  const rows = records.map((r) => [
    r.employee_name || "",
    r.employee_email || "",
    _base(r),
    r.bonus || 0,
    r.deductions || 0,
    _net(r),
    r.status || "",
  ]);
  _downloadCSV("antbox-stipend-ledger", headers, rows);
  showToast("Stipend ledger exported", "success");
};

// ─── HR PAYROLL ANALYTICS ───────────────────────────────────────────
window.renderHRPayrollAnalytics = function () {
  const container = document.getElementById("view-payroll-analytics");
  if (!container) return;

  try {
    container.innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">Payroll Analytics</div>
          <div class="page-desc">Cost centre analysis, trends and payroll distribution.</div>
        </div>
      </div>

      <div class="stats-grid cols-3">
        <div class="stat-card purple-card">
          <div class="stat-label">3-Month Total Outflow</div>
          <div class="stat-value">₹12.4L</div>
          <div class="stat-delta">Mar – May 2025</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Avg. Intern Stipend</div>
          <div class="stat-value">₹21,400</div>
          <div class="stat-delta">↑ 4.2% vs last quarter</div>
        </div>
        <div class="stat-card dark-card">
          <div class="stat-label">Payroll / Revenue Ratio</div>
          <div class="stat-value">34%</div>
          <div class="stat-delta down">↑ Watch threshold</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;">
        <div class="card">
          <div class="card-header"><div class="card-title">Monthly Trend</div></div>
          <div class="card-body">
            ${[
              ["Mar", 380000],
              ["Apr", 410000],
              ["May", 420000],
            ]
              .map(
                ([m, v]) => `
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                <span style="width:32px;font-size:12px;color:var(--muted);">${m}</span>
                <div style="flex:1;background:var(--border);border-radius:4px;height:8px;overflow:hidden;">
                  <div style="width:${Math.round(v / 4200)}%;background:var(--purple);height:8px;border-radius:4px;"></div>
                </div>
                <span style="font-size:13px;font-weight:600;">${_fmt(v)}</span>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Cost by Role</div></div>
          <div class="card-body">
            ${[
              ["Interns", "₹1.06L", 25],
              ["Staff", "₹1.75L", 42],
              ["Admin", "₹1.23L", 29],
              ["Other", "₹0.16L", 4],
            ]
              .map(
                ([label, val, pct]) => `
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                <span style="width:50px;font-size:12px;color:var(--muted);">${label}</span>
                <div style="flex:1;background:var(--border);border-radius:4px;height:8px;overflow:hidden;">
                  <div style="width:${pct}%;background:var(--purple);height:8px;border-radius:4px;"></div>
                </div>
                <span style="font-size:13px;font-weight:600;">${val}</span>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  } catch (e) {
    _showPayrollError(container, "analytics");
  }
};

// ─── SHARED HELPERS ─────────────────────────────────────────────────
function _downloadCSV(name, headers, rows) {
  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${v}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function _showPayrollError(container, label) {
  if (!container) return;
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;gap:12px;color:var(--muted);">
      <div class="card-icon-lg"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></div>
      <div style="font-size:18px;font-weight:600;color:var(--text);">Unable to load ${label}</div>
      <div style="font-size:13px;">This section encountered an error. Please refresh or contact support.</div>
      <button class="btn-primary" onclick="location.reload()">Reload</button>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════
// DISPATCHER — called by navigateTo hook
// Routes to the correct renderer based on backend role
// ═══════════════════════════════════════════════════════════════════
window._dispatchPayrollView = function (viewId) {
  const bRole = _role();
  console.log("[Payroll] dispatch:", viewId, "| backendRole:", bRole);

  if (viewId === "stipend") {
    // Interns/client → personal stipend
    if (bRole === "intern" || bRole === "client") {
      window.renderInternPayroll();
    }
    // HR/admin → stipend processor
    else if (bRole === "admin") {
      window.renderHRStipendProcessor();
    }
    return;
  }

  if (viewId === "salary") {
    window.renderStaffSalary();
    return;
  }

  if (viewId === "payroll-engine") {
    window.renderHRPayrollEngine();
    return;
  }

  if (viewId === "stipend-processor") {
    window.renderHRStipendProcessor();
    return;
  }

  if (viewId === "payroll-analytics") {
    window.renderHRPayrollAnalytics();
    return;
  }
};

// ─── NAVIGATION HOOK ────────────────────────────────────────────────
// Navigation is handled entirely by app.js navigateTo() which calls the
// render functions directly. No secondary dispatch needed here.

// ─── LEGACY COMPAT — keep exportPayrollCSV alive for any inline onclick ──
window.exportPayrollCSV = function () {
  const bRole = _role();
  if (bRole === "admin") window._hrExportCSV();
  else if (bRole === "staff") window._staffExportCSV();
  else window._internExportCSV();
};

// ─── LAUNCH HOOK — patch navConfig with normalized view IDs ─────────
const _payLaunch2 = window.launchApp;
window.launchApp = function () {
  // Normalize navConfig BEFORE the original launchApp builds the sidebar
  _normalizeNavConfig();
  if (_payLaunch2) _payLaunch2();
  // Rebuild sidebar AFTER launch so HR sees the normalized payroll nav items
  // (launchApp already called buildSidebar once with the old config)
  if (window.buildSidebar) {
    setTimeout(() => window.buildSidebar(), 50);
  }
};

function _normalizeNavConfig() {
  if (!window.navConfig) return;
  const bRole = (window.antboxState?.backendRole || "").toLowerCase();

  // Intern/client → stipend view
  if (bRole === "intern" || bRole === "client") {
    ["Intern", "Deployed"].forEach((k) => {
      if (window.navConfig[k]) {
        window.navConfig[k] = window.navConfig[k].map((item) =>
          item.id === "payroll"
            ? { ...item, id: "stipend", label: "My Stipend" }
            : item,
        );
        // Ensure stipend present
        if (!window.navConfig[k].some((i) => i.id === "stipend")) {
          window.navConfig[k].push({
            id: "stipend",
            label: "My Stipend",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>`,
          });
        }
      }
    });
  }

  // Staff → salary view
  if (bRole === "staff") {
    if (window.navConfig.Staff) {
      window.navConfig.Staff = window.navConfig.Staff.map((item) =>
        item.id === "payroll"
          ? { ...item, id: "salary", label: "My Salary" }
          : item,
      );
      if (!window.navConfig.Staff.some((i) => i.id === "salary")) {
        window.navConfig.Staff.push({
          id: "salary",
          label: "My Salary",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
        });
      }
    }
  }

  // HR/admin → payroll engine + stipend processor + analytics
  if (bRole === "admin") {
    if (window.navConfig.HR) {
      // Remove old "payroll" + "stipend" ids and replace with canonical HR ones
      window.navConfig.HR = window.navConfig.HR.filter(
        (i) => i.id !== "payroll" && i.id !== "stipend",
      );
      const payrollItems = [
        { id: "payroll-engine", label: "Payroll Engine", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>` },
        { id: "stipend-processor", label: "Stipend Processor", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>` },
        { id: "payroll-analytics", label: "Payroll Analytics", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>` },
      ];
      payrollItems.forEach((item) => {
        if (!window.navConfig.HR.some((i) => i.id === item.id)) {
          window.navConfig.HR.push(item);
        }
      });
    }
  }
}
// ─── ALIASES: bridge the names app.js dispatches to the full implementations above ───
// app.js navigateTo() calls renderStipendProcessor and renderPayrollAnalytics.
// The full implementations are named renderHRStipendProcessor and renderHRPayrollAnalytics.
// These aliases fix that name mismatch without touching any other module.
window.renderStipendProcessor = function () {
  window.renderHRStipendProcessor();
};
window.renderPayrollAnalytics = function () {
  window.renderHRPayrollAnalytics();
};
window.runPayrollCycle = function () {
  showToast("Payroll cycle initiated", "success");
};
