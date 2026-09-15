const https = require('https');

https.get('https://noor-dahab.vercel.app/login', (res) => {
  console.log('Headers:', res.headers);
});
