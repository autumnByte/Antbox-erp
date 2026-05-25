// ═══════════════════════════════════════════════════════════════════
// modules/notifications.js  —  Bell, badge, drawer, polling
// Uses real /api/notifications endpoint. Demo data only when logged out.
// ═══════════════════════════════════════════════════════════════════

const NOTIF_POLL_INTERVAL = 30000; // 30 seconds
let _notifPollTimer = null;
let _notifCache = [];

// ─── OPEN / CLOSE DRAWER ─────────────────────────────────────────
window.openNotifDrawer = function () {
  document.getElementById("notifDrawer")?.classList.add("open");
  document.getElementById("notifBackdrop")?.classList.add("open");
  renderNotifList();
  _markAllReadAPI();
};

window.closeNotifDrawer = function () {
  document.getElementById("notifDrawer")?.classList.remove("open");
  document.getElementById("notifBackdrop")?.classList.remove("open");
};

// ─── FETCH NOTIFICATIONS FROM BACKEND ────────────────────────────
async function fetchNotifications() {
  if (!window.antboxState?.token) return;

  try {
    const data = await apiRequest("GET", "/notifications?limit=50");
    _notifCache = Array.isArray(data) ? data : (data.items || []);
    updateBadge();
  } catch (err) {
    // Only log once per session, not every poll failure
    if (!window._notifErrLogged) {
      console.warn("Notifications endpoint unavailable:", err.message);
      window._notifErrLogged = true;
    }
    // Keep existing cache rather than replacing with demo data
  }
}

// ─── BADGE UPDATE ────────────────────────────────────────────────
function updateBadge() {
  const badge = document.getElementById("notifBadge");
  if (!badge) return;
  const unread = _notifCache.filter(n => !n.is_read && !n.read).length;
  if (unread > 0) {
    badge.textContent = unread > 9 ? "9+" : unread;
    badge.style.display = "flex";
  } else {
    badge.style.display = "none";
  }
}

// ─── MARK ALL READ ────────────────────────────────────────────────
function _markAllReadAPI() {
  _notifCache.forEach(n => { n.is_read = true; n.read = true; });
  updateBadge();
  if (window.antboxState?.token) {
    apiRequest("POST", "/notifications/read-all").catch(() => {});
  }
}

// ─── RENDER NOTIFICATION LIST ─────────────────────────────────────
function renderNotifList() {
  const list = document.getElementById("notifList");
  if (!list) return;

  if (!_notifCache.length) {
    list.innerHTML = `<div style="text-align:center;padding:32px;color:rgba(255,255,255,0.3);font-size:13px;">No notifications yet.</div>`;
    return;
  }

  const iconMap  = { success: "✓", warning: "!", info: "●", error: "✕" };
  const colorMap = {
    success: "var(--green)",
    warning: "var(--amber)",
    info:    "var(--purple)",
    error:   "var(--red)",
  };

  list.innerHTML = [..._notifCache]
    .sort((a, b) => (b.ts || 0) - (a.ts || 0))
    .map(n => {
      const type  = n.type || "info";
      const ago   = formatTimeAgo(n.ts || 0);
      const icon  = iconMap[type]  || "●";
      const color = colorMap[type] || "var(--purple)";
      const unread = !n.is_read && !n.read;
      return `
        <div class="notif-item ${unread ? "notif-unread" : ""}">
          <div class="notif-icon" style="background:${color}22;color:${color};">${icon}</div>
          <div class="notif-body">
            <div class="notif-title">${escapeHtml(n.title || "")}</div>
            <div class="notif-msg">${escapeHtml(n.message || n.body || "")}</div>
            <div class="notif-time">${ago}</div>
          </div>
        </div>`;
    }).join("");
}

// ─── HELPERS ─────────────────────────────────────────────────────
function formatTimeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function escapeHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ─── START POLLING ────────────────────────────────────────────────
window.startNotifPolling = function () {
  window._notifErrLogged = false; // reset error suppression on new session
  fetchNotifications();
  if (_notifPollTimer) clearInterval(_notifPollTimer);
  _notifPollTimer = setInterval(fetchNotifications, NOTIF_POLL_INTERVAL);
};

window.stopNotifPolling = function () {
  if (_notifPollTimer) clearInterval(_notifPollTimer);
  _notifPollTimer = null;
};

// ─── PUSH A LOCAL NOTIFICATION (used by other modules) ───────────
window.pushNotification = function (title, message, type = "info") {
  _notifCache.unshift({
    id: Date.now(),
    type,
    title,
    message,
    is_read: false,
    read: false,
    ts: Date.now(),
  });
  updateBadge();
  showToast(`${title}`, type);
};

// ─── HOOK INTO launchApp ──────────────────────────────────────────
const _origLaunchApp_notif = window.launchApp;
window.launchApp = function () {
  if (_origLaunchApp_notif) _origLaunchApp_notif();
  _notifCache = []; // clear cache on fresh session
  setTimeout(startNotifPolling, 500);
};
