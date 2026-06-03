// Вставь скопированный URL сюда
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby70vIv7kmJtzSWtODgKc4gthaw1w51yi8MjNQH87zCLAmL5LGweP7p7tolCj-ZQC5bMQ/exec';

let guests = [];

async function loadGuests() {
  try {
    const resp = await fetch(SCRIPT_URL, { method: 'GET', credentials: 'omit' });
    if (!resp.ok) throw new Error('Ошибка сети');
    const data = await resp.json();
    if (Array.isArray(data)) {
      guests = data;
      renderTable();
    } else {
      console.error('Ответ не массив:', data);
    }
  } catch (err) {
    console.error('Ошибка загрузки:', err);
    alert('Не удалось загрузить данные.');
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
