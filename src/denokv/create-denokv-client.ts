import { Sdk } from "@worlds/sdk";
import type * as rdfjs from "@rdfjs/types";
import type { SdkInterface } from "@worlds/sdk";
import { WazooSparqlEngine } from "@wazoo/sparql-engine";

import { DenokvRdfjsStore } from "./rdfjs-store/mod.ts";
import { DenokvSearchIndex } from "./search-index/mod.ts";
import { DenokvQuadStore } from "./quad-store/mod.ts";
import type { CommitPatchToDenokvOptions } from "./commit-patch-to-denokv.ts";
import type { SearchIndexOnImport } from "@worlds/sdk/search-index";

/**
 * DenokvClientOptions specifies configuration parameters for Deno KV client contexts.
 */
export interface DenokvClientOptions extends CommitPatchToDenokvOptions {
  /** searchIndexOnImport controls when search indexing runs. */
  searchIndexOnImport?: SearchIndexOnImport;

  /** reindex optionally triggers rebuilding external search indexes. */
  reindex?: () => Promise<void>;
}

/**
 * createDenokvClient synthesizes a Client over DenokvRdfjsStore with the in-house
 * WazooSparqlEngine wired over the same store (SPARQL + search + import/export).
 */
export function createDenokvClient(
  options: DenokvClientOptions,
): SdkInterface {
  const denokvRdfjsStore = new DenokvRdfjsStore({
    kv: options.kv,
    keyPrefix: options.keyPrefix,
    enabledQuadIndexes: options.enabledQuadIndexes,
  });

  const searchIndex = new DenokvSearchIndex({
    kv: options.kv,
    keyPrefix: options.keyPrefix,
  });

  const quadStore = new DenokvQuadStore({
    ...options,
    store: denokvRdfjsStore,
  });

  const sparqlEngine = new WazooSparqlEngine({
    store: denokvRdfjsStore as unknown as rdfjs.Store,
    createTransaction: () => quadStore.createTransaction(),
  });

  return new Sdk({
    quadStore,
    searchIndex,
    sparqlEngine,
  });
}
