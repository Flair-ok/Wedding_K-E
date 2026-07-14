'use strict';

// Вспомогательная функция: получить список названий столов (включая Стол - 1)
function getAllTableOptions() {
    const options = ['Стол - 1'];
    return options.concat(tables.map(t => t.name));
}

// Обновление всех выпадающих списков со столами
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

// Добавление стола через API
async function addTable() {
    const newTableName = prompt('Введите название нового стола (например, "Стол - 9"):');
    if (!newTableName || !newTableName.trim()) return;
    const trimmed = newTableName.trim();
    if (tables.some(t => t.name === trimmed) || trimmed === 'Стол - 1') {
        alert('Такой стол уже существует или зарезервирован.');
        return;
    }
    try {
        await addTableToSheet(trimmed, 10);   // API-запрос
        await refreshAll();                  // перезагружаем guests и tables, перерисовываем
    } catch (err) {
        alert('Ошибка при добавлении стола.');
    }
}

// Удаление стола через API
async function deleteTable() {
    const select = document.getElementById('tableActionSelect');
    const tableToDelete = select.value;
    if (!tableToDelete) return alert('Выберите стол для удаления.');
    if (!tables.some(t => t.name === tableToDelete)) return alert('Стол не найден.');

    if (!confirm(`Удалить стол "${tableToDelete}"? Все гости, сидящие за этим столом, будут помечены как "Стол-?".`)) return;

    try {
        await deleteTableFromSheet(tableToDelete);  // API удаляет стол и обновляет гостей
        await refreshAll();
    } catch (err) {
        alert('Ошибка при удалении стола.');
    }
}

// Переименование стола через API
async function renameTable() {
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

    try {
        await updateTableOnSheet(oldName, trimmed, null);   // null – не меняем capacity
        await refreshAll();
    } catch (err) {
        alert('Ошибка при переименовании стола.');
    }
}

// Изменение вместимости стола через API
async function changeTableCapacity() {
    const select = document.getElementById('tableActionSelect');
    const tableName = select.value;
    if (!tableName) return alert('Выберите стол для изменения вместимости.');
    const tableObj = tables.find(t => t.name === tableName);
    if (!tableObj) return alert('Стол не найден.');

    const capacitySelect = document.getElementById('capacitySelect');
    const newCapacity = parseInt(capacitySelect.value);

    if (newCapacity < 1 || newCapacity > 10) return alert('Недопустимое количество мест.');

    // Предупреждение, если гостей больше новой вместимости
    const guestsAtTable = guests.filter(g => g.table === tableName).length;
    if (guestsAtTable > newCapacity) {
        if (!confirm(`За этим столом уже сидят ${guestsAtTable} гостей. Если уменьшить вместимость до ${newCapacity}, лишние гости станут неразмещёнными. Продолжить?`)) return;
    }

    try {
        await updateTableOnSheet(tableName, null, newCapacity);   // API обновит capacity
        await refreshAll();
    } catch (err) {
        alert('Ошибка при изменении вместимости.');
    }
}

// Основная функция обновления данных с сервера
async function refreshAll() {
    guests = await loadGuests();   // загружаем гостей из Google Sheets
    tables = await loadTables();   // загружаем столы из Google Sheets
    renderTable();                 // перерисовываем таблицу и рассадку
    populateTableSelects();        // обновляем выпадающие списки столов
}
