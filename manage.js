const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyA5H2hOA_D9zlqv0KBQCzcokfBfWS70BCuwFmoxGbF1PKGFzd3eMw_Jmcpf3jYDiHSeg/exec';

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
