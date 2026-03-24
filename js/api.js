// ─── API CONFIG ───
const API_BASE = 'http://localhost:5000/api';

// ── ดึง token จาก localStorage ──
const getToken = () => localStorage.getItem('motofix_token');

// ── headers พร้อม Auth ──
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

// ── จัดการ response + auth error ──
const handleRes = async (res) => {
  if (res.status === 401) {
    localStorage.removeItem('motofix_token');
    localStorage.removeItem('motofix_user');
    window.location.href = '/login.html';
    return;
  }
  return res.json();
};

const api = {

  // ── AUTH ──
  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  },

  logout() {
    localStorage.removeItem('motofix_token');
    localStorage.removeItem('motofix_user');
    window.location.href = 'login.html';
  },

  getUser() {
    const u = localStorage.getItem('motofix_user');
    return u ? JSON.parse(u) : null;
  },

  // ── JOBS ──
  async getJobs(status = '') {
    const url = status ? `${API_BASE}/jobs?status=${status}` : `${API_BASE}/jobs`;
    const res = await fetch(url, { headers: authHeaders() });
    return handleRes(res);
  },

  async createJob(data) {
    const res = await fetch(`${API_BASE}/jobs`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
    });
    return handleRes(res);
  },

  async updateJob(id, data) {
    const res = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data),
    });
    return handleRes(res);
  },

  async deleteJob(id) {
    const res = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'DELETE', headers: authHeaders(),
    });
    return handleRes(res);
  },

  // ── CUSTOMERS ──
  async getCustomers() {
    const res = await fetch(`${API_BASE}/customers`, { headers: authHeaders() });
    return handleRes(res);
  },

  async createCustomer(data) {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
    });
    return handleRes(res);
  },

  // ── PARTS ──
  async getParts() {
    const res = await fetch(`${API_BASE}/parts`, { headers: authHeaders() });
    return handleRes(res);
  },

  async getLowStock() {
    const res = await fetch(`${API_BASE}/parts/low-stock`, { headers: authHeaders() });
    return handleRes(res);
  },

  async createPart(data) {
    const res = await fetch(`${API_BASE}/parts`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
    });
    return handleRes(res);
  },

  async restock(id, qty) {
    const res = await fetch(`${API_BASE}/parts/${id}/restock`, {
      method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ qty }),
    });
    return handleRes(res);
  },

  // ── INVOICES ──
  async getInvoices() {
    const res = await fetch(`${API_BASE}/invoices`, { headers: authHeaders() });
    return handleRes(res);
  },

  async createInvoice(data) {
    const res = await fetch(`${API_BASE}/invoices`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
    });
    return handleRes(res);
  },

  async payInvoice(id) {
    const res = await fetch(`${API_BASE}/invoices/${id}/pay`, {
      method: 'PATCH', headers: authHeaders(),
    });
    return handleRes(res);
  },

  // ── DASHBOARD ──
  async getStats() {
    const res = await fetch(`${API_BASE}/dashboard/stats`, { headers: authHeaders() });
    return handleRes(res);
  },

  async getRevenueWeek() {
    const res = await fetch(`${API_BASE}/dashboard/revenue-week`, { headers: authHeaders() });
    return handleRes(res);
  },
};