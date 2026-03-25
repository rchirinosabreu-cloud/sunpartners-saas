const axios = require('axios');

async function test() {
  try {
    const hash = 'ed9a0b7120068f52b348e00579c5665fd5a653245f2dd13a1e13f7ab0baf06f4';
    const res = await axios.get(`http://localhost:3001/api/quotations/public/${hash}`);
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('API Error:', err.response?.data || err.message);
  }
}

test();
