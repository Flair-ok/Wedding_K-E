const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwH1djTYhHYEXelXKH_SVK_GSnnrO0WGkWwsn4fzj4xJbSw91KeOHUbnnNHRbhHHxciLg/exec';

let guests = [];

// ===================== ЗАГРУЗКА ДАННЫХ =====================
async function loadGuests() {
  try {
    const resp = await fetch(SCRIPT_URL, { method: 'GET', credentials: 'omit' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
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

// ===================== ФИЛЬТРАЦИЯ =====================
function filteredGuests() {
  const cat = document.getElementById('filterCategory').value;
  const age = document.getElementById('filterAge').value;
  const drink = document.getElementById('filterDrink').value;
  const table = document.getElementById('filterTable').value.trim();

  return guests.filter(g => {
    if (cat && g.category !== cat) return false;
    if (age && g.age !== age) return false;   // точное совпадение категории
    if (drink && !g.drinks.split(',').map(d => d.trim()).includes(drink)) return false;
    if (table && !g.table.toLowerCase().includes(table.toLowerCase())) return false;
    return true;
  });
}

// ===================== ОТРИСОВКА ТАБЛИЦЫ =====================
function renderTable() {
  const filtered = filteredGuests();
  const tbody = document.querySelector('#guestTable tbody');
  if (!tbody) return;

  const ageOptions = ['<18', '18-30', '30-50', '>50'];

  tbody.innerHTML = filtered.map(g => {
    const ageSelect = ageOptions.map(opt =>
      `<option value="${opt}" ${g.age === opt ? 'selected' : ''}>${opt}</option>`
    ).join('');
    return `
    <tr data-id="${g.id}">
      <td><input class="inline-edit" value="${escapeHtml(g.fio)}" data-field="fio"></td>
      <td>
        <select class="inline-edit" data-field="category">
          <option ${g.category === 'Семья Жениха' ? 'selected' : ''}>Семья Жениха</option>
          <option ${g.category === 'Семья Невесты' ? 'selected' : ''}>Семья Невесты</option>
          <option ${g.category === 'Друзья' ? 'selected' : ''}>Друзья</option>
        </select>
      </td>
      <td><input class="inline-edit" value="${escapeHtml(g.drinks)}" data-field="drinks"></td>
      <td>
        <select class="inline-edit" data-field="age">
          ${ageSelect}
        </select>
      </td>
      <td><input class="inline-edit" value="${escapeHtml(g.table)}" data-field="table"></td>
      <td>
        <button onclick="updateGuest('${g.id}', this.closest('tr'))">💾</button>
        <button onclick="deleteGuest('${g.id}')">🗑</button>
      </td>
    </tr>`;
  }).join('');

  updateDrinkStats(filtered);
  fillDrinkFilter();   // статический список
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
}

// ===================== СТАТИЧЕСКИЙ ФИЛЬТР НАПИТКОВ =====================
function fillDrinkFilter() {
  const allDrinks = ['Не пью', 'Сок', 'Лимонад', 'Вино', 'Шампанское', 'Водка', 'Коньяк', 'Самогон'];
  const select = document.getElementById('filterDrink');
  select.innerHTML = '<option value="">Все напитки</option>';
  allDrinks.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    select.appendChild(opt);
  });
}

// ===================== КАЛЬКУЛЯТОР НАПИТКОВ =====================
function updateDrinkStats(filtered) {
  const countDrinks = (arr) => {
    const stats = {};
    arr.forEach(g => {
      g.drinks.split(',').forEach(d => {
        const drink = d.trim();
        if (drink) stats[drink] = (stats[drink] || 0) + 1;
      });
    });
    return stats;
  };
  const allStats = countDrinks(guests);
  const filteredStats = countDrinks(filtered);

  const container = document.getElementById('drinkStats');
  container.innerHTML = `<h3>📊 Статистика напитков</h3>
    <div><strong>Все гости (${guests.length})</strong></div>
    <div class="stat-row">${Object.entries(allStats).map(([k, v]) => `<span class="stat-item">${k}: ${v}</span>`).join('')}</div>
    <div style="margin-top:10px;"><strong>Отфильтрованные (${filtered.length})</strong></div>
    <div class="stat-row">${Object.entries(filteredStats).map(([k, v]) => `<span class="stat-item">${k}: ${v}</span>`).join('')}</div>`;
}

// ===================== ДОБАВЛЕНИЕ ГОСТЯ =====================
async function addGuest() {
  const fio = document.getElementById('newFio').value.trim();
  if (!fio) return alert('Введите ФИО');
  const category = document.getElementById('newCategory').value;
  const age = document.getElementById('newAge').value;
  const drinkChecks = [...document.querySelectorAll('#newDrinksCheck input:checked')].map(cb => cb.value).join(', ');
  const table = document.getElementById('newTable').value.trim();

  const body = new URLSearchParams();
  body.append('action', 'add');
  body.append('fio', fio);
  body.append('category', category);
  body.append('age', age);
  body.append('drinks', drinkChecks);
  body.append('table', table);

  try {
    const resp = await fetch(SCRIPT_URL, {
      method: 'POST',
      body,
      credentials: 'omit',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const data = await resp.json();
    if (data.result === 'success') {
      document.getElementById('newFio').value = '';
      document.getElementById('newTable').value = '';
      document.querySelectorAll('#newDrinksCheck input').forEach(cb => cb.checked = false);
      await loadGuests();
      renderTable();
    } else {
      alert(data.message || 'Ошибка при добавлении');
    }
  } catch (err) {
    alert('Ошибка соединения');
  }
}

// ===================== ОБНОВЛЕНИЕ ГОСТЯ =====================
async function updateGuest(id, row) {
  const fields = row.querySelectorAll('[data-field]');
  const body = new URLSearchParams();
  body.append('action', 'update');
  body.append('id', id);
  fields.forEach(el => body.append(el.dataset.field, el.value));

  try {
    const resp = await fetch(SCRIPT_URL, {
      method: 'POST',
      body,
      credentials: 'omit',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const data = await resp.json();
    if (data.result === 'success') {
      await loadGuests();
      renderTable();
    } else {
      alert(data.message || 'Ошибка при обновлении');
    }
  } catch (err) {
    alert('Ошибка соединения');
  }
}

// ===================== УДАЛЕНИЕ ГОСТЯ =====================
async function deleteGuest(id) {
  if (!confirm('Удалить гостя?')) return;
  const body = new URLSearchParams();
  body.append('action', 'delete');
  body.append('id', id);

  try {
    const resp = await fetch(SCRIPT_URL, {
      method: 'POST',
      body,
      credentials: 'omit',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const data = await resp.json();
    if (data.result === 'success') {
      await loadGuests();
      renderTable();
    } else {
      alert(data.message || 'Ошибка при удалении');
    }
  } catch (err) {
    alert('Ошибка соединения');
  }
}

// ===================== ИНИЦИАЛИЗАЦИЯ =====================
(async function init() {
  await loadGuests();
  document.getElementById('filterCategory').addEventListener('change', renderTable);
  document.getElementById('filterAge').addEventListener('change', renderTable);
  document.getElementById('filterDrink').addEventListener('change', renderTable);
  document.getElementById('filterTable').addEventListener('input', renderTable);
})();
