const { sort, sortByKey, numericSort, cleanSort, sortWithComparator } = require('../src/index.js');
let pass = 0, fail = 0;
function ok(n, c) { if (c) pass++; else { fail++; console.log(`  ✗ ${n}`); } }
function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function sorted(a) { for (let i = 1; i < a.length; i++) if (a[i] < a[i-1]) return false; return true; }
function sameElements(a, b) {
  if (a.length !== b.length) return false;
  const sa = a.slice().sort((x,y) => x-y);
  const sb = b.slice().sort((x,y) => x-y);
  for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return false;
  return true;
}

// ── Basic ──
ok('empty', eq(sort([]), []));
ok('single', eq(sort([42]), [42]));
ok('two', eq(sort([2, 1]), [1, 2]));
ok('reversed', eq(sort([3, 2, 1]), [1, 2, 3]));
ok('negatives', eq(sort([-3, 1, -1, 0]), [-3, -1, 0, 1]));
ok('all same', eq(sort([5, 5, 5]), [5, 5, 5]));

// ── Floats (FIX 6: comprehensive coverage) ──
ok('basic floats', eq(sort([3.14, 1.41, 2.72]), [1.41, 2.72, 3.14]));
ok('negative floats', (() => {
  const r = sort([-5.5, -1.1, -3.3, -0.5]);
  return eq(r, [-5.5, -3.3, -1.1, -0.5]);
})());
ok('mixed pos/neg floats', (() => {
  const r = sort([-100.5, 50.2, -0.001, 0, 0.001, 100.5]);
  return eq(r, [-100.5, -0.001, 0, 0.001, 50.2, 100.5]);
})());
ok('+0 vs -0', (() => {
  const r = sort([0, -0, 1, -1]);
  return sorted(r) && r.length === 4;
})());
ok('Infinity', (() => {
  const r = sort([Infinity, 1, -Infinity, 0, Infinity]);
  return r[0] === -Infinity && r[r.length - 1] === Infinity && sorted(r);
})());
ok('subnormal floats', (() => {
  const r = sort([5e-324, 1e-323, 2e-323, Number.MIN_VALUE]);
  return sorted(r) && r.length === 4;
})());
ok('close floats', (() => {
  const data = Array.from({length: 1000}, () => 1.0 + Math.random() * 1e-10);
  const r = sort(data);
  return sorted(r) && sameElements(r, data);
})());
ok('all negative floats 10K', (() => {
  const data = Array.from({length: 10000}, () => -Math.random() * 1000);
  const r = sort(data);
  return sorted(r) && sameElements(r, data);
})());
ok('mixed int+float', (() => {
  const r = sort([3, 1.5, 2, 0.5, 4]);
  return eq(r, [0.5, 1.5, 2, 3, 4]);
})());
ok('large floats', (() => {
  const r = sort([1e200, 1e100, 1e300, 1e50]);
  return eq(r, [1e50, 1e100, 1e200, 1e300]);
})());
ok('tiny floats', (() => {
  const r = sort([1e-300, 1e-200, 1e-100]);
  return eq(r, [1e-300, 1e-200, 1e-100]);
})());
ok('50K random floats', (() => {
  const data = Array.from({length: 50000}, () => Math.random() * 2e6 - 1e6);
  const r = sort(data);
  return sorted(r) && sameElements(r, data);
})());

// ── FIX 1: Integers outside Int32 range ──
ok('int > 2^31', (() => {
  const data = [2147483648, 1, 2147483649, 0]; // 2^31 and 2^31+1
  const r = sort(data);
  return eq(r, [0, 1, 2147483648, 2147483649]);
})());
ok('int < -2^31', (() => {
  const data = [-2147483649, 1, -2147483650, 0];
  const r = sort(data);
  return eq(r, [-2147483650, -2147483649, 0, 1]);
})());
ok('MAX_SAFE_INTEGER', (() => {
  const data = [Number.MAX_SAFE_INTEGER, 1, Number.MAX_SAFE_INTEGER - 1, 0];
  const r = sort(data);
  return sorted(r) && r[0] === 0 && r[3] === Number.MAX_SAFE_INTEGER;
})());

// ── Large scale integers ──
for (const n of [100, 1000, 10000, 50000]) {
  const d = Array.from({length: n}, () => Math.floor(Math.random() * n * 10));
  const r = sort(d), e = d.slice().sort((a, b) => a - b);
  let o = r.length === e.length;
  if (o) for (let i = 0; i < r.length; i++) if (r[i] !== e[i]) { o = false; break; }
  ok(`int n=${n}`, o);
}

// ── Stability ──
ok('stable objects', (() => {
  const objs = [{n:'A',v:2},{n:'B',v:1},{n:'C',v:2},{n:'D',v:1}];
  const s = sortByKey(objs, x => x.v);
  return s[0].n==='B' && s[1].n==='D' && s[2].n==='A' && s[3].n==='C';
})());

// ── Other APIs ──
ok('comparator desc', eq(sort([5, 3, 8], (a, b) => b - a), [8, 5, 3]));
ok('strings', eq(sort(['c', 'a', 'b']), ['a', 'b', 'c']));
ok('NaN', cleanSort([3, NaN, 1]).slice(0, 2).join(',') === '1,3');
ok('immutable', (() => { const o = [3, 1, 2]; sort(o); return eq(o, [3, 1, 2]); })());

// ── Reverse option ──
ok('reverse numbers', eq(sort([3, 1, 4, 1, 5], { reverse: true }), [5, 4, 3, 1, 1]));
ok('reverse strings', eq(sort(['b', 'a', 'c'], { reverse: true }), ['c', 'b', 'a']));
ok('reverse with key', eq(sort([{v:3},{v:1},{v:2}], { key: x => x.v, reverse: true }).map(x => x.v), [3, 2, 1]));

// ── String shortcuts ──
ok('sort desc string', eq(sort([3, 1, 4], 'desc'), [4, 3, 1]));
ok('sort asc string', eq(sort([3, 1, 4], 'asc'), [1, 3, 4]));
ok('sortByKey string key', eq(sortByKey([{p:3},{p:1},{p:2}], 'p').map(x => x.p), [1, 2, 3]));
ok('sort key string option', eq(sort([{p:3},{p:1}], { key: 'p' }).map(x => x.p), [1, 3]));

// ── sortByKey: wide-range integer keys (radix path) ──
ok('sortByKey wide-range ints', (() => {
  const arr = Array.from({length: 5000}, (_, i) => ({ id: i, v: Math.floor(Math.random() * 2e9) - 1e9 }));
  const r = sortByKey(arr, 'v');
  for (let i = 1; i < r.length; i++) if (r[i].v < r[i-1].v) return false;
  return true;
})());
ok('sortByKey wide negative ints', (() => {
  const arr = [{v:-1000000},{v:-1},{v:-500000},{v:0},{v:-999999}];
  const r = sortByKey(arr, x => x.v);
  return eq(r.map(x => x.v), [-1000000, -999999, -500000, -1, 0]);
})());
ok('sortByKey wide stability', (() => {
  const arr = Array.from({length: 2000}, (_, i) => ({ k: (i % 200) * 100000, idx: i }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  const inputPos = new Map(); arr.forEach((v, i) => inputPos.set(v, i));
  const r = sortByKey(arr, x => x.k);
  for (let i = 1; i < r.length; i++) {
    if (r[i].k === r[i-1].k && inputPos.get(r[i]) < inputPos.get(r[i-1])) return false;
  }
  return true;
})());

// ── sortByKey: float keys (float radix path) ──
ok('sortByKey float keys', (() => {
  const arr = Array.from({length: 1000}, () => ({ v: Math.random() * 1000 - 500 }));
  const r = sortByKey(arr, x => x.v);
  for (let i = 1; i < r.length; i++) if (r[i].v < r[i-1].v) return false;
  return true;
})());
ok('sortByKey float negative keys', (() => {
  const arr = [{v:-3.5},{v:-1.1},{v:-7.8},{v:-0.001}];
  const r = sortByKey(arr, x => x.v);
  return eq(r.map(x => x.v), [-7.8, -3.5, -1.1, -0.001]);
})());
ok('sortByKey small float array (comparator path)', (() => {
  const arr = Array.from({length: 50}, (_, i) => ({ v: Math.random() * 100 }));
  const r = sortByKey(arr, x => x.v);
  for (let i = 1; i < r.length; i++) if (r[i].v < r[i-1].v) return false;
  return true;
})());
ok('sortByKey NaN keys no crash', (() => {
  const arr = [{v:3},{v:NaN},{v:1}];
  const r = sortByKey(arr, x => x.v);
  return r.length === 3;
})());
ok('sortByKey immutable', (() => {
  const arr = [{v:3},{v:1},{v:2}];
  const copy = arr.slice();
  sortByKey(arr, x => x.v);
  return arr.every((v, i) => v === copy[i]);
})());

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) { console.log('✗ FAILED'); process.exit(1); }
console.log('✓ ALL PASSED');
