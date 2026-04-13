/**
 * ayoob-sort benchmark
 * 
 * Methodology: same pre-generated array for all algorithms.
 * Median of N runs with 3 warmup. No allocation inside timed section.
 */
const { sort, sortByKey } = require('../src/index.js');

function median(a) { const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; }

function bench(name, data, ayFn, natFn, runs) {
  // Warmup (not timed)
  ayFn(data); natFn(data); ayFn(data); natFn(data);

  const at = [], nt = [];
  for (let i = 0; i < runs; i++) {
    // Both sort the SAME pre-generated data — fair comparison
    let t = performance.now(); ayFn(data); at.push(performance.now() - t);
    t = performance.now(); natFn(data); nt.push(performance.now() - t);
  }
  const am = median(at), nm = median(nt);
  const faster = am < nm;
  const ratio = faster ? (nm / am).toFixed(1) + 'x faster' : (am / nm).toFixed(1) + 'x slower';
  const fmt = t => t < 1 ? `${(t * 1000).toFixed(0)}µs` : `${t.toFixed(2)}ms`;
  console.log(`  ${name.padEnd(35)} ${fmt(am).padStart(8)} vs ${fmt(nm).padStart(8)}  ${faster ? '✓' : '✗'} ${ratio}`);
}

console.log('ayoob-sort benchmark');
console.log('Method: median timing, same pre-generated data for all, 3 warmup\n');

const n = 50000;
const random = Array.from({length: n}, () => Math.floor(Math.random() * n * 10));
const sorted = Array.from({length: n}, (_, i) => i);
const reversed = Array.from({length: n}, (_, i) => n - i);
const floats = Array.from({length: n}, () => Math.random() * 2e6 - 1e6);
const clustered = Array.from({length: n}, () => {
  const c = Math.floor(Math.random() * 8); return c * 1000 + Math.floor(Math.random() * 60);
});
const dupes = Array.from({length: n}, () => Math.floor(Math.random() * 10));
const objs = Array.from({length: 10000}, () => ({ id: Math.floor(Math.random() * 10000), x: 'data' }));

bench('50K random integers', random,
  d => sort(d), d => d.slice().sort((a, b) => a - b), 15);
bench('50K already sorted', sorted,
  d => sort(d), d => d.slice().sort((a, b) => a - b), 15);
bench('50K reversed', reversed,
  d => sort(d), d => d.slice().sort((a, b) => a - b), 15);
bench('50K random floats', floats,
  d => sort(d), d => d.slice().sort((a, b) => a - b), 15);
bench('50K clustered', clustered,
  d => sort(d), d => d.slice().sort((a, b) => a - b), 15);
bench('50K duplicates', dupes,
  d => sort(d), d => d.slice().sort((a, b) => a - b), 15);
bench('10K objects by key', objs,
  d => sortByKey(d, x => x.id), d => d.slice().sort((a, b) => a.id - b.id), 15);

// Object sorting: wide-range keys (radix path)
const objsWide = Array.from({length: 10000}, () => ({ id: Math.floor(Math.random() * 2e9) - 1e9, x: 'data' }));
bench('10K objects by wide-range key', objsWide,
  d => sortByKey(d, x => x.id), d => d.slice().sort((a, b) => a.id - b.id), 15);

// Object sorting: float keys (float radix path)
const objsFloat = Array.from({length: 10000}, () => ({ price: Math.random() * 10000, x: 'data' }));
bench('10K objects by float key', objsFloat,
  d => sortByKey(d, x => x.price), d => d.slice().sort((a, b) => a.price - b.price), 15);

// Small arrays (UI-typical sizes)
const small1K = Array.from({length: 1000}, () => Math.floor(Math.random() * 10000));
const small5K = Array.from({length: 5000}, () => Math.floor(Math.random() * 50000));
bench('1K random integers', small1K,
  d => sort(d), d => d.slice().sort((a, b) => a - b), 15);
bench('5K random integers', small5K,
  d => sort(d), d => d.slice().sort((a, b) => a - b), 15);

// Strings (delegates to native)
const strings50K = Array.from({length: n}, () => Math.random().toString(36).substring(2, 10));
bench('50K random strings', strings50K,
  d => sort(d), d => d.slice().sort(), 15);

// Custom comparator
bench('50K with comparator', random,
  d => sort(d, (a, b) => a - b), d => d.slice().sort((a, b) => a - b), 15);

console.log('\nDone.');
