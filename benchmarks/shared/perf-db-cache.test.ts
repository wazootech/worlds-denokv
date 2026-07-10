import { assertEquals, assertExists, assertNotEquals } from "@std/assert";
import * as path from "@std/path";
import { createDenokvClient } from "@worlds/denokv";
import type { Quad } from "@rdfjs/types";
import {
  buildHexastorePerfFixtureChecksumInputs,
  computeHexastorePerfFixtureChecksum,
  readHexastorePerfFixtureManifest,
  resolveHexastorePerfDbCachePaths,
  validateCachedDenokvHexastorePerfDatabase,
  writeHexastorePerfFixtureManifest,
} from "./perf-db-cache.ts";
import { generateSyntheticQuads } from "./synthetic-data.ts";

async function importCorpusIntoDenokvHexastoreForTest(
  kv: Deno.Kv,
  corpusQuads: Quad[],
): Promise<void> {
  const worldsClient = createDenokvClient({
    kv,
    searchIndexOnImport: "disabled",
  });
  await worldsClient.import({
    source: { kind: "quads", quads: corpusQuads },
  });
}

Deno.test(
  "computeHexastorePerfFixtureChecksum - stable digest for identical inputs",
  async () => {
    const checksumInputs = buildHexastorePerfFixtureChecksumInputs(
      1000,
      "denokvStore",
    );
    const firstChecksum = await computeHexastorePerfFixtureChecksum(
      checksumInputs,
    );
    const secondChecksum = await computeHexastorePerfFixtureChecksum(
      checksumInputs,
    );
    assertEquals(firstChecksum, secondChecksum);
  },
);

Deno.test(
  "computeHexastorePerfFixtureChecksum - different corpus version changes digest",
  async () => {
    const baselineInputs = buildHexastorePerfFixtureChecksumInputs(
      1000,
      "denokvStore",
    );
    const baselineChecksum = await computeHexastorePerfFixtureChecksum(
      baselineInputs,
    );
    const alteredInputs = {
      ...baselineInputs,
      syntheticCorpusVersion: baselineInputs.syntheticCorpusVersion + 1,
    };
    const alteredChecksum = await computeHexastorePerfFixtureChecksum(
      alteredInputs,
    );
    assertNotEquals(baselineChecksum, alteredChecksum);
  },
);

Deno.test(
  "resolveHexastorePerfDbCachePaths - names denokvStore KV directory and manifest files",
  () => {
    const cachePaths = resolveHexastorePerfDbCachePaths(10, "denokvStore");
    assertEquals(
      cachePaths.kvDirectoryPath.endsWith("denokvStore-10"),
      true,
    );
    assertEquals(cachePaths.manifestPath.endsWith("denokvStore-10.json"), true);
  },
);

Deno.test(
  "validateCachedDenokvHexastorePerfDatabase - accepts quads-only in-memory fixture",
  async () => {
    using kv = await Deno.openKv(":memory:");
    await importCorpusIntoDenokvHexastoreForTest(
      kv,
      generateSyntheticQuads(10),
    );
    const expectedChecksum = await computeHexastorePerfFixtureChecksum(
      buildHexastorePerfFixtureChecksumInputs(10, "denokvStore"),
    );
    const isValid = await validateCachedDenokvHexastorePerfDatabase(
      kv,
      { quadCount: 10, expectedChecksum },
    );
    assertEquals(isValid, true);
  },
);

Deno.test(
  "writeHexastorePerfFixtureManifest - round-trips manifest JSON",
  async () => {
    const temporaryDirectory = await Deno.makeTempDir();
    const manifestPath = path.join(temporaryDirectory, "denokvStore-10.json");
    try {
      const checksumInputs = buildHexastorePerfFixtureChecksumInputs(
        10,
        "denokvStore",
      );
      const expectedChecksum = await computeHexastorePerfFixtureChecksum(
        checksumInputs,
      );
      const manifest = { ...checksumInputs, checksum: expectedChecksum };
      await writeHexastorePerfFixtureManifest(manifestPath, manifest);
      const parsedManifest = await readHexastorePerfFixtureManifest(
        manifestPath,
      );
      assertExists(parsedManifest);
      assertEquals(parsedManifest.checksum, expectedChecksum);
      assertEquals(parsedManifest.quadCount, 10);
    } finally {
      await Deno.remove(manifestPath);
      await Deno.remove(temporaryDirectory);
    }
  },
);
