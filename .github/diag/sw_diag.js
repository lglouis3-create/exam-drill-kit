
/* ===== DIAGNOSIS ONLY (branch claude/elegant-ptolemy-pqxb8y-webkit-diag) =====
   Appended by .github/diag/run.sh to the sw.js the build wrote in a scratch course;
   never part of the kit's core. It records, in the cache "diag-log", what the worker
   saw and did, so the test can read it after each phase:
     - every fetch event for a navigation (its URL, mode, client ids);
     - for the drill page: whether a saved copy was there (and its ETag), when the
       network answered, whether the NET_TIMEOUT timer fired, which side won the race,
       and what the worker served;
     - install and activate.
   openDrill below is the core's own (core/sw.js) with log lines added and nothing
   else changed; as a later function declaration in the same script it is the one the
   fetch handler calls. Each log write is in event.waitUntil, after respondWith has its
   promise, so the logging does not delay the response. */
const DIAG_T0 = Date.now();
function diagLog(rec){
  rec.swAge = Date.now() - DIAG_T0;
  return caches.open('diag-log')
    .then((c) => c.put('/diag-log/' + Date.now() + '-' + Math.random().toString(36).slice(2), new Response(JSON.stringify(rec))))
    .catch(() => {});
}
self.addEventListener('install', (e) => { e.waitUntil(diagLog({kind: 'install', at: Date.now()})); });
self.addEventListener('activate', (e) => { e.waitUntil(diagLog({kind: 'activate', at: Date.now()})); });
self.addEventListener('fetch', (event) => {
  const r = event.request;
  if (r.mode === 'navigate') event.waitUntil(diagLog({kind: 'fetch-event', at: Date.now(), url: r.url, mode: r.mode,
    clientId: event.clientId || '', resultingClientId: event.resultingClientId || ''}));
});
async function openDrill(event) {
  const rec = {kind: 'openDrill', at: Date.now(), url: event.request.url};
  const t0 = Date.now();
  const cache = await caches.open(CACHE);
  const saved = await cache.match(INDEX);
  rec.saved = !!saved; rec.savedEtag = saved ? saved.headers.get('etag') : null; rec.cacheReadMs = Date.now() - t0;

  const fromNetwork = fetch(INDEX, { cache: 'no-cache' }).then(async (res) => {
    rec.networkMs = Date.now() - t0; rec.networkStatus = res ? res.status : null; rec.networkEtag = res ? res.headers.get('etag') : null;
    if (res && res.ok) await cache.put(INDEX, res.clone());
    return res;
  }, (e) => { rec.networkMs = Date.now() - t0; rec.networkError = String(e); throw e; });

  if (!saved) { rec.served = 'network (no saved copy)'; event.waitUntil(fromNetwork.catch(() => {}).then(() => diagLog(rec))); return fromNetwork; }

  try {
    const winner = await Promise.race([
      fromNetwork,
      new Promise((resolve) => setTimeout(() => { rec.timeoutFiredMs = Date.now() - t0; resolve('timeout'); }, NET_TIMEOUT)),
    ]);
    rec.raceMs = Date.now() - t0; rec.winner = winner === 'timeout' ? 'timeout' : 'network';
    if (winner !== 'timeout' && winner.ok) { rec.served = 'network'; event.waitUntil(diagLog(rec)); return winner; }
  } catch (e) {
    rec.raceMs = Date.now() - t0; rec.winner = 'network error'; rec.raceError = String(e);
  }

  rec.served = 'saved';
  event.waitUntil(fromNetwork
    .then((res) => { if (res && res.ok && differs(res, saved)) { rec.toldUpdated = true; return tellUpdated(event); } })
    .catch(() => {})
    .then(() => diagLog(rec)));
  return saved;
}
