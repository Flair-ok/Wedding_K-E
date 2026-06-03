const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyA5H2hOA_D9zlqv0KBQCzcokfBfWS70BCuwFmoxGbF1PKGFzd3eMw_Jmcpf3jYDiHSeg/exec';
const SECRET_KEY = '12345'; // ← замени на тот же, что в Apps Script

let guests = [];

async function loadGuests() {
  const resp = await fetch(`${SCRIPT_URL}?key=${encodeURIComponent(SECRET_KEY)}`);
  guests = await resp.json();
  renderTable();
}

function renderTable() {
  const tbody = document.querySelector('#guestTable tbody');
  if (!tbody) return;
  tbody.innerHTML = guests.map(g => `
    <tr>
      <td>${g.fio}</td>
      <td>${g.category}</td>
      <td>${g.drinks}</td>
      <td>${g.age}</td>
      <td>${g.table}</td>
    </tr>
  `).join('');
}

loadGuests();
