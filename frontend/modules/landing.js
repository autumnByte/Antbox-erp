// ═══════════════════════════════════════════════════════════════════
// modules/landing.js  —  Landing page nav, scroll, docs modal
// ═══════════════════════════════════════════════════════════════════

// ─── SMOOTH SCROLL TO SECTION ────────────────────────────────────
window.scrollToSection = function (id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// ─── PREFILL ROLE PILL → OPEN LOGIN MODAL ────────────────────────
// Replaces the insecure quickLogin bypass
window.prefillRole = function (role) {
  const roleMap = {
    Student: 'Student',
    Intern: 'Intern',
    Deployed: 'Deployed',
    Staff: 'Staff',
    HR: 'HR',
  };

  const select = document.getElementById('loginRole');
  if (select) {
    select.value = roleMap[role] || 'Student';
  }

  openLoginModal();
  showToast(`Role pre-selected: ${role}. Please enter your credentials.`, 'info');
};

// ─── DOCS CONTENT ────────────────────────────────────────────────
const DOCS_CONTENT = {
  onboarding: {
    title: 'Onboarding Guide',
    sub: 'Your first steps inside the Antbox platform.',
    body: `
      <div class="docs-section">
        <div class="docs-step"><span class="docs-num">1</span><div><strong>Create Your Account</strong><p>Register with your email, choose your role (Student / Intern) and your track (SDE or GTM).</p></div></div>
        <div class="docs-step"><span class="docs-num">2</span><div><strong>Get Your ID</strong><p>New users receive a Demo ID. HR upgrades you to a Real ID once enrollment is confirmed and your cohort is assigned.</p></div></div>
        <div class="docs-step"><span class="docs-num">3</span><div><strong>Join Your Cohort</strong><p>You'll be assigned to an active cohort. Your sprint schedule, mentor, and track materials will be available from day one.</p></div></div>
        <div class="docs-step"><span class="docs-num">4</span><div><strong>Start Your First Sprint</strong><p>Navigate to Sprint Modules. Complete weekly tasks, submit GitHub repos (SDE) or decks (GTM) before the sprint deadline.</p></div></div>
        <div class="docs-step"><span class="docs-num">5</span><div><strong>Track Your Readiness</strong><p>Your Readiness Score is updated weekly. Aim for 80+ to qualify for Fintech deployment consideration.</p></div></div>
      </div>
    `,
  },
  sprint: {
    title: 'Sprint System',
    sub: 'Weekly structured sprints with real deliverables.',
    body: `
      <div class="docs-section">
        <div class="docs-block"><strong>Sprint Structure</strong><p>Each sprint runs Monday–Friday. You receive tasks on Monday and submit by Friday 11:59 PM.</p></div>
        <div class="docs-block"><strong>SDE Track Submissions</strong><p>Submit a GitHub repository URL with working code, a README, and unit tests where applicable. Auto-validation runs on submission.</p></div>
        <div class="docs-block"><strong>GTM Track Submissions</strong><p>Submit a Figma or Google Slides link. Decks are reviewed by a senior mentor within 48 hours.</p></div>
        <div class="docs-block"><strong>Grading Rubric</strong><p>Submissions are scored on: Completeness (40%), Code/Content Quality (30%), Timeliness (20%), Creativity (10%).</p></div>
        <div class="docs-block"><strong>Late Submissions</strong><p>Submissions after the deadline receive a 20% penalty. No submissions after 72h from deadline are accepted.</p></div>
      </div>
    `,
  },
  payroll: {
    title: 'Payroll System',
    sub: 'Automated stipend processing and deduction logic.',
    body: `
      <div class="docs-section">
        <div class="docs-block"><strong>Stipend Calculation</strong><p>Base stipend is defined per role tier. Net payout = Base × (Present Days / Working Days). Unexcused absences reduce base proportionally.</p></div>
        <div class="docs-block"><strong>Deduction Rules</strong><p>Approved leave days are excluded from deduction calculations. Unexcused absences are penalized at 1/22 of the monthly base per day.</p></div>
        <div class="docs-block"><strong>Payout Timeline</strong><p>Payroll is processed on the 1st of each month for the previous month. Bank transfer completes within 3–5 working days.</p></div>
        <div class="docs-block"><strong>Payslip Access</strong><p>Log in and navigate to the Payroll section. You can view your history and export a CSV of all transactions.</p></div>
      </div>
    `,
  },
  readiness: {
    title: 'Readiness Score',
    sub: 'Multi-axis evaluation of your deployment readiness.',
    body: `
      <div class="docs-section">
        <div class="docs-block"><strong>What is the Readiness Score?</strong><p>A composite score out of 100 that measures how prepared you are for Fintech deployment. Reviewed weekly by HR and mentors.</p></div>
        <div class="docs-block"><strong>Score Axes</strong>
          <ul style="margin:8px 0 0 16px;font-size:13px;color:var(--muted);line-height:1.8;">
            <li><strong style="color:var(--dark);">Technical Depth (30%)</strong> — Code quality, problem-solving, architecture</li>
            <li><strong style="color:var(--dark);">Submission Pacing (25%)</strong> — On-time delivery, consistency</li>
            <li><strong style="color:var(--dark);">Peer Review Quality (25%)</strong> — Feedback given to teammates</li>
            <li><strong style="color:var(--dark);">Attendance (20%)</strong> — Daily check-in consistency</li>
          </ul>
        </div>
        <div class="docs-block"><strong>Deployment Threshold</strong><p>A score of 80+ qualifies you for the Fintech Matching Pool. 90+ puts you in the Priority Pool with direct client referrals.</p></div>
      </div>
    `,
  },
  ppo: {
    title: 'PPO Workflow',
    sub: 'Permanent placement offer process and milestones.',
    body: `
      <div class="docs-section">
        <div class="docs-step"><span class="docs-num">1</span><div><strong>Matching Pool</strong><p>After readiness threshold (80+), your profile is added to the Fintech Matching Pool visible to partner companies.</p></div></div>
        <div class="docs-step"><span class="docs-num">2</span><div><strong>Selection Stage</strong><p>Partners review your profile, score, and project portfolio. They may request a short technical/product interview.</p></div></div>
        <div class="docs-step"><span class="docs-num">3</span><div><strong>Active Deployment</strong><p>You're placed at a client site. You log hours, receive a client rating, and continue sprint tasks in parallel.</p></div></div>
        <div class="docs-step"><span class="docs-num">4</span><div><strong>PPO Review</strong><p>After 90 days, clients submit a PPO intent. Criteria: 40+ completed tasks, client rating ≥ 4.5, readiness ≥ 85.</p></div></div>
        <div class="docs-step"><span class="docs-num">5</span><div><strong>Confirmed Offer</strong><p>PPO letter is issued. You're transitioned to Alumni status in Antbox with full-time access credentials.</p></div></div>
      </div>
    `,
  },
};

// ─── OPEN DOCS MODAL ─────────────────────────────────────────────
window.openDocsModal = function (section) {
  const modal = document.getElementById('docsModal');
  const titleEl = document.getElementById('docsModalTitle');
  const subEl = document.getElementById('docsModalSub');
  const bodyEl = document.getElementById('docsModalBody');

  const content = DOCS_CONTENT[section] || {
    title: 'Antbox Documentation',
    sub: 'Choose a topic from the Resources section.',
    body: `<div class="docs-section">${Object.entries(DOCS_CONTENT).map(([k, v]) =>
      `<div class="docs-block" style="cursor:pointer;" onclick="openDocsModal('${k}')"><strong>${v.title}</strong><p>${v.sub}</p></div>`
    ).join('')}</div>`,
  };

  if (titleEl) titleEl.textContent = content.title;
  if (subEl) subEl.textContent = content.sub;
  if (bodyEl) bodyEl.innerHTML = content.body;

  if (modal) modal.classList.add('open');
};

window.closeDocsModal = function () {
  const modal = document.getElementById('docsModal');
  if (modal) modal.classList.remove('open');
};

// Close on backdrop click
document.addEventListener('DOMContentLoaded', function () {
  const docsModal = document.getElementById('docsModal');
  if (docsModal) {
    docsModal.addEventListener('click', function (e) {
      if (e.target === docsModal) closeDocsModal();
    });
  }
  const loginModal = document.getElementById('loginModal');
  if (loginModal) {
    loginModal.addEventListener('click', function (e) {
      if (e.target === loginModal) closeLoginModal();
    });
  }
  const registerModal = document.getElementById('registerModal');
  if (registerModal) {
    registerModal.addEventListener('click', function (e) {
      if (e.target === registerModal) closeRegisterModal();
    });
  }
});
