# Benchmarks

Performance benchmarks for `@worlds/denokv`. **Local only** — there is no CI
regression gate; compare results manually on the same OS and Deno version.

| Resource                                                                       | Purpose                                                        |
| :----------------------------------------------------------------------------- | :------------------------------------------------------------- |
| [Discussion #69](https://github.com/wazootech/worlds-client-ts/discussions/69) | Canonical post-preload SPARQL quad index perf write-up         |
| [Discussion #45](https://github.com/wazootech/worlds-client-ts/discussions/45) | Historical hydrate+N3 vs libsql crossover (pre-preload)        |
| [#68](https://github.com/wazootech/worlds-client-ts/issues/68)                 | Millions-of-quads production guidance (README + query helpers) |

Do not comment on closed perf threads
([#2](https://github.com/wazootech/worlds-client-ts/issues/2),
[#3](https://github.com/wazootech/worlds-client-ts/issues/3),
[#8](https://github.com/wazootech/worlds-client-ts/issues/8),
[#11](https://github.com/wazootech/worlds-client-ts/issues/11)). File a new
issue with before/after `deno bench` output instead.

**JSR:** [`@worlds/denokv`](https://jsr.io/@worlds/denokv) is published on JSR.
Tables below reflect **main** branch methodology (module preload); they are not
a substitute for re-running on your machine.

## Layout

- `*.bench.ts` — runnable benchmarks (`deno bench` discovers these at the repo
  root of `benchmarks/`, not under `shared/`).
- [`shared/`](shared/) — helpers imported by benches (`synthetic-data.ts`,
  `sparql-perf-shared.ts`).

## Run all benchmarks

```bash
deno task bench
```

Or directly:

```bash
deno bench --allow-all --unstable-kv benchmarks/
```

### Deno KV pressure benchmarks

Deno KV bulk insert pressure (requires `--unstable-kv`):

```bash
deno bench --allow-all --unstable-kv benchmarks/denokv-pressure.bench.ts
# or
deno task bench:denokv-pressure
```

### SPARQL quad index performance

The Denokv bench runs preload + selective SPARQL execute methodology against
`DenokvRdfjsStore` — useful for Deno-native comparisons.

Deno KV (requires `--unstable-kv`):

```bash
deno bench --allow-all --unstable-kv benchmarks/sparql-perf-denokv.bench.ts
# or
deno task bench:sparql-perf-denokv
```

**Default query shape is selective only** (subject-bound
`SELECT ?p ?o WHERE { <urn:entity:0> ?p ?o }`). Unbound dev-scan (`fullScan`) is
opt-in — it is slow on both backends and not the production hot path:

```bash
# .env or shell
BENCH_HEXASTORE_PERF_FULL_SCAN=1
deno task bench:sparql-perf-denokv:full-scan
```

Large benches use the same env via `:full-scan` tasks:

```bash
deno task bench:sparql-perf-large-denokv:full-scan
```

**Large (100k–1M):** denokv large bench
([#68](https://github.com/wazootech/worlds-client-ts/issues/68)). Supports
`:reuse` and `:full-scan` tasks. Denokv large preload is still slow — use reuse
for repeat captures, not day-to-day iteration.

### SPARQL quad index perf at 100k–1M (opt-in, local only)

Not part of `deno task bench` — preload can take a long time and needs ample RAM
(16 GB+ for 1M preload).

```bash
deno task bench:sparql-perf-large-denokv
```

Or with a larger V8 heap if preload OOMs:

```bash
deno bench --allow-all --unstable-kv --v8-flags=--max-old-space-size=8192 benchmarks/sparql-perf-large-denokv.bench.ts
```

Module load logs `console.time` lines per scale. Only `sparqlEngine.execute()`
is timed inside `Deno.bench`.

#### Reusing large fixtures (dev only)

Opt-in file cache for **large denokvStore** preload (`BENCH_REUSE_DB=1`). The
first run imports into `benchmarks/.cache/perf-large/` (`denokvStore-{n}/`);
later runs open cached storage and skip import when the manifest checksum
matches. `Deno.bench` still measures `execute()` only.

```bash
# shell or .env
BENCH_REUSE_DB=1
deno task bench:sparql-perf-large-denokv:reuse
```

Invalidate cache: delete `benchmarks/.cache/perf-large/` or bump
`SYNTHETIC_CORPUS_VERSION` or `BENCH_DENOKV_HEXASTORE_SCHEMA_VERSION` in
[`shared/perf-db-cache.ts`](shared/perf-db-cache.ts) and
[`shared/synthetic-data.ts`](shared/synthetic-data.ts).

## Measurement notes

Benchmarks preload datasets and SPARQL engines at **module load**; only the hot
path runs inside `benchContext.start()` / `end()`. Write-pressure benches still
create a fresh database per iteration and use `warmup: 5`, `n: 50`.

- **avg** is the primary signal; compare like-for-like OS and Deno versions
  only.

## Regression policy

- Investigate when a keyed benchmark regresses by **more than ~15%** average vs
  the post-preload table on the same OS and Deno version.
- Open a **new issue** with pasted before/after `deno bench` output.
- Link
  [discussion #69](https://github.com/wazootech/worlds-client-ts/discussions/69)
  when SPARQL quad index perf numbers change.

```bash
deno task bench
```
