// Test suite for the dice-roll-api Lambda handler.
//
// Exercises the pure `handler(event)` contract directly (no network / API Gateway):
//   handler(event) is async, reads event.queryStringParameters, and returns
//   { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(...) }.
//   Success body: { sides, roll }   Error body: { error: "Sides must be between 2 and 100." }
//
// This file hosts the fast-check property tests (5.2-5.6) and the example/edge
// unit tests (6.1) added in the following sub-tasks.

import fc from "fast-check";
import { test } from "node:test";
import assert from "node:assert/strict";
import { handler } from "../lambda/index.mjs";
// ---------------------------------------------------------------------------
// Property-based tests (fast-check)
// ---------------------------------------------------------------------------

// Feature: dice-roll-api, Property 1: Valid sides produce a bounded roll in a well-formed 200 response
// Validates Requirements 1.1, 1.4, 1.5, 3.1.
test("P1: valid sides produce a bounded roll in a well-formed 200 response", async () => {
  await fc.assert(
    fc.asyncProperty(fc.integer({ min: 2, max: 100 }), async (n) => {
      const res = await handler({ queryStringParameters: { sides: String(n) } });
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers["Content-Type"], "application/json");
      const body = JSON.parse(res.body);
      assert.equal(body.sides, n);
      assert.ok(Number.isInteger(body.roll));
      assert.ok(body.roll >= 1 && body.roll <= n);
    }),
    { numRuns: 100 }
  );
});

// Feature: dice-roll-api, Property 2: Falsy or unparseable sides defaults to a six-sided successful roll
// Validates Requirements 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 6.5.
test("P2: falsy or unparseable sides defaults to a six-sided successful roll", async () => {
  // Non-numeric strings whose parseInt(...) is NaN.
  const nonNumeric = fc
    .oneof(
      fc.constantFrom("abc", "xyz", "hello"),
      fc.string().filter((s) => Number.isNaN(parseInt(s)))
    )
    .filter((s) => Number.isNaN(parseInt(s)));

  // Each arbitrary yields an event that should default to a 6-sided roll.
  const defaultingEvent = fc.oneof(
    fc.constant({ queryStringParameters: {} }), // missing sides
    fc.constant({ queryStringParameters: { sides: "" } }), // empty sides
    nonNumeric.map((s) => ({ queryStringParameters: { sides: s } })), // unparseable
    fc.constant({ queryStringParameters: { sides: "0" } }), // sides === "0"
    fc.constant({}), // queryStringParameters absent
    fc.constant({ queryStringParameters: null }) // queryStringParameters null
  );

  await fc.assert(
    fc.asyncProperty(defaultingEvent, async (event) => {
      const res = await handler(event);
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.sides, 6);
      assert.ok(Number.isInteger(body.roll));
      assert.ok(body.roll >= 1 && body.roll <= 6);
      assert.equal(body.error, undefined);
    }),
    { numRuns: 100 }
  );
});

// Feature: dice-roll-api, Property 3: Fractional sides strings truncate toward zero
// Validates Requirements 1.3.
test("P3: fractional sides strings truncate toward zero", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 2, max: 100 }),
      fc.integer({ min: 0, max: 999 }),
      async (n, frac) => {
        const sides = `${n}.${frac}`;
        const res = await handler({ queryStringParameters: { sides } });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.body);
        assert.equal(body.sides, n);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: dice-roll-api, Property 4: Out-of-range sides produce the standard 400 error
// Validates Requirements 3.2, 3.3, 3.4, 3.5.
test("P4: out-of-range sides produce the standard 400 error", async () => {
  const outOfRange = fc.oneof(
    fc.constant(1),
    fc.integer({ min: -1000, max: -1 }),
    fc.integer({ min: 101, max: 10000 })
  );

  await fc.assert(
    fc.asyncProperty(outOfRange, async (n) => {
      const res = await handler({ queryStringParameters: { sides: String(n) } });
      assert.equal(res.statusCode, 400);
      assert.equal(res.headers["Content-Type"], "application/json");
      const body = JSON.parse(res.body);
      assert.equal(body.error, "Sides must be between 2 and 100.");
    }),
    { numRuns: 100 }
  );
});

// Feature: dice-roll-api, Property 5: Every response body is valid JSON
// Validates Requirements 1.4, 1.5, 3.4, 3.5.
test("P5: every response body is valid JSON", async () => {
  const anyEvent = fc.oneof(
    // valid
    fc.integer({ min: 2, max: 100 }).map((n) => ({ queryStringParameters: { sides: String(n) } })),
    // defaulting
    fc.constant({ queryStringParameters: {} }),
    fc.constant({ queryStringParameters: { sides: "" } }),
    fc.constantFrom("abc", "xyz", "hello").map((s) => ({ queryStringParameters: { sides: s } })),
    fc.constant({ queryStringParameters: { sides: "0" } }),
    // out of range
    fc.constant({ queryStringParameters: { sides: "1" } }),
    fc.integer({ min: -1000, max: -1 }).map((n) => ({ queryStringParameters: { sides: String(n) } })),
    fc.integer({ min: 101, max: 10000 }).map((n) => ({ queryStringParameters: { sides: String(n) } }))
  );

  await fc.assert(
    fc.asyncProperty(anyEvent, async (event) => {
      const res = await handler(event);
      assert.doesNotThrow(() => JSON.parse(res.body));
      assert.equal(res.headers["Content-Type"], "application/json");
    }),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Example / edge unit tests (task 6.1)
// Validates Requirements 2.4, 6.3, 6.5.
// ---------------------------------------------------------------------------

test("sides=0 resolves to 6", async () => {
  const res = await handler({ queryStringParameters: { sides: "0" } });
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.sides, 6);
  assert.ok(body.roll >= 1 && body.roll <= 6);
});

test("null queryStringParameters returns 200 default roll without throwing", async () => {
  const res = await handler({ queryStringParameters: null });
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.sides, 6);
});

test("handler export contract", () => {
  assert.equal(typeof handler, "function");
  assert.ok(handler({}) instanceof Promise);
});
