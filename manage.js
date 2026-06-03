const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwIj7wp9bqo-bqGpXWii5StnWWNKNsyn1b0wSEeFsyx9wLp1TuFb8ES-dUm9nswjK252g/exec';

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
