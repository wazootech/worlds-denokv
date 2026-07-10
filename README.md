# Worlds Deno KV

Deno KV-backed RDF quad store, search index, and client factory extracted from
[`@worlds/client`](https://jsr.io/@worlds/client).

## Install

```bash
deno add jsr:@worlds/denokv
```

## Usage

Deno KV requires the unstable KV flag at runtime:

```bash
deno run --unstable-kv main.ts
```

```typescript
import { createDenokvClient } from "@worlds/denokv";
import { DenokvQuadStore } from "@worlds/denokv/quad-store";
import { DenokvSearchIndex } from "@worlds/denokv/search-index";
import { DenokvRdfjsStore } from "@worlds/denokv/rdfjs-store";
```

## Development

```bash
deno task ci
```

Dry-run a JSR publish locally:

```bash
deno task publish:dry
```

## Publishing to JSR

Releases publish automatically when changes merge to `main`. Bump `"version"` in
[`deno.json`](deno.json) in each release PR — JSR rejects duplicate versions.

One-time setup on [jsr.io/@worlds/denokv](https://jsr.io/@worlds/denokv):

1. Open package settings and link `https://github.com/wazootech/worlds-denokv`.
2. Enable **GitHub Actions publishing** (OIDC). The
   [publish workflow](.github/workflows/publish.yml) uses `id-token: write`; no
   JSR token secret is required when OIDC is configured.
3. Confirm your GitHub account can publish to the `@worlds` org.

After setup, merging to `main` runs CI, a publish dry-run, and `deno publish`.
