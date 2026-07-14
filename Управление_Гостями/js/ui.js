'use strict';

let sortColumn = null;
let sortAsc = true;

// Отображение таблицы гостей и рассадки
function renderTable() {
    const filtered = filteredGuests();
    const sorted = sortGuests(filtered);
    const tbody = document.querySelector('#guestTable tbody');
    const tableNames = ['Стол - 1', ...tables.map(t => t.name)];
    const tableOptionsHTML = tableNames.map(t => `<option value="${t}">${t}</option>`).join('');

    tbody.innerHTML = sorted.map(g => {
        const categorySelect = `
            <select class="inline-edit" data-field="category">
                <option ${g.category==='Семья Жениха'?'selected':''}>Семья Жениха</option>
                <option ${g.category==='Семья Невесты'?'selected':''}>Семья Невесты</option>
                <option ${g.category==='Друзья'?'selected':''}>Друзья</option>
            </select>`;
        const tableSelect = `
            <select class="inline-edit" data-field="table">
                ${tableNames.map(t => `<option value="${t}" ${g.table===t?'selected':''}>${t}</option>`).join('')}
            </select>`;
        return `
        <tr data-id="${g.id}">
            <td><input class="inline-edit" value="${escapeHtml(g.fio)}" data-field="fio"></td>
            <td>${categorySelect}</td>
            <td><input class="inline-edit" value="${escapeHtml(g.drinks)}" data-field="drinks"></td>
            <td><input class="inline-edit" value="${g.age}" data-field="age" style="width:60px;"></td>
            <td>${tableSelect}</td>
            <td>
                <button onclick="updateGuest('${g.id}', this.closest('tr'))">💾</button>
                <button onclick="deleteGuest('${g.id}')">🗑</button>
            </td>
        </tr>`;
    }).join('');

    updateDrinkStats(filtered);
    updateDrinkFilter();
    updateSortArrows();
    renderSeatingPlan();   // <-- теперь рассадка обновляется вместе с таблицей
}

// Сортировка
function sortGuests(arr) {
    if (!sortColumn) return arr;
    const col = sortColumn;
    const getSortValue = (g) => {
        switch (col) {
            case 'fio': return (g.fio || '').toLowerCase();
            case 'category': return g.category || '';
            case 'drinks': return g.drinks || '';
            case 'age': return parseInt(g.age) || 0;
            case 'table': return g.table || '';
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

// Привязка кликов по заголовкам
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

// Фильтрация гостей
function filteredGuests() {
    const cat = document.getElementById('filterCategory').value;
    const age = document.getElementById('filterAge').value;
    const drink = document.getElementById('filterDrink').value;
    const table = document.getElementById('filterTable').value;
    return guests.filter(g => {
        if (cat && g.category !== cat) return false;
        if (age && g.age !== age) return false;
        if (drink && !g.drinks.split(',').map(d=>d.trim()).includes(drink)) return false;
        if (table && g.table !== table) return false;
        return true;
    });
}

// Фильтр напитков
function updateDrinkFilter() {
    const allDrinks = new Set();
    guests.forEach(g => g.drinks.split(',').forEach(d => allDrinks.add(d.trim())));
    const select = document.getElementById('filterDrink');
    select.innerHTML = '<option value="">Все напитки</option>';
    allDrinks.forEach(d => { if(d) { const opt = document.createElement('option'); opt.value = d; opt.textContent = d; select.appendChild(opt); } });
}

// Статистика напитков
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

// Безопасный вывод текста
function escapeHtml(str) {
    return String(str).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
}

// ========== РАССАДКА ГОСТЕЙ ==========
function renderSeatingPlan() {
    const container = document.getElementById('tables-container');
    if (!container) return;

    const rectGuests = guests.filter(g => g.table === 'Стол - 1');

    const roundTableGuests = {};
    tables.forEach(t => roundTableGuests[t.name] = []);
    const unassigned = [];

    guests.forEach(g => {
        if (g.table === 'Стол - 1') return;
        const tableObj = tables.find(t => t.name === g.table);
        if (tableObj) {
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

    const unassignedDiv = document.createElement('div');
    unassignedDiv.className = 'unassigned-guests';
    unassignedDiv.innerHTML = `<h4>Неразмещённые гости (${unassigned.length})</h4>
        <div class="unassigned-list" id="unassigned-list">`;
    unassigned.forEach(g => {
        unassignedDiv.querySelector('.unassigned-list').innerHTML +=
            `<div class="unassigned-guest" draggable="true" data-guest-id="${g.id}">${escapeHtml(g.fio)}</div>`;
    });
    container.appendChild(unassignedDiv);

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

// ========== ПЕРЕТАСКИВАНИЕ ==========
let draggedGuestId = null;

function setupDragAndDrop() {
    const draggables = document.querySelectorAll('[draggable="true"]');
    const dropZones = document.querySelectorAll('.guest-slot');

    draggables.forEach(el => {
        el.addEventListener('dragstart', handleDragStart);
        el.addEventListener('dragend', handleDragEnd);
    });

    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('dragleave', handleDragLeave);
        zone.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    draggedGuestId = this.dataset.guestId;
    this.classList.add('dragging');
    e.dataTransfer.setData('text/plain', draggedGuestId);
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

async function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    const targetSlot = this;
    const targetTableId = targetSlot.dataset.tableId;
    const targetSlotIndex = parseInt(targetSlot.dataset.slot);

    if (!draggedGuestId) return;

    if (targetSlot.classList.contains('occupied') && targetSlot.dataset.guestId !== draggedGuestId) {
        alert('Это место уже занято.');
        return;
    }

    const guest = guests.find(g => g.id === draggedGuestId);
    if (!guest) return;

    let newTableValue = targetTableId === 'rect' ? 'Стол - 1' : targetTableId;

    // Проверка вместимости
    if (targetTableId !== 'rect') {
        const tableObj = tables.find(t => t.name === targetTableId);
        if (tableObj) {
            const currentGuests = guests.filter(g => g.table === targetTableId && g.id !== draggedGuestId).length;
            if (currentGuests >= tableObj.capacity) {
                alert(`Стол "${targetTableId}" полностью заполнен (${tableObj.capacity} мест).`);
                return;
            }
        }
    }

    try {
        await updateGuestOnSheet(draggedGuestId, { table: newTableValue });
        await refreshAll();   // перезагружаем всё
    } catch (err) {
        alert('Ошибка при перемещении гостя.');
    }

    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    draggedGuestId = null;
}

// Функции добавления/обновления/удаления гостей (вызываются из HTML)
async function addGuest() {
    const fio = document.getElementById('newFio').value.trim();
    if (!fio) return alert('Введите ФИО');
    const category = document.getElementById('newCategory').value;
    const age = document.getElementById('newAge').value;
    const drinkChecks = [...document.querySelectorAll('#newDrinksCheck input:checked')].map(cb => cb.value).join(', ');
    const table = document.getElementById('newTable').value;

    try {
        await addGuestToSheet({ fio, category, age, drinks: drinkChecks, table: table || 'Стол-?' });
        document.getElementById('newFio').value = '';
        document.querySelectorAll('#newDrinksCheck input').forEach(cb => cb.checked = false);
        await refreshAll();
    } catch (err) {
        alert('Ошибка при добавлении гостя.');
    }
}

async function updateGuest(id, row) {
    const fields = {};
    row.querySelectorAll('[data-field]').forEach(el => fields[el.dataset.field] = el.value);
    try {
        await updateGuestOnSheet(id, fields);
        await refreshAll();
    } catch (err) {
        alert('Ошибка при обновлении гостя.');
    }
}

async function deleteGuest(id) {
    if (!confirm('Удалить гостя?')) return;
    try {
        await deleteGuestFromSheet(id);
        await refreshAll();
    } catch (err) {
        alert('Ошибка при удалении гостя.');
    }
}
