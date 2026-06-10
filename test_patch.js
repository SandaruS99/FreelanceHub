const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/projects/dummyid',
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(JSON.stringify({
  name: "Video Ad",
  startDate: "2026-06-10",
  endDate: "2026-06-13"
}));
req.end();
