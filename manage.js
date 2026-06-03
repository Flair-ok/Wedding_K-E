const SCRIPT_URL = 'https://script.google.com/macros/library/d/1ZUxii379xMHmnhJr6VJ3RT3KBUkKxPHKJ4Ume8vT_TT5Qk1dSjUCqWUK/5'; // ← вставь скопированный URL

async function test() {
  try {
    const resp = await fetch(SCRIPT_URL, {
      method: 'GET',
      credentials: 'omit'
    });
    const data = await resp.json();
    console.log('Успех!', data);
    alert('Связь установлена!');
  } catch (err) {
    console.error('Ошибка:', err);
    alert('Ошибка соединения: ' + err.message);
  }
}

test();
