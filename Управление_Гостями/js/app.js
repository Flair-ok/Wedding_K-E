'use strict';

// Глобальные переменные для хранения данных
let guests = [];
let tables = [];

// При загрузке страницы подгружаем данные и навешиваем обработчики
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await refreshAll();   // первая загрузка
    } catch (e) {
        console.error('Ошибка загрузки данных:', e);
    }
    // Сортировка по заголовкам (функция должна быть в ui.js)
    if (typeof setupSortListeners === 'function') {
        setupSortListeners();
    }
    // Обработчики фильтров
    document.getElementById('filterCategory').addEventListener('change', renderTable);
    document.getElementById('filterAge').addEventListener('change', renderTable);
    document.getElementById('filterDrink').addEventListener('change', renderTable);
    document.getElementById('filterTable').addEventListener('change', renderTable);
});
