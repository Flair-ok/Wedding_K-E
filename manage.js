// ⚠️ Замени на свои значения
const SECRET_KEY = '12345';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz1vvB_fHGMh_SVwJjdH6nhDeUNpWitn4OWxxiyxoITReDuwNn7y7Tgyw9zv3AvynIWHg/exec';

let guests = [];

// Загрузка гостей
async function loadGuests() {
    try {
        const resp = await fetch(`${SCRIPT_URL}?key=${SECRET_KEY}`);
        const data = await resp.json();
        if (Array.isArray(data)) {
            guests = data;
        } else {
            console.error('Неверный формат данных');
        }
    } catch (err) {
        console.error(err);
        alert('Ошибка загрузки данных. Проверьте ключ и настройки скрипта.');
    }
}

// Фильтрация
function filteredGuests() {
    const cat = document.getElementById('filterCategory').value;
    const age = document.getElementById('filterAge').value.trim();
    const drink = document.getElementById('filterDrink').value;
    const table = document.getElementById('filterTable').value.trim();

    return guests.filter(g => {
        if (cat && g.category !== cat) return false;
        if (age && g.age != age) return false;
        if (drink && !g.drinks.split(',').map(d=>d.trim()).includes(drink)) return false;
        if (table && !g.table.toLowerCase().includes(table.toLowerCase())) return false;
        return true;
    });
}

// Обновление таблицы и статистики
function renderTable() {
    const filtered = filteredGuests();
    const tbody = document.querySelector('#guestTable tbody');
    tbody.innerHTML = filtered.map(g => `
        <tr data-id="${g.id}">
            <td><input class="inline-edit" value="${g.fio}" data-field="fio"></td>
            <td>
                <select class="inline-edit" data-field="category">
                    <option ${g.category==='Семья Жениха'?'selected':''}>Семья Жениха</option>
                    <option ${g.category==='Семья Невесты'?'selected':''}>Семья Невесты</option>
                    <option ${g.category==='Друзья'?'selected':''}>Друзья</option>
                </select>
            </td>
            <td><input class="inline-edit" value="${g.drinks}" data-field="drinks"></td>
            <td><input class="inline-edit" value="${g.age}" data-field="age" style="width:60px;"></td>
            <td><input class="inline-edit" value="${g.table}" data-field="table"></td>
            <td>
                <button onclick="updateGuest('${g.id}', this.closest('tr'))">💾</button>
                <button onclick="deleteGuest('${g.id}')">🗑</button>
            </td>
        </tr>
    `).join('');

    updateDrinkStats(filtered);
    updateDrinkFilter();
}

// Обновление выпадающего списка напитков
function updateDrinkFilter() {
    const allDrinks = new Set();
    guests.forEach(g => g.drinks.split(',').forEach(d => allDrinks.add(d.trim())));
    const select = document.getElementById('filterDrink');
    select.innerHTML = '<option value="">Все напитки</option>';
    allDrinks.forEach(d => { 
        if(d) { 
            const opt = document.createElement('option'); 
            opt.value = d; 
            opt.textContent = d; 
            select.appendChild(opt); 
        } 
    });
}

// Калькулятор напитков
function updateDrinkStats(filtered) {
    const countDrinks = (arr) => {
        const stats = {};
        arr.forEach(g => {
            g.drinks.split(',').forEach(d => {
                const drink = d.trim();
                if (drink) stats[drink] = (stats[drink]||0)+1;
            });
        });
        return stats;
    };
    const allStats = countDrinks(guests);
    const filteredStats = countDrinks(filtered);

    const container = document.getElementById('drinkStats');
    container.innerHTML = `<h3>📊 Статистика напитков</h3>
        <div><strong>Все гости (${guests.length})</strong></div>
        <div class="stat-row">${Object.entries(allStats).map(([k,v])=>`<span class="stat-item">${k}: ${v}</span>`).join('')}</div>
        <div style="margin-top:10px;"><strong>Отфильтрованные (${filtered.length})</strong></div>
        <div class="stat-row">${Object.entries(filteredStats).map(([k,v])=>`<span class="stat-item">${k}: ${v}</span>`).join('')}</div>`;
}

// CRUD операции
async function addGuest() {
    const fio = document.getElementById('newFio').value.trim();
    if (!fio) return alert('Введите ФИО');
    const category = document.getElementById('newCategory').value;
    const drinkChecks = [...document.querySelectorAll('#newDrinksCheck input:checked')].map(cb => cb.value).join(', ');
    const age = document.getElementById('newAge').value.trim();
    const table = document.getElementById('newTable').value.trim();
    const body = new URLSearchParams();
    body.append('key', SECRET_KEY);
    body.append('action', 'add');
    body.append('fio', fio);
    body.append('category', category);
    body.append('drinks', drinkChecks);
    body.append('age', age);
    body.append('table', table);
    try {
        const resp = await fetch(SCRIPT_URL, { method: 'POST', body });
        const data = await resp.json();
        if (data.result === 'success') {
            document.getElementById('newFio').value = '';
            document.getElementById('newAge').value = '';
            document.getElementById('newTable').value = '';
            await loadGuests();
            renderTable();
        } else alert(data.message);
    } catch (err) { alert('Ошибка соединения'); }
}

async function updateGuest(id, row) {
    const fields = row.querySelectorAll('[data-field]');
    const body = new URLSearchParams();
    body.append('key', SECRET_KEY);
    body.append('action', 'update');
    body.append('id', id);
    fields.forEach(el => {
        body.append(el.dataset.field, el.value);
    });
    try {
        const resp = await fetch(SCRIPT_URL, { method: 'POST', body });
        const data = await resp.json();
        if (data.result === 'success') {
            await loadGuests();
            renderTable();
        } else alert(data.message);
    } catch (err) { alert('Ошибка соединения'); }
}

async function deleteGuest(id) {
    if (!confirm('Удалить гостя?')) return;
    const body = new URLSearchParams();
    body.append('key', SECRET_KEY);
    body.append('action', 'delete');
    body.append('id', id);
    try {
        const resp = await fetch(SCRIPT_URL, { method: 'POST', body });
        const data = await resp.json();
        if (data.result === 'success') {
            await loadGuests();
            renderTable();
        } else alert(data.message);
    } catch (err) { alert('Ошибка соединения'); }
}

// Инициализация
(async function init() {
    await loadGuests();
    renderTable();
    document.getElementById('filterCategory').addEventListener('change', renderTable);
    document.getElementById('filterAge').addEventListener('input', renderTable);
    document.getElementById('filterDrink').addEventListener('change', renderTable);
    document.getElementById('filterTable').addEventListener('input', renderTable);
})();
