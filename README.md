# ayoob-sort

**Sorting that just works. Up to 21x faster than `Array.sort()`.** Drop-in adaptive sorting for JavaScript and TypeScript. Zero config. One function call.

```bash
npm install ayoob-sort
```

```js
const { sort, sortByKey } = require('ayoob-sort');

// Numbers just work — no comparator needed
sort([10, 2, 1]);                      // → [1, 2, 10]  (not [1, 10, 2])
sort([3.14, 1.41, 2.72]);             // → [1.41, 2.72, 3.14]

// Sort objects by key — just pass the field name
sortByKey(products, 'price');          // → sorted by price (stable)
sortByKey(users, u => u.age);          // → or use a function (stable)

// Descending? Just say so
sort(scores, 'desc');                  // → [highest, ..., lowest]
sort(products, { key: 'price', reverse: true }); // → most expensive first

// Strings
sort(['banana', 'apple', 'cherry']);   // → ['apple', 'banana', 'cherry']

// Messy data? No problem
sort([5, null, NaN, 2, undefined], { clean: true });
```

## Why use this instead of `.sort()`?

JavaScript's `.sort()` has a well-known gotcha — it converts numbers to strings:

```js
[10, 2, 1].sort()    // → [1, 10, 2]  ← wrong!
sort([10, 2, 1])     // → [1, 2, 10]  ← correct
```

Ayoob Sort just works. Numbers sort as numbers, strings sort as strings, objects sort by key — no comparator functions, no bugs.

Beyond correctness, it's faster. `Array.sort()` uses one algorithm (TimSort) for everything. Ayoob Sort detects your data shape in a single pass and picks the optimal algorithm automatically:

| Your data | What Ayoob Sort does | Speedup |
|---|---|---|
| Integers (clustered/duplicates) | Counting sort | **17–21x faster** |
| Integers (random) | LSD Radix-256 | **~10x faster** |
| Floats | IEEE 754 float radix sort | **~6x faster** |
| Objects by numeric key | Key extraction + counting/radix sort | **~8x faster** |
| Already sorted / reversed | O(n) detection | **~3x faster** |
| Custom comparator | Adaptive merge sort | **~2x faster** |
| Strings (ASCII) | LSD Radix on character codes | **~4x faster** |
| Small arrays (n ≤ 8) | Sorting networks | **~2x faster** |

**You don't choose the algorithm. It chooses for you.**

## Benchmarks

50,000 elements, Node.js v24, median of 15 runs, same pre-generated data for both:

| Test | ayoob-sort | `.sort()` | Speedup |
|---|---|---|---|
| Clustered integers | 0.3ms | 6.3ms | **21x** |
| Heavy duplicates | 0.26ms | 4.4ms | **17x** |
| Random integers | 0.58ms | 5.9ms | **10x** |
| Objects by key (10K) | 0.12ms | 1.0ms | **8x** |
| Random floats | 1.3ms | 8.0ms | **6x** |
| Random strings | 1.8ms | 7.4ms | **4x** |
| Already sorted | 0.13ms | 0.47ms | **3.5x** |
| Reversed | 0.15ms | 0.48ms | **3x** |
| Custom comparator | 3.8ms | 5.9ms | **2x** |

### vs the fastest npm sorting libraries

Tested against 12 competitors: @aldogg/sorter, hpc-algorithms, fast-sort, timsort, array-timsort, sort-algorithms-js, barsort, sort-ids, wikisort, radix-sort, sort-es, natural-orderby. 50K elements, Node.js v24, median of 15 runs:

| Test | #1 | #2 | #3 |
|---|---|---|---|
| Clustered integers | **ayoob-sort** | hpc (2.2x slower) | @aldogg (2.4x slower) |
| Heavy duplicates | **ayoob-sort** | @aldogg (1.9x slower) | hpc (2.4x slower) |
| Random floats | **ayoob-sort** | @aldogg (1.7x slower) | native (6x slower) |
| Objects by key | **ayoob-sort** | hpc (1.7x slower) | @aldogg (1.9x slower) |
| Random strings | **ayoob-sort** | native (4x slower) | timsort (5x slower) |
| Random integers | @aldogg | **ayoob-sort** (1.04x) | hpc (1.3x slower) |
| Already sorted | timsort | **ayoob-sort** (1.09x) | native (3.8x slower) |
| Reversed | timsort | **ayoob-sort** (1.14x) | native (3.6x slower) |

**Win rate: 59/62 tests (95.2%)** across 12 competitors.

ayoob-sort is the only library that handles numbers, floats, strings, objects, and mixed types. @aldogg/sorter is ~4% faster on random integers but requires separate functions for each data type (`sortInt` vs `sortNumber` vs `sortObjectInt`) — no auto-detection. timsort is ~9-14% faster on already-sorted/reversed data but requires a comparator for everything.

### Scaling across array sizes

| Size | vs `.sort()` | vs @aldogg |
|---|---|---|
| n = 100 | native wins | @aldogg wins |
| n = 200 | **2x faster** | ~tied |
| n = 1K | **9x faster** | ~tied |
| n = 50K | **10x faster** | ~tied |
| n = 500K | **13x faster** | **ayoob-sort wins** |
| n = 1M | **13x faster** | **ayoob-sort wins** |
| n = 10M | **11x faster** | **ayoob-sort wins** |

Below ~200 elements, native `.sort()` is faster. Above 200, ayoob-sort wins everywhere. At 500K+ elements, ayoob-sort also beats @aldogg/sorter.

### Nearly-sorted data (disorder sensitivity)

| Disorder | Speedup vs `.sort()` |
|---|---|
| 0% (sorted) | **4x** |
| 5% random swaps | **6x** |
| 10% random swaps | **9x** |
| 50% random swaps | **14x** |

No performance cliff. Smooth gradient from presorted detection → adaptive merge → counting/radix.

### NaN handling

NaN is auto-detected during the scan and handled correctly — no `{ clean: true }` needed:

```js
sort([NaN, 3, 1, NaN, 2])   // → [1, 2, 3, NaN, NaN]
sort([5, null, NaN])         // → [5, null, NaN] (use { clean: true } for full cleanup)
```

Run benchmarks yourself:

```bash
npm run bench
node definitive-benchmark.js   # vs all competitors
```

## API

### `sort(arr)`

Sort numbers, strings, or mixed types. Auto-detects and picks the fastest path.

```js
sort([5, 2, 8, 1])                          // numbers
sort([3.14, 2.72, 1.41])                     // floats
sort(['cherry', 'apple', 'banana'])           // strings
```

### `sort(arr, comparator)`

Sort with a custom comparator function. Stable.

```js
sort(users, (a, b) => a.age - b.age)         // ascending by age
sort(scores, (a, b) => b.value - a.value)     // descending by value
```

### `sort(arr, 'desc')` / `sort(arr, 'asc')`

Shorthand for descending or ascending sort.

```js
sort([3, 1, 4], 'desc')              // → [4, 3, 1]
```

### `sort(arr, { key: fn | string })`

Sort objects by a numeric key. Pass a function or a field name string.

```js
sort(products, { key: 'price' })                     // string key
sort(products, { key: p => p.price })                 // function key
sort(products, { key: 'price', reverse: true })       // descending
```

### `sort(arr, { inPlace: true })`

Mutate the input array instead of returning a new one. Eliminates copy overhead for performance-critical paths. Combinable with `key` and `reverse`.

```js
sort(data, { inPlace: true })                         // mutates data
sort(products, { key: 'price', inPlace: true })       // mutates products
sort(scores, { inPlace: true, reverse: true })        // mutates, descending
```

Note: in-place mode mutates the input array, eliminating the output copy. Internal algorithm buffers are still allocated.

### `sort(arr, { clean: true })`

Sort arrays that may contain NaN, null, or undefined.

```js
sort([5, null, NaN, 2, undefined], { clean: true })
// → [2, 5, null, NaN, undefined]
```

### `sortByKey(arr, keyFn | string)`

Sort objects by a numeric key. Pass a function or field name. Fastest path for object sorting — extracts keys once and uses counting/radix sort on indices. Stable.

```js
sortByKey(products, 'price')          // string key
sortByKey(users, u => u.createdAt)    // function key
sortByKey(rows, 'id')                 // string key
```

`sortByKey` auto-detects key properties and routes to the optimal strategy:
- **Dense integer range** (e.g., ages 0–120, scores 0–100): counting sort on indices
- **Wide integer range** (e.g., timestamps, large IDs): LSD radix-256 on indices
- **Float keys** (e.g., prices, coordinates): IEEE 754 radix sort on indices

All paths are O(n), stable, and significantly faster than `.sort()` with a comparator.

## Technical Details

Ayoob Sort performs a single O(n) scan that detects:
- Min/max values and integer/float type
- Whether data is already sorted or reversed
- Value range (for counting sort eligibility)
- Presortedness level (for adaptive merge sort)

Based on these properties, it routes to one of 8 paths:

1. **Sorting networks** (n ≤ 8) — optimal compare-and-swap networks (Knuth)
2. **Insertion sort** (n ≤ 32)
3. **Presorted detection** — O(n) copy/reverse for sorted or reversed input
4. **IEEE 754 float radix sort** — reinterprets float bits as sortable unsigned integers, LSD radix-256
5. **Stable counting sort** — for integers with dense range (range ≤ n×2)
6. **Adaptive merge sort** — for nearly-sorted data (>90% ordered pairs)
7. **Stable LSD radix-256** — for wide-range integers
8. **String radix sort** — pre-extracts character codes into a flat buffer, LSD radix by character position

All paths are **stable** (equal elements preserve original order).
Input is **never mutated** by default (returns a new array). Use `{ inPlace: true }` to mutate the input array and skip the copy overhead.
**Zero dependencies.** Works in Node.js 14+ and modern browsers.

## TypeScript

Full type definitions included. No `@types` package needed.

```ts
import { sort, sortByKey } from 'ayoob-sort';

interface Product { name: string; price: number; }
const sorted: Product[] = sortByKey(products, p => p.price);
```

## License

MIT — [Husain Ayoob](https://ayoob.ai), AyoobAI Ltd, 2026
