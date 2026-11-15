import test from "node:test";
import assert from "node:assert/strict";
import {
  analyseBoundary,
  boundaryHash,
  validateBoundary,
} from "../server/geo.mjs";

const SQUARE = [
  { lat: 30.9, lon: 30.4 },
  { lat: 30.9, lon: 30.5 },
  { lat: 30.8, lon: 30.5 },
  { lat: 30.8, lon: 30.4 },
];

test("validateBoundary accepts a clean open polygon and does not mutate the input", () => {
  const boundary = SQUARE.map((point) => ({ ...point }));
  const error = validateBoundary(boundary);
  assert.equal(error, null);
  assert.equal(boundary.length, 4);
  assert.deepEqual(boundary, SQUARE);
});

test("validateBoundary tolerates a duplicated closing vertex without mutating it", () => {
  const boundary = [...SQUARE.map((point) => ({ ...point })), { ...SQUARE[0] }];
  const error = validateBoundary(boundary);
  assert.equal(error, null);
  assert.equal(boundary.length, 5, "the caller's input must stay untouched");
});

test("validateBoundary rejects too few points and out-of-range coordinates", () => {
  assert.ok(validateBoundary([{ lat: 30, lon: 30 }]));
  assert.ok(
    validateBoundary([
      { lat: 95, lon: 30 },
      { lat: 30, lon: 30 },
      { lat: 30, lon: 31 },
    ]),
  );
  assert.ok(validateBoundary("not-a-polygon"));
});

test("analyseBoundary drops a duplicated closing vertex on a copy", () => {
  const boundary = [...SQUARE.map((point) => ({ ...point })), { ...SQUARE[0] }];
  const open = analyseBoundary(SQUARE);
  const closed = analyseBoundary(boundary);
  assert.equal(closed.vertexCount, 4);
  assert.equal(boundary.length, 5, "the caller's input must stay untouched");
  assert.equal(closed.areaHa, open.areaHa);
  assert.equal(closed.perimeterM, open.perimeterM);
});

test("analyseBoundary reports a positive area for a real square", () => {
  const geometry = analyseBoundary(SQUARE);

  assert.ok(
    geometry.areaHa > 10_000 && geometry.areaHa < 11_500,
    `areaHa=${geometry.areaHa}`,
  );
  assert.equal(geometry.bbox.north, 30.9);
  assert.equal(geometry.bbox.west, 30.4);
});

test("boundaryHash is stable for the same points regardless of input order of keys", () => {
  const a = boundaryHash([
    { lat: 30.9, lon: 30.4 },
    { lat: 30.8, lon: 30.5 },
  ]);
  const b = boundaryHash([
    { lon: 30.4, lat: 30.9 },
    { lon: 30.5, lat: 30.8 },
  ]);
  assert.equal(a, b);
});
