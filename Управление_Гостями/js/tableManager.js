'use strict';

function getAllTableOptions() {
    const options = ['Стол - 1'];
    return options.concat(tables.map(t => t.name));
}

function populateTableSelects() {
    const allOptions = getAllTableOptions();

    const filterSelect = document.getElementById('filterTable');
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">Все столы</option>';
        allOptions.forEach(optVal => {
            const opt = document.createElement('option');
            opt.value = optVal;
            opt.textContent = optVal;
            filterSelect.appendChild(opt);
        });
    }

    const newTableSelect = document.getElementById('newTable');
    if (newTableSelect) {
        newTableSelect.innerHTML = '<option value="">Не назначен</option>';
        allOptions.forEach(optVal => {
            const opt = document.createElement('option');
            opt.value = optVal;
            opt.textContent = optVal;
            newTableSelect.appendChild(opt);
        });
    }

    const actionSelect = document.getElementById('tableActionSelect');
    if (actionSelect) {
        actionSelect.innerHTML = '<option value="">-- Выберите стол --</option>';
        tables.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.name;
            opt.textContent = `${t.name} (${t.capacity} мест)`;
            actionSelect.appendChild(opt);
        });
    }
}

function addTable() {
    const newTableName = prompt('Введите название нового стола (например, "Стол - 9"):');
    if (!newTableName || !newTableName.trim()) return;
    const trimmed = newTableName.trim();
    if (tables.some(t => t.name === trimmed) || trimmed === 'Стол - 1') {
        alert('Такой стол уже существует или зарезервирован.');
        return;
    }
    tables.push({ name: trimmed, capacity: 10 });
    saveTables();
    populateTableSelects();
    renderSeatingPlan();
    renderTable();
}

function deleteTable() {
    const select = document.getElementById('tableActionSelect');
    const tableToDelete = select.value;
    if (!tableToDelete) return alert('Выберите стол для удаления.');
    if (!tables.some(t => t.name === tableToDelete)) return alert('Стол не найден.');

    if (!confirm(`Удалить стол "${tableToDelete}"? Все гости, сидящие за этим столом, будут помечены как "Стол-?".`)) return;

    guests.forEach(g => {
        if (g.table === tableToDelete) g.table = 'Стол-?';
    });
    saveGuests();

    tables = tables.filter(t => t.name !== tableToDelete);
    saveTables();
    populateTableSelects();
    loadData();
}

function renameTable() {
    const select = document.getElementById('tableActionSelect');
    const oldName = select.value;
    if (!oldName) return alert('Выберите стол для переименования.');
    const tableObj = tables.find(t => t.name === oldName);
    if (!tableObj) return alert('Стол не найден.');

    const newName = prompt(`Введите новое название для стола "${oldName}":`, oldName);
    if (!newName || !newName.trim()) return;
    const trimmed = newName.trim();

    if (trimmed === oldName) return;
    if (trimmed === 'Стол - 1' || tables.some(t => t.name === trimmed)) {
        alert('Это имя уже занято или зарезервировано.');
        return;
    }

    guests.forEach(g => {
        if (g.table === oldName) g.table = trimmed;
    });
    saveGuests();

    tableObj.name = trimmed;
    saveTables();
    populateTableSelects();
    loadData();
}

function changeTableCapacity() {
    const select = document.getElementById('tableActionSelect');
    const tableName = select.value;
    if (!tableName) return alert('Выберите стол для изменения вместимости.');
    const tableObj = tables.find(t => t.name === tableName);
    if (!tableObj) return alert('Стол не найден.');

    const capacitySelect = document.getElementById('capacitySelect');
    const newCapacity = parseInt(capacitySelect.value);

    if (newCapacity < 1 || newCapacity > 10) return alert('Недопустимое количество мест.');

    const guestsAtTable = guests.filter(g => g.table === tableName).length;
    if (guestsAtTable > newCapacity) {
        if (!confirm(`За этим столом уже сидят ${guestsAtTable} гостей. Если уменьшить вместимость до ${newCapacity}, лишние гости станут неразмещёнными. Продолжить?`)) return;
        const guestsToMove = guestsAtTable - newCapacity;
        let moved = 0;
        for (let i = guests.length - 1; i >= 0 && moved < guestsToMove; i--) {
            if (guests[i].table === tableName) {
                guests[i].table = 'Стол-?';
                moved++;
            }
        }
        saveGuests();
    }

    tableObj.capacity = newCapacity;
    saveTables();
    populateTableSelects();
    renderSeatingPlan();
    renderTable();
}