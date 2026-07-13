'use strict';

let sortColumn = null;
let sortAsc = true;

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
                const match = (g.table || '').match(/Стол\s*-\s*(\d+)/);
                return match ? parseInt(match[1]) : 0;
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

function renderTable() {
    const filtered = filteredGuests();
    const sorted = sortGuests(filtered);
    const tbody = document.querySelector('#guestTable tbody');
    if (!tbody) return;

    const ageOptions = ['<18', '18-30', '30-50', '>50'];
    const tableOptions = getAllTableOptions();

    tbody.innerHTML = sorted.map(g => {
        const ageSelect = ageOptions.map(opt =>
            `<option value="${opt}" ${g.age === opt ? 'selected' : ''}>${opt}</option>`
        ).join('');

        const tableSelect = tableOptions.map(t =>
            `<option value="${t}" ${g.table === t ? 'selected' : ''}>${t}</option>`
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
            <td>
                <select class="inline-edit" data-field="table">
                    ${tableSelect}
                </select>
            </td>
            <td>
                <button onclick="updateGuest('${g.id}', this.closest('tr'))">💾</button>
                <button onclick="deleteGuest('${g.id}')">🗑</button>
            </td>
        </tr>`;
    }).join('');

    updateDrinkStats(filtered);
    updateSortArrows();
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
}

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

function setupSortListeners() {
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.dataset.sort;
            if (sortColumn === col) {
                if (sortAsc) sortAsc = false;
                else { sortColumn = null; sortAsc = true; }
            } else {
                sortColumn = col;
                sortAsc = true;
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

function renderSeatingPlan() {
    const container = document.getElementById('tables-container');
    if (!container) return;

    const rectGuests = guests.filter(g => g.table === 'Стол - 1');

    const roundTableGuests = {};
    tables.forEach(t => roundTableGuests[t.name] = []);
    const unassigned = [];

    guests.forEach(g => {
        if (g.table === 'Стол - 1') return;
        if (tables.some(t => t.name === g.table)) {
            roundTableGuests[g.table].push(g);
        } else {
            unassigned.push(g);
        }
    });

    let html = '';
    html += renderRectangleTable(rectGuests);
    tables.forEach(t => {
        html += renderRoundTable(t.name, roundTableGuests[t.name] || [], t.capacity);
    });

    container.innerHTML = html;

    const unassignedContainer = document.createElement('div');
    unassignedContainer.className = 'unassigned-guests';
    unassignedContainer.innerHTML = `<h4>Неразмещённые гости (${unassigned.length})</h4>
        <div class="unassigned-list" id="unassigned-list">`;
    unassigned.forEach(g => {
        unassignedContainer.querySelector('.unassigned-list').innerHTML +=
            `<div class="unassigned-guest" draggable="true" data-guest-id="${g.id}">${escapeHtml(g.fio)}</div>`;
    });
    container.appendChild(unassignedContainer);

    setupDragAndDrop();
}

function renderRectangleTable(guestsList) {
    const slots = [];
    for (let i = 0; i < 2; i++) {
        const guest = guestsList[i] || null;
        slots.push(`
            <div class="guest-slot ${guest ? 'occupied' : ''}" 
                 data-table-id="rect" data-slot="${i}" 
                 ${guest ? `data-guest-id="${guest.id}" draggable="true"` : ''}>
                ${guest ? escapeHtml(guest.fio) : 'Пусто'}
            </div>`);
    }
    return `
        <div class="table-block">
            <h4>Молодожёны</h4>
            <div class="rect-table" data-table-id="rect">
                ${slots.join('')}
            </div>
        </div>`;
}

function renderRoundTable(tableName, guestsList, capacity) {
    const slots = [];
    for (let i = 0; i < capacity; i++) {
        const guest = guestsList[i] || null;
        slots.push(`
            <div class="guest-slot ${guest ? 'occupied' : ''}" 
                 data-table-id="${tableName}" data-slot="${i}"
                 ${guest ? `data-guest-id="${guest.id}" draggable="true"` : ''}>
                ${guest ? escapeHtml(guest.fio) : 'Свободно'}
            </div>`);
    }
    return `
        <div class="table-block">
            <h4>${tableName} (${capacity} мест)</h4>
            <div class="round-table" data-table-id="${tableName}">
                ${slots.join('')}
            </div>
        </div>`;
}