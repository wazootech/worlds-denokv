import { isBenchReuseDbEnabled } from "./shared/perf-db-cache.ts";
import {
  denokvHexastorePerfBackends,
  preloadSparqlHexastorePerfFixtures,
  registerSparqlHexastorePerfBenchmarks,
  registerSparqlHexastorePerfUnloadCleanup,
} from "./shared/sparql-perf-shared.ts";

const largePerfScales = [
  100_000,
  250_000,
  500_000,
  1_000_000,
] as const;

const preloadedSparqlEngines = await preloadSparqlHexastorePerfFixtures(
  largePerfScales,
  "large denokv",
  denokvHexastorePerfBackends,
  { reuseFileCache: isBenchReuseDbEnabled() },
);

registerSparqlHexastorePerfUnloadCleanup(preloadedSparqlEngines);
registerSparqlHexastorePerfBenchmarks(
  largePerfScales,
  preloadedSparqlEngines,
  denokvHexastorePerfBackends,
);
