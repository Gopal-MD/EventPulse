const autocannon = require('autocannon');
const app = require('../../backend/server');

let server;

function runLoad(url) {
  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url,
      connections: 4,
      amount: 80,
      timeout: 5,
      headers: {
        'Content-Type': 'application/json',
      },
    }, (err, result) => {
      if (err) return reject(err);
      return resolve(result);
    });

    autocannon.track(instance, { renderProgressBar: false, renderLatencyTable: true, renderResultsTable: true });
  });
}

(async () => {
  try {
    server = await new Promise((resolve, reject) => {
      const s = app.listen(0, () => resolve(s));
      s.on('error', reject);
    });

    const port = server.address().port;
    const targetUrl = `http://127.0.0.1:${port}/api/state`;
    console.log('[LoadTest] Starting /api/state load test...');
    const result = await runLoad(targetUrl);

    const avgLatency = result.latency?.average || result.latency?.mean || 0;
    const errors = result.errors || 0;
    const non2xx = result.non2xx || 0;

    console.log(`[LoadTest] Requests: ${result.requests.total}, Errors: ${errors}, Non2xx: ${non2xx}, avg latency: ${avgLatency} ms`);

    if (errors > 0) {
      console.error('[LoadTest] Failed: non-zero errors detected.');
      server.close();
      process.exit(1);
    }

    if (non2xx > 0) {
      console.error('[LoadTest] Failed: non-2xx responses detected under lightweight load.');
      server.close();
      process.exit(1);
    }

    console.log('[LoadTest] PASS: API stayed stable under lightweight load.');
    server.close();
    process.exit(0);
  } catch (error) {
    console.error('[LoadTest] Execution error:', error.message);
    if (server) server.close();
    process.exit(1);
  }
})();
