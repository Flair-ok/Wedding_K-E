'use strict';

const STORAGE_KEY_GUESTS = 'localWeddingGuests';
const STORAGE_KEY_TABLES = 'localWeddingTables_v2';

const DEFAULT_TABLES = [
    { name: 'Стол - 2', capacity: 10 },
    { name: 'Стол - 3', capacity: 10 },
    { name: 'Стол - 4', capacity: 10 },
    { name: 'Стол - 5', capacity: 10 },
    { name: 'Стол - 6', capacity: 10 },
    { name: 'Стол - 7', capacity: 10 },
    { name: 'Стол - 8', capacity: 10 }
];

function loadFromStorage(key, defaultValue) {
    const stored = localStorage.getItem(key);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
                return parsed.map(name => ({ name, capacity: 10 }));
            }
            return parsed;
        } catch (e) {}
    }
    return defaultValue;
}

function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

let guests = loadFromStorage(STORAGE_KEY_GUESTS, []);
let tables = loadFromStorage(STORAGE_KEY_TABLES, DEFAULT_TABLES);

function saveGuests() { saveToStorage(STORAGE_KEY_GUESTS, guests); }
function saveTables() { saveToStorage(STORAGE_KEY_TABLES, tables); }

function loadData() {
    guests = loadFromStorage(STORAGE_KEY_GUESTS, []);
    tables = loadFromStorage(STORAGE_KEY_TABLES, DEFAULT_TABLES);
    renderTable();
    renderSeatingPlan();
    populateTableSelects();
}

document.addEventListener('DOMContentLoaded', async () => {
    await refreshAll();
    setupSortListeners();   // <-- добавь эту строку
    document.getElementById('filterCategory').addEventListener('change', renderTable);
    document.getElementById('filterAge').addEventListener('change', renderTable);
    document.getElementById('filterDrink').addEventListener('change', renderTable);
    document.getElementById('filterTable').addEventListener('change', renderTable);
});
