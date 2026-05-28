document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('rsvp-form');
    const submitBtn = document.getElementById('submit-btn');
    const successMessage = document.getElementById('success-message');
    const guestsCountSelect = document.getElementById('guests-count');
    const extraGuestsContainer = document.getElementById('extra-guests-container');

    // Генерация полей для дополнительных гостей
    function generateExtraGuestFields(count) {
        extraGuestsContainer.innerHTML = '';
        if (count < 2) return;

        for (let i = 2; i <= count; i++) {
            const block = document.createElement('div');
            block.className = 'extra-guest-block';
            block.innerHTML = `
                <h4>🌸 Гость ${i}</h4>
                <div class="form-group">
                    <label>Имя и фамилия гостя ${i} *</label>
                    <input type="text" class="extra-name" placeholder="Например, Пётр Кузнецов" required>
                </div>
                <div class="form-group">
                    <label>💖 Сможете присутствовать? *</label>
                    <div class="radio-group extra-attendance">
                        <label class="radio-label">
                            <input type="radio" name="extra_attendance_${i}" value="Да" required>
                            <span class="radio-custom"></span>
                            Обязательно буду!
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="extra_attendance_${i}" value="Нет">
                            <span class="radio-custom"></span>
                            К сожалению, не смогу
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label>🥂 Что предпочитаете пить? (можно выбрать несколько)</label>
                    <div class="checkbox-group extra-drink-group">
                        <label class="checkbox-label">
                            <input type="checkbox" class="extra-drink-checkbox" value="Не пью/За рулём">
                            <span class="checkbox-custom"></span>
                            Не пью/За рулём
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="extra-drink-checkbox" value="Вино">
                            <span class="checkbox-custom"></span>
                            Вино
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="extra-drink-checkbox" value="Шампанское">
                            <span class="checkbox-custom"></span>
                            Шампанское
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="extra-drink-checkbox" value="Водка">
                            <span class="checkbox-custom"></span>
                            Водка
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="extra-drink-checkbox" value="Самогон">
                            <span class="checkbox-custom"></span>
                            Самогон
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="extra-drink-checkbox" value="Коньяк">
                            <span class="checkbox-custom"></span>
                            Коньяк
                        </label>
                    </div>
                </div>
            `;
            extraGuestsContainer.appendChild(block);
        }
    }

    guestsCountSelect.addEventListener('change', function() {
        generateExtraGuestFields(parseInt(this.value));
    });

    generateExtraGuestFields(1);

    // Отправка формы
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Собираем напитки основного гостя
        const mainDrinkCheckboxes = document.querySelectorAll('input[name="main-drink"]:checked');
        const mainDrinks = Array.from(mainDrinkCheckboxes).map(cb => cb.value).join(', ') || 'Не пью/За рулём';

        const mainGuest = {
            name: document.getElementById('guest-name').value.trim(),
            attendance: document.querySelector('input[name="attendance"]:checked')?.value,
            drink: mainDrinks,
            wishes: document.getElementById('wishes').value.trim() || '—',
            isMain: true
        };

        if (!mainGuest.name || !mainGuest.attendance) {
            alert('Пожалуйста, заполните обязательные поля: имя и присутствие.');
            return;
        }

        // Дополнительные гости
        const extraGuests = [];
        const extraBlocks = document.querySelectorAll('.extra-guest-block');
        
        for (let block of extraBlocks) {
            const nameInput = block.querySelector('.extra-name');
            const attendanceRadio = block.querySelector('input[type="radio"]:checked');
            const drinkCheckboxes = block.querySelectorAll('.extra-drink-checkbox:checked');
            const drinks = Array.from(drinkCheckboxes).map(cb => cb.value).join(', ') || 'Не пью/За рулём';

            const name = nameInput?.value.trim();
            const attendance = attendanceRadio?.value;

            if (name && !attendance) {
                alert(`Пожалуйста, укажите присутствие для гостя "${name}".`);
                submitBtn.textContent = 'Отправить';
                submitBtn.disabled = false;
                return;
            }
            if (name && attendance) {
                extraGuests.push({
                    name: name,
                    attendance: attendance,
                    drink: drinks,
                    wishes: '—',
                    isMain: false
                });
            }
        }

        const allGuests = [mainGuest, ...extraGuests];

        submitBtn.textContent = 'Отправляем...';
        submitBtn.disabled = true;

        // URL скрипта Google Apps Script
        const scriptURL = 'https://script.google.com/macros/s/AKfycbwql8y-IO3delWBlQ_74pOLi8qDlbHW7uffIrTmxLLZ3k25frrMdSeL1Snp8XaKX1XJ4Q/exec';

        fetch(scriptURL, {
            method: 'POST',
            body: JSON.stringify({ guests: allGuests }),
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
            if (data.result === 'success') {
                form.style.display = 'none';
                successMessage.style.display = 'block';
            } else {
                alert('Что-то пошло не так. Попробуйте ещё раз.');
                submitBtn.textContent = 'Отправить';
                submitBtn.disabled = false;
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
            alert('Ошибка соединения. Проверьте интернет.');
            submitBtn.textContent = 'Отправить';
            submitBtn.disabled = false;
        });
    });
});
