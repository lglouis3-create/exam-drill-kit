// ---- Added 2026-11-05: quota-failure and interrupted-upgrade steps. ----
// These functions touch only the databases "proto-quota", "proto-quota2" and "proto-upgrade".
// Loaded by manual-plus.html after manual.html's own script, whose out() it uses.
// The automated drivers proto/quota.js and proto/upgrade.js call these same functions on that page.
const QDB = 'proto-quota', QDB2 = 'proto-quota2', UDB = 'proto-upgrade';

function txDone(tx) {
  return new Promise((res) => {
    tx.oncomplete = () => res({ result: 'complete' });
    tx.onabort = () => res({ result: 'abort', error: tx.error ? tx.error.name : null,
      message: tx.error ? String(tx.error.message).slice(0, 200) : null });
  });
}
function openNamed(name, version, upgrade, onVersionChange = 'close') {
  return new Promise((res, rej) => {
    const r = version ? indexedDB.open(name, version) : indexedDB.open(name);
    r.onupgradeneeded = (e) => { if (upgrade) upgrade(r.result, r.transaction, e); };
    r.onblocked = () => { window.__events = (window.__events || []).concat('blocked'); };
    r.onsuccess = () => {
      const db = r.result;
      db.onversionchange = (e) => {
        window.__events = (window.__events || []).concat('versionchange ' + e.oldVersion + '->' + e.newVersion);
        if (onVersionChange === 'close') db.close();
      };
      res(db);
    };
    r.onerror = () => rej(r.error);
  });
}
function deleteDB(name) {
  return new Promise((res) => {
    const r = indexedDB.deleteDatabase(name);
    let blocked = false;
    r.onblocked = () => { blocked = true; };
    r.onsuccess = () => res(blocked ? 'deleted after blocked' : 'deleted');
    r.onerror = () => res('error ' + (r.error && r.error.name));
  });
}
async function estimate() {
  try {
    if (!navigator.storage || !navigator.storage.estimate) return 'no navigator.storage.estimate';
    const e = await navigator.storage.estimate();
    return { usageMB: +(e.usage / 1048576).toFixed(2), quotaMB: +(e.quota / 1048576).toFixed(2) };
  } catch (e) { return 'estimate threw ' + e.name; }
}
// A record of `size` bytes of pseudo-random (incompressible) data with a checksum.
function makeRec(n, size) {
  const data = new Uint8Array(size);
  let x = (Math.imul(n + 1, 2654435761) >>> 0) || 1;
  for (let k = 0; k < size; k += 4) {
    x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0;
    data[k] = x & 255; data[k + 1] = (x >>> 8) & 255; data[k + 2] = (x >>> 16) & 255; data[k + 3] = x >>> 24;
  }
  return { n, size, sum: sumOf(data), data };
}
function sumOf(data) { let s = 0; for (let k = 0; k < data.length; k++) s = (Math.imul(s, 31) + data[k]) >>> 0; return s; }
function recIntact(rec, want) {
  return !!rec && rec.data instanceof Uint8Array && rec.data.length === want.size && rec.size === want.size && sumOf(rec.data) === want.sum;
}
async function getMany(db, store, keys) {
  const tx = db.transaction(store, 'readonly');
  const st = tx.objectStore(store);
  const out = {};
  for (const k of keys) { const r = st.get(k); r.onsuccess = () => { out[k] = r.result; }; }
  await txDone(tx);
  return out;
}

// Q1: write ever larger records until a transaction is refused. Each transaction first puts a
// 1 KB record "pre-<n>", then the large record "big-<n>", so a partial commit would show "pre-<n>".
async function quotaFill(o = {}) {
  const start = o.start || 262144, factor = o.factor || 2, maxRec = o.maxRecord || (32 << 20);
  const ceiling = o.ceiling || (1024 << 20), progress = o.progress || (() => {});
  await deleteDB(QDB);
  const out = { db: QDB, estimateBefore: await estimate() };
  let db = await openNamed(QDB, 1, (d) => d.createObjectStore('q'));
  const committed = [];
  const base = makeRec(0, 1024);
  let t = db.transaction('q', 'readwrite'); t.objectStore('q').put(base, 'base');
  out.baseline = (await txDone(t)).result;
  committed.push({ key: 'base', size: 1024, sum: base.sum });
  let size = start, total = 1024, n = 0;
  while (total < ceiling) {
    n++;
    const pre = makeRec(100000 + n, 1024), big = makeRec(n, size);
    const tx = db.transaction('q', 'readwrite');
    let putThrew = null;
    try { tx.objectStore('q').put(pre, 'pre-' + n); tx.objectStore('q').put(big, 'big-' + n); }
    catch (e) { putThrew = e.name; }
    const r = await txDone(tx);
    if (r.result === 'complete' && !putThrew) {
      committed.push({ key: 'pre-' + n, size: 1024, sum: pre.sum }, { key: 'big-' + n, size, sum: big.sum });
      total += size + 1024;
      progress('committed transaction ' + n + ': ' + (size / 1048576).toFixed(2) + ' MB; total ' + (total / 1048576).toFixed(2) + ' MB');
      size = Math.min(size * factor, maxRec);
      continue;
    }
    out.refused = { transaction: n, recordMB: +(size / 1048576).toFixed(3), putThrew, result: r.result, error: r.error, message: r.message,
      committedBeforeMB: +(total / 1048576).toFixed(3), committedTransactionsBefore: n - 1 };
    break;
  }
  if (!out.refused) out.refused = 'none: stopped at the ceiling of ' + (ceiling / 1048576) + ' MB without a refusal';
  out.committedRecords = committed.length;
  if (typeof out.refused === 'object') {
    const back = await getMany(db, 'q', ['pre-' + n, 'big-' + n]);
    out.failedTxPreStored = back['pre-' + n] !== undefined;
    out.failedTxBigStored = back['big-' + n] !== undefined;
  }
  // earlier committed data, read in this connection and again after reopening
  const check = async (d) => { const got = await getMany(d, 'q', committed.map((c) => c.key)); return committed.filter((c) => recIntact(got[c.key], c)).length; };
  out.intactSameConnection = (await check(db)) + ' of ' + committed.length;
  db.close();
  db = await openNamed(QDB, 1);
  out.intactAfterReopen = (await check(db)) + ' of ' + committed.length;
  // later, smaller transactions
  const small = makeRec(200000, 1024);
  t = db.transaction('q', 'readwrite'); t.objectStore('q').put(small, 'after-small');
  const rs = await txDone(t);
  out.laterSmall1KB = rs.result + (rs.error ? ' ' + rs.error : '');
  if (typeof out.refused === 'object') {
    const halfSize = Math.max(1024, Math.floor(out.refused.recordMB * 1048576 / 2));
    t = db.transaction('q', 'readwrite'); t.objectStore('q').put(makeRec(200001, halfSize), 'after-half');
    const rh = await txDone(t);
    out.laterHalfOfRefused = (halfSize / 1048576).toFixed(3) + ' MB: ' + rh.result + (rh.error ? ' ' + rh.error : '');
  }
  out.intactAfterLaterWrites = (await check(db)) + ' of ' + committed.length;
  out.estimateAfter = await estimate();
  db.close();
  window.__lastRefusedBytes = typeof out.refused === 'object' ? Math.round(out.refused.recordMB * 1048576) : null;
  return out;
}

// Q2: one transaction over two stores ("progress" and "log"): progress rev 1 -> 2 plus a log entry of
// bigBytes. Run in both orders. If the log entry is refused, progress must still read rev 1.
async function quotaPair(bigBytes) {
  await deleteDB(QDB2);
  const out = { db: QDB2, bigMB: +(bigBytes / 1048576).toFixed(3) };
  const db = await openNamed(QDB2, 1, (d) => { d.createObjectStore('progress'); d.createObjectStore('log'); });
  let t = db.transaction(['progress', 'log'], 'readwrite');
  t.objectStore('progress').put({ rev: 1 }, 'me'); t.objectStore('log').put({ seq: 1, note: 'baseline' }, 1);
  out.baseline = (await txDone(t)).result;
  const readBoth = async () => {
    const tx = db.transaction(['progress', 'log'], 'readonly');
    const p = tx.objectStore('progress').get('me'), k = tx.objectStore('log').getAllKeys();
    await txDone(tx);
    return { rev: p.result ? p.result.rev : null, logKeys: k.result };
  };
  for (const order of ['progress first', 'log first']) {
    const big = makeRec(300000, bigBytes);
    t = db.transaction(['progress', 'log'], 'readwrite');
    let putThrew = null;
    try {
      if (order === 'progress first') { t.objectStore('progress').put({ rev: 2 }, 'me'); t.objectStore('log').put({ seq: 2, big }, 2); }
      else { t.objectStore('log').put({ seq: 2, big }, 2); t.objectStore('progress').put({ rev: 2 }, 'me'); }
    } catch (e) { putThrew = e.name; }
    const r = await txDone(t);
    out[order] = { result: r.result, error: r.error, putThrew, after: await readBoth() };
  }
  t = db.transaction(['progress', 'log'], 'readwrite');
  t.objectStore('progress').put({ rev: 2 }, 'me'); t.objectStore('log').put({ seq: 2, note: 'small' }, 2);
  const rs = await txDone(t);
  out.laterSmallBoth = { result: rs.result, error: rs.error, after: await readBoth() };
  db.close();
  return out;
}
async function quotaCleanup() { return { [QDB]: await deleteDB(QDB), [QDB2]: await deleteDB(QDB2), estimate: await estimate() }; }

// U: a slow upgrade from v1 to v2 that copies "items" into a new store "items2" in chunks.
// The upgrade transaction must stay busy during the gap (a timer would let it commit), so the gap
// is filled with chained count() requests.
async function upSetup(n = 2000, size = 1024) {
  await deleteDB(UDB);
  const db = await openNamed(UDB, 1, (d) => d.createObjectStore('items'));
  const tx = db.transaction('items', 'readwrite');
  const st = tx.objectStore('items');
  for (let i = 0; i < n; i++) { const r = makeRec(i, size); st.put({ i, size, sum: r.sum, data: r.data }, i); }
  const r = await txDone(tx);
  const v = db.version; db.close();
  return { db: UDB, version: v, items: n, write: r.result };
}
function upSlow(chunk = 100, gapMs = 1500, version = 2) {
  window.__up = { state: 'requested', copied: 0, chunks: 0, events: [] };
  const U = window.__up;
  const r = indexedDB.open(UDB, version);
  r.onblocked = (e) => { U.events.push('blocked ' + e.oldVersion + '->' + e.newVersion); };
  r.onupgradeneeded = (e) => {
    const db = r.result, tx = r.transaction;
    U.state = 'upgrading ' + e.oldVersion + '->' + e.newVersion;
    U.events.push('upgradeneeded ' + e.oldVersion + '->' + e.newVersion);
    tx.onabort = () => { U.events.push('upgrade transaction abort ' + (tx.error && tx.error.name)); };
    tx.oncomplete = () => { U.events.push('upgrade transaction complete'); };
    const dst = db.createObjectStore('items2');
    const src = tx.objectStore('items');
    let next = 0;
    const step = () => {
      const q = src.getAll(IDBKeyRange.lowerBound(next), chunk);
      q.onsuccess = () => {
        const rows = q.result;
        if (!rows.length) { U.state = 'copy finished, committing'; return; }
        for (const v of rows) dst.put(v, v.i);
        next = rows[rows.length - 1].i + 1; U.copied += rows.length; U.chunks++;
        console.log('UP copied ' + U.copied);
        const t0 = Date.now();
        const spin = () => { const g = src.count(); g.onsuccess = () => { if (Date.now() - t0 < gapMs) spin(); else step(); }; };
        spin();
      };
    };
    step();
  };
  r.onsuccess = () => { const db = r.result; U.state = 'opened v' + db.version; db.onversionchange = () => db.close(); U.db = db; console.log('UP opened v' + db.version); };
  r.onerror = () => { U.state = 'error ' + (r.error && r.error.name); console.log('UP error ' + (r.error && r.error.name)); };
  return 'started';
}
function upState() { const U = window.__up || {}; return { state: U.state, copied: U.copied, chunks: U.chunks, events: U.events }; }
async function upCheck() {
  const out = {};
  if (indexedDB.databases) { try { const l = await indexedDB.databases(); const m = l.find((d) => d.name === UDB); out.listedVersion = m ? m.version : 'not listed'; } catch (e) { out.listedVersion = 'databases() threw ' + e.name; } }
  const db = await openNamed(UDB);   // no version: opens the current one
  out.version = db.version;
  out.stores = Array.from(db.objectStoreNames);
  if (out.stores.includes('items')) {
    const tx = db.transaction('items', 'readonly');
    const all = tx.objectStore('items').getAll();
    await txDone(tx);
    out.items = all.result.length;
    out.itemsIntact = all.result.filter((v) => v.data && v.data.length === v.size && sumOf(v.data) === v.sum).length;
  }
  if (out.stores.includes('items2')) {
    const tx = db.transaction('items2', 'readonly'); const c = tx.objectStore('items2').count(); await txDone(tx); out.items2 = c.result;
  }
  db.close();
  return out;
}
async function upFinish(version = 2) {
  const ev = [];
  const db = await openNamed(UDB, version, (d, tx, e) => {
    ev.push('upgradeneeded ' + e.oldVersion + '->' + e.newVersion);
    const dst = d.createObjectStore('items2');
    const q = tx.objectStore('items').getAll();
    q.onsuccess = () => { for (const v of q.result) dst.put(v, v.i); };
  });
  const v = db.version; db.close();
  return Object.assign({ openedVersion: v, events: ev }, await upCheck());
}
// An "old-core" tab: hold v1 open; policy 'keep' ignores versionchange, 'close' closes on it.
async function upHold(policy = 'keep') {
  window.__events = [];
  window.__hold = await openNamed(UDB, 1, null, policy);
  return 'holding v' + window.__hold.version + ' policy=' + policy;
}
function upHoldWrite() {
  try { const tx = window.__hold.transaction('items', 'readonly'); return 'transaction created (' + tx.mode + ')'; }
  catch (e) { return 'threw ' + e.name; }
}
function upHoldReopen(version = 1) {
  window.__reopen = 'requested';
  const t0 = Date.now();
  const r = indexedDB.open(UDB, version);
  r.onsuccess = () => { window.__reopen = 'opened v' + r.result.version + ' after ' + (Date.now() - t0) + ' ms'; r.result.onversionchange = () => r.result.close(); };
  r.onerror = () => { window.__reopen = 'error ' + (r.error && r.error.name) + ' after ' + (Date.now() - t0) + ' ms'; };
  r.onupgradeneeded = () => { window.__reopen = 'upgradeneeded (unexpected)'; };
  return 'requested';
}
function upHoldState() { return { events: window.__events || [], reopen: window.__reopen }; }

const setStatus = (t) => { document.getElementById('status').textContent = t; };
const J = (x) => JSON.stringify(x);
document.getElementById('qfill').onclick = async () => {
  out('Fill until refused started. It writes records of 1, 2, 4, ... 32 MB and stops at the first refusal or at 1,024 MB.');
  try { const r = await quotaFill({ start: 1 << 20, factor: 2, maxRecord: 32 << 20, ceiling: 1024 << 20, progress: setStatus }); setStatus('idle'); out('Fill: ' + J(r)); }
  catch (e) { setStatus('idle'); out('Fill failed: ' + e.name + ' ' + e.message); }
};
document.getElementById('qpair').onclick = async () => {
  if (!window.__lastRefusedBytes) { out('Both stores: press Fill until refused first (it found no refused size in this tab).'); return; }
  try { out('Both stores: ' + J(await quotaPair(window.__lastRefusedBytes))); } catch (e) { out('Both stores failed: ' + e.name + ' ' + e.message); }
};
document.getElementById('qclean').onclick = async () => { try { out('Delete quota test data: ' + J(await quotaCleanup())); } catch (e) { out('Delete failed: ' + e.name); } };
document.getElementById('uprep').onclick = async () => { try { out('Prepare v1: ' + J(await upSetup(2000, 1024))); } catch (e) { out('Prepare failed: ' + e.name + ' ' + e.message); } };
document.getElementById('ustart').onclick = () => {
  upSlow(100, 1500, 2);
  out('Slow upgrade started (2,000 records in 20 chunks, 1.5 s apart). Close this tab while the status shows "upgrading".');
  const iv = setInterval(() => { const s = upState(); setStatus(s.state + ', copied ' + s.copied + ', events ' + J(s.events)); if (/^opened|^error/.test(s.state)) { clearInterval(iv); out('Slow upgrade ended: ' + J(s)); } }, 300);
};
document.getElementById('ucheck').onclick = async () => { try { out('Upgrade check: ' + J(await upCheck())); } catch (e) { out('Check failed: ' + e.name + ' ' + e.message); } };
document.getElementById('ufinish').onclick = async () => { try { out('Upgrade finish: ' + J(await upFinish(2))); } catch (e) { out('Finish failed: ' + e.name + ' ' + e.message); } };
document.getElementById('uhold').onclick = async () => { try { out('Old tab: ' + await upHold('keep')); } catch (e) { out('Hold failed: ' + e.name + ' ' + e.message); } };
document.getElementById('uholdstate').onclick = () => { out('Old tab state: ' + J(upHoldState())); };
