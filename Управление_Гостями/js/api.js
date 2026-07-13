const SECRET_KEY = '12345';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxrL11Es8MKs-8WD2X7Wplk_JjzJuZDnrJUkMAWBue30h1z9vPqqEkmwQrpDhIH2utMHA/exec';

// Универсальная функция для GET-запроса
async function fetchData(action, params = {}) {
    const url = new URL(SCRIPT_URL);
    url.searchParams.append('key', SECRET_KEY);
    url.searchParams.append('action', action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
}

// Универсальная функция для POST-запроса (используется для гостей)
async function postData(action, params = {}) {
    const body = new URLSearchParams();
    body.append('key', SECRET_KEY);
    body.append('action', action);
    Object.entries(params).forEach(([k, v]) => body.append(k, v));
    const resp = await fetch(SCRIPT_URL, { method: 'POST', body });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
}

// Гости
async function loadGuests() {
    const data = await fetchData('listGuests');
    return data.guests || [];
}

async function addGuestToSheet(guestData) {
    return postData('addGuest', guestData);
}

async function updateGuestOnSheet(id, fields) {
    return postData('updateGuest', { id, ...fields });
}

async function deleteGuestFromSheet(id) {
    return postData('deleteGuest', { id });
}

// Столы
async function loadTables() {
    const data = await fetchData('listTables');
    return data.tables || [];
}

async function addTableToSheet(name, capacity = 10) {
    return postData('addTable', { name, capacity });
}

async function updateTableOnSheet(oldName, newName, capacity) {
    // oldName — идентификатор, по которому ищем строку
    return postData('updateTable', { oldName, newName, capacity });
}

async function deleteTableFromSheet(name) {
    return postData('deleteTable', { name });
}