// ─── SHARED SIDEBAR + NAV ───

const SHOP = {
  name:    'Ao Nang Automotive',
  nameTH:  'อ่าวนางยานยนต์',
  address: '188 ม.2 ต.อ่าวนาง อ.เมือง จ.กระบี่ 81180',
  phone:   '081-0827810',
};

function getSidebar(activePage = 'dashboard', prefix = '') {
  const pages = {
    dashboard: { href: `${prefix}index.html`,         label: 'Dashboard' },
    ledger:    { href: `${prefix}pages/ledger.html`,   label: 'บัญชีรายวัน' },
    jobs:      { href: `${prefix}pages/jobs.html`,     label: 'งานซ่อม' },
    customers: { href: `${prefix}pages/customers.html`,label: 'ลูกค้า' },
    parts:     { href: `${prefix}pages/parts.html`,    label: 'คลังอะไหล่' },
    invoices:  { href: `${prefix}pages/invoices.html`, label: 'ใบแจ้งหนี้' },
  };

  return `
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-brand">
      <div class="logo-mark">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L4 8v13h5v-6h6v6h5V8L12 2z" fill="#fff"/>
          <circle cx="12" cy="10.5" r="2.5" fill="#fed7aa"/>
        </svg>
      </div>
      <div>
        <div class="brand-en">Ao Nang Automotive</div>
        <div class="brand-th">อ่าวนางยานยนต์ · กระบี่</div>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-sec">หลัก</div>

      <a href="${pages.dashboard.href}" class="nav-item ${activePage==='dashboard'?'active':''}">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h5v5H2V2zm7 0h5v5H9V2zm-7 7h5v5H2V9zm7 0h5v5H9V9z"/></svg>
        Dashboard
      </a>

      <a href="${pages.ledger.href}" class="nav-item ${activePage==='ledger'?'active':''}">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="1.5"/><line x1="5" y1="5" x2="11" y2="5"/><line x1="5" y1="8" x2="11" y2="8"/><line x1="5" y1="11" x2="9" y2="11"/><line x1="11" y1="9" x2="11" y2="13"/><line x1="9" y1="11" x2="13" y2="11"/></svg>
        บัญชีรายวัน
      </a>

      <a href="${pages.jobs.href}" class="nav-item ${activePage==='jobs'?'active':''}">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="1.5"/><line x1="5" y1="5" x2="11" y2="5"/><line x1="5" y1="8" x2="11" y2="8"/><line x1="5" y1="11" x2="8" y2="11"/></svg>
        งานซ่อม
        <span class="nav-badge" id="badge-jobs">0</span>
      </a>

      <a href="${pages.customers.href}" class="nav-item ${activePage==='customers'?'active':''}">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="5.5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>
        ลูกค้า
      </a>

      <div class="nav-sec">คลัง & การเงิน</div>

      <a href="${pages.parts.href}" class="nav-item ${activePage==='parts'?'active':''}">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="12" height="7" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>
        คลังอะไหล่
        <span class="nav-badge" id="badge-parts">0</span>
      </a>

      <a href="${pages.invoices.href}" class="nav-item ${activePage==='invoices'?'active':''}">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="1"/><line x1="5" y1="6" x2="11" y2="6"/><line x1="5" y1="9" x2="11" y2="9"/></svg>
        ใบแจ้งหนี้
      </a>
    </nav>

    <div class="sidebar-footer">
      <div class="user-row">
        <div class="user-ava">อ</div>
        <div>
          <div class="user-name">เจ้าของร้าน</div>
          <div class="user-tel">${SHOP.phone}</div>
        </div>
      </div>
    </div>
  </aside>`;
}

function getTopbar(title, subtitle = '', extraBtns = '') {
  const today = new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return `
  <header class="topbar">
    <div class="topbar-left">
      <button class="menu-toggle" id="menuToggle" style="display:none;flex-direction:column;gap:4px;background:none;border:none;cursor:pointer;padding:4px;margin-right:8px">
        <span style="width:18px;height:2px;background:var(--text-500);border-radius:2px;display:block"></span>
        <span style="width:18px;height:2px;background:var(--text-500);border-radius:2px;display:block"></span>
        <span style="width:18px;height:2px;background:var(--text-500);border-radius:2px;display:block"></span>
      </button>
      <span class="page-title">${title}</span>
      <span class="page-date">${subtitle || today}</span>
    </div>
    <div class="topbar-right">
      ${extraBtns}
    </div>
  </header>`;
}

// Auth guard
function checkAuth(prefix = '') {
  const token = localStorage.getItem('motofix_token');
  if (!token) { window.location.href = prefix + 'login.html'; }
}

// Menu toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('menuToggle');
  if (toggle) {
    toggle.style.display = 'flex';
    toggle.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  }
});
