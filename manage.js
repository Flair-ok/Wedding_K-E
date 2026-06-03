const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwH1djTYhHYEXelXKH_SVK_GSnnrO0WGkWwsn4fzj4xJbSw91KeOHUbnnNHRbhHHxciLg/exec';

let guests = [];
let sortColumn = null;   // текущий столбец сортировки
let sortAsc = true;      // направление сортировки

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
    if (age && g.age !== age) return false;
    if (drink && !g.drinks.split(',').map(d => d.trim()).includes(drink)) return false;
    if (table && !g.table.toLowerCase().includes(table.toLowerCase())) return false;
    return true;
  });
}

// ===================== СОРТИРОВКА =====================
function sortGuests(arr) {
  if (!sortColumn) return arr;
  const col = sortColumn;

  const getSortValue = (g) => {
    switch (col) {
      case 'fio': return (g.fio || '').toLowerCase();
      case 'category': return g.category || '';
      case 'drinks': return g.drinks || '';
      case 'age':
        const ageOrder = { '<18': 1, '18-30': 2, '30-50': 3, '>50': 4 };
        return ageOrder[g.age] || 0;
      case 'table':
        const num = parseInt((g.table || '').replace(/[^0-9]/g, ''));
        return isNaN(num) ? 0 : num;
      default: return '';
    }
  };

  return arr.sort((a, b) => {
    const aVal = getSortValue(a);
    const bVal = getSortValue(b);
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });
}

// ===================== ОТРИСОВКА ТАБЛИЦЫ =====================
function renderTable() {
  const filtered = filteredGuests();
  const sorted = sortGuests(filtered);
  const tbody = document.querySelector('#guestTable tbody');
  if (!tbody) return;

  const ageOptions = ['<18', '18-30', '30-50', '>50'];

  tbody.innerHTML = sorted.map(g => {
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
  fillDrinkFilter();
  updateSortArrows();
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

// ===================== ОБРАБОТЧИК СОРТИРОВКИ ПО ЗАГОЛОВКАМ =====================
function setupSortListeners() {
  document.querySelectorAll('.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (sortColumn === col) {
        sortAsc = !sortAsc;   // меняем направление
      } else {
        sortColumn = col;
        sortAsc = true;       // по умолчанию по возрастанию
      }
      renderTable();
    });
  });
}

function updateSortArrows() {
  document.querySelectorAll('.sortable').forEach(th => {
    const arrow = th.querySelector('.sort-arrow');
    if (!arrow) return;
    if (th.dataset.sort === sortColumn) {
      arrow.textContent = sortAsc ? '🔼' : '🔽';
    } else {
      arrow.textContent = '';
    }
  });
}

// ===================== СБРОС ФИЛЬТРА НАПИТКОВ =====================
document.addEventListener('DOMContentLoaded', function() {
  const resetBtn = document.getElementById('resetDrinkBtn');
  const drinkSelect = document.getElementById('filterDrink');
  if (resetBtn && drinkSelect) {
    resetBtn.addEventListener('click', function() {
      drinkSelect.value = '';
      renderTable();
    });
  }
  // Также при обычном изменении селекта
  drinkSelect?.addEventListener('change', renderTable);
});

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
  setupSortListeners();
  document.getElementById('filterCategory').addEventListener('change', renderTable);
  document.getElementById('filterAge').addEventListener('change', renderTable);
  document.getElementById('filterTable').addEventListener('input', renderTable);
})();
