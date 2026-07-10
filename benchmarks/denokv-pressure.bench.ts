import { DataFactory } from "n3";
import { createDenokvClient } from "@worlds/denokv";
import { QueryEngine } from "@comunica/query-sparql-rdfjs-lite";
import { generateSyntheticQuads } from "./shared/synthetic-data.ts";

const { quad, namedNode, literal } = DataFactory;

using kv = await Deno.openKv(":memory:");
const client = createDenokvClient({
  kv,
  queryEngine: new QueryEngine(),
  searchIndexOnImport: "disabled",
});

await client.import({
  source: { kind: "quads", quads: generateSyntheticQuads(100) },
});

let indexCounter = 1000;
function generateFreshPayload(count: number) {
  const freshQuads = [];
  for (let i = 0; i < count; i++) {
    indexCounter++;
    freshQuads.push(
      quad(
        namedNode(`urn:entity:fresh:${indexCounter}`),
        namedNode("urn:property:name"),
        literal(`Fresh payload text for unique entity number ${indexCounter}`),
      ),
    );
  }
  return freshQuads;
}

Deno.bench({
  name: "Pressure: Bulk Insert 100 Novel Quads",
  group: "Deno KV Bulk Insert Pressure",
  async fn(benchContext) {
    const freshPayload = generateFreshPayload(100);

    benchContext.start();
    await client.import({
      source: { kind: "quads", quads: freshPayload },
    });
    benchContext.end();
  },
});

Deno.bench({
  name: "Pressure: Bulk Insert 1,000 Novel Quads",
  group: "Deno KV Bulk Insert Pressure",
  async fn(benchContext) {
    const freshPayload = generateFreshPayload(1000);

    benchContext.start();
    await client.import({
      source: { kind: "quads", quads: freshPayload },
    });
    benchContext.end();
  },
});
