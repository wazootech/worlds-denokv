import { DataFactory } from "n3";
import type * as rdfjs from "@rdfjs/types";

const { blankNode, defaultGraph, literal, namedNode, quad } = DataFactory;

/**
 * generateSyntheticQuads returns a deterministic mixed quad corpus for match benchmarks.
 */
export function generateSyntheticQuads(count: number): rdfjs.Quad[] {
  const quads: rdfjs.Quad[] = [];

  for (let index = 0; index < count; index += 1) {
    const subject = index % 5 === 0
      ? blankNode(`synthetic-subject-${index}`)
      : namedNode(`urn:synthetic:subject:${index}`);
    const predicate = namedNode(
      `urn:synthetic:predicate:${index % 17}`,
    );
    const object = index % 3 === 0
      ? literal(`synthetic-value-${index}`)
      : namedNode(`urn:synthetic:object:${index}`);
    const graph = index % 7 === 0
      ? namedNode(`urn:synthetic:graph:${index % 11}`)
      : defaultGraph();

    quads.push(quad(subject, predicate, object, graph));
  }

  return quads;
}
