const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyA5H2hOA_D9zlqv0KBQCzcokfBfWS70BCuwFmoxGbF1PKGFzd3eMw_Jmcpf3jYDiHSeg/exec';

let guests = [];

async function loadGuests() {
  try {
    const resp = await fetch(SCRIPT_URL, { method: 'GET', credentials: 'omit' });
    const data = await resp.json();
    if (Array.isArray(data)) {
      guests = data;
      renderTable();
    } else {
      console.error('Неверный формат:', data);
    }
  } catch (err) {
    console.error('Ошибка загрузки:', err);
    alert('Не удалось загрузить данные. Проверьте консоль.');
  }
}

function renderTable() {
  const tbody = document.querySelector('#guestTable tbody');
  if (!tbody) return;
  tbody.innerHTML = guests.map(g => `
    <tr>
      <td>${escapeHtml(g.fio)}</td>
      <td>${escapeHtml(g.category)}</td>
      <td>${escapeHtml(g.drinks)}</td>
      <td>${escapeHtml(g.age)}</td>
      <td>${escapeHtml(g.table)}</td>
    </tr>
  `).join('');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
}

loadGuests();
