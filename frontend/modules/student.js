// ═══════════════════════════════════════════════════════════════════
// modules/student.js
// ═══════════════════════════════════════════════════════════════════

// ─── ATTENDANCE HEATMAP ──────────────────────────────────────────────
window.buildAttGrid = function () {
  const grid = document.getElementById("attGrid");
  if (!grid) return;

  const pattern = [
    "present","present","present","absent","present","leave","",
    "present","present","present","present","present","","",
    "present","absent","present","present","present","leave","",
    "present","present","present","present","absent","present","",
  ];

  grid.innerHTML = pattern.map((p, i) => {
    const day = i + 1;
    const isToday = day === 6;

    return `<div class="att-day ${p} ${isToday ? "today" : ""}">
      ${p ? day : ""}
    </div>`;
  }).join("");
};

// ─── LIVE CLOCK ─────────────────────────────────────────────────────
window.startClock = function () {
  function update() {
    const now = new Date();

    const time = now.toLocaleTimeString("en-IN", {
      hour12: false,
    });

    const date = now.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    ["liveClock", "overviewClock"].forEach((id) => {
      const el = document.getElementById(id);

      if (el) {
        el.textContent = id === "liveClock"
          ? time
          : time.slice(0, 5);
      }
    });

    ["liveDate", "overviewDate"].forEach((id) => {
      const el = document.getElementById(id);

      if (el) {
        el.textContent = date;
      }
    });
  }

  update();
  setInterval(update, 1000);
};

// ─── CHECK IN ───────────────────────────────────────────────────────
window.doCheckIn = function () {
  if (window.antboxState.checkedIn) {
    showToast("Already checked in for today.", "warning");
    return;
  }

  window.antboxState.checkedIn = true;
  window.antboxState.checkinTime = new Date();

  const el = document.getElementById("checkinStatusText");

  if (el) {
    el.textContent =
      `Checked in at ${window.antboxState.checkinTime.toLocaleTimeString(
        "en-IN",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      )}`;
  }

  showToast("Checked in successfully", "success");
};

// ─── CHECK OUT ──────────────────────────────────────────────────────
window.doCheckOut = function () {
  if (!window.antboxState.checkedIn) {
    showToast("You need to check in first.", "warning");
    return;
  }

  const now = new Date();

  const mins = Math.floor(
    (now - window.antboxState.checkinTime) / 60000
  );

  const h = Math.floor(mins / 60);
  const m = mins % 60;

  const el = document.getElementById("checkinStatusText");

  if (el) {
    el.textContent = `Checked out — ${h}h ${m}m logged`;
  }

  window.antboxState.checkedIn = false;

  showToast(
    `Checked out — ${h}h ${m}m logged today`,
    "success"
  );
};

// ─── TRACK TOGGLE ───────────────────────────────────────────────────
window.setTrack = function (track) {
  window.antboxState.currentTrack = track;

  document
    .getElementById("trackSDE")
    .classList.toggle("active", track === "SDE");

  document
    .getElementById("trackGTM")
    .classList.toggle("active", track === "GTM");

  document.getElementById("sdeSubmitField").style.display =
    track === "SDE" ? "block" : "none";

  document.getElementById("gtmSubmitField").style.display =
    track === "GTM" ? "block" : "none";
};

// ─── ASSIGNMENT SUBMISSION ──────────────────────────────────────────
window.submitAssignment = function () {
  showToast(
    "Assignment submitted — running validation...",
    "info"
  );

  setTimeout(() => {
    showToast(
      "Validation complete — score updated",
      "success"
    );
  }, 2200);
};

// ─── LEAVE REQUEST ──────────────────────────────────────────────────
window.submitLeave = function () {
  showToast(
    "Leave request submitted — HR email dispatched",
    "info"
  );
};