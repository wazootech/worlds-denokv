# SPARQL hexastore performance (denokv) — selective only

Captured **2026-05-27** on **Windows x86_64**, **Deno 2.8.0**. Standard scales
1k–50k. Synthetic corpus `SYNTHETIC_CORPUS_VERSION = 1`.

## Methodology

- **Preload** (untimed): `console.time` at module load — generate synthetic
  quads, import into backend, wire Comunica `queryEngine`.
- **Execute** (timed): `Deno.bench` calls `sparqlEngine.execute()` only,
  post-preload.
- **Query shape**: **selective** — `SELECT ?p ?o WHERE { <urn:entity:0> ?p ?o }`
  (subject-bound; production hot path).
- Denokv import uses native `Deno.Kv#BatchedAtomicOperation` for KV commit
  limits.
- **Not measured**: peak RSS / heap (profile preload separately if needed).

## Preload (import + engine wiring)

| Quads  | denokvStore |
| :----- | :---------- |
| 1 000  | 367 ms      |
| 5 000  | 5.6 s       |
| 10 000 | 16.3 s      |
| 25 000 | 101 s       |
| 50 000 | 229 s       |

## Time to first useful SPARQL query

The **execute** table below is **post-preload only** (`Deno.bench` after module
load). Import/preload dominates cold start. For end-to-end **time to first
useful SPARQL query**, reuse an on-disk fixture (`BENCH_REUSE_DB=1` on large
benches via `deno task bench:sparql-perf-large-denokv:reuse`) or a long-lived
process that already imported the corpus.

## Execute (selective SPARQL avg)

| Quads  | denokvStore |
| :----- | :---------- |
| 1 000  | 12.4 ms     |
| 5 000  | 5.3 ms      |
| 10 000 | 3.3 ms      |
| 25 000 | 4.0 ms      |
| 50 000 | 5.2 ms      |

## Commands

```bash
deno task bench:sparql-perf-denokv
```
