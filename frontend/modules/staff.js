// ═══════════════════════════════════════════════════════════════════
// modules/staff.js
// ═══════════════════════════════════════════════════════════════════

window.talentData = [
  {
    name: "Kavya Nair",
    track: "SDE",
    skills: "React, Node.js",
    score: 82,
    status: "Deployed",
  },
  {
    name: "Aryan Mehta",
    track: "SDE",
    skills: "React, Python",
    score: 88,
    status: "Pool",
  },
  {
    name: "Priya Sharma",
    track: "GTM",
    skills: "Figma, Deck",
    score: 91,
    status: "Pool",
  },
];

// ─── BUILD TALENT TABLE ─────────────────────────────────────────────
window.buildTalentTable = function (
  filter = "all",
  search = ""
) {
  const body = document.getElementById("talentBody");

  if (!body) return;

  let data = [...window.talentData];

  if (filter === "sde") {
    data = data.filter((t) => t.track === "SDE");
  }

  if (filter === "gtm") {
    data = data.filter((t) => t.track === "GTM");
  }

  if (filter === "high") {
    data = data.filter((t) => t.score >= 85);
  }

  if (search) {
    data = data.filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.skills.toLowerCase().includes(search.toLowerCase())
    );
  }

  body.innerHTML = data.map((t) => `
    <tr>
      <td>${t.name}</td>
      <td>${t.track}</td>
      <td>${t.skills}</td>
      <td>${t.score}</td>
      <td>${t.status}</td>
      <td>
        <button onclick="showToast('${t.name} shortlisted', 'success')">
          Shortlist
        </button>
      </td>
    </tr>
  `).join("");

  const countEl = document.getElementById("talentCount");

  if (countEl) {
    countEl.textContent = `${data.length} profiles`;
  }
};

// ─── FILTER TALENT ──────────────────────────────────────────────────
window.filterTalent = function () {
  buildTalentTable(
    window.antboxState.talentFilter || "all",
    document.getElementById("talentSearch")?.value || ""
  );
};

// ─── CHIP FILTER ────────────────────────────────────────────────────
window.setChip = function (val) {
  window.antboxState.talentFilter = val;

  document
    .querySelectorAll(".filter-chip")
    .forEach((c) => c.classList.remove("active"));

  const map = {
    all: "chipAll",
    sde: "chipSDE",
    gtm: "chipGTM",
    high: "chip85",
  };

  const el = document.getElementById(map[val]);

  if (el) {
    el.classList.add("active");
  }

  filterTalent();
};