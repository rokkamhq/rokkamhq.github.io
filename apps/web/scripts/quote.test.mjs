// Unit tests for the TS quote engine (CLAUDE.md §10: pricing math tested in isolation).
// Run: node --experimental-strip-types scripts/quote.test.mjs   (from apps/web)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { computeQuote, scrapFloor } from "../src/lib/quote.ts";

const matrix = JSON.parse(readFileSync(new URL("../src/data/seeds/pricing/phone_deductions.json", import.meta.url)));

// Perfect phone: no deductions, price = base.
{
  const q = computeQuote(matrix, 24500, {
    authenticity: "original_india",
    powers_on: "normal",
    display_condition: "flawless",
    touch: "full",
    body_condition: "like_new",
    camera: "fine",
    battery: "great",
    biometrics: "working",
    sound: "fine",
    network: "fine",
    water: "never",
    accessories: [],
    bill: "none",
  });
  assert.equal(q.status, "ok");
  assert.equal(q.finalPriceInr, 24500);
  assert.equal(q.ledger.length, 0);
}

// Hero-scenario: cracked (−30%), battery okay (−6%), charger (+250).
{
  const q = computeQuote(matrix, 24500, {
    display_condition: "cracked",
    battery: "okay",
    accessories: ["charger"],
  });
  assert.equal(q.finalPriceInr, 24500 - 7350 - 1470 + 250);
  assert.equal(q.ledger.length, 3);
}

// pct bonus: bill + warranty on 40000 base = +1200.
{
  const q = computeQuote(matrix, 40000, { bill: "bill_warranty" });
  assert.equal(q.finalPriceInr, 41200);
}

// Floor: dead phone stacked with everything bad can't go below max(5%, 300).
{
  const q = computeQuote(matrix, 10500, {
    powers_on: "dead",
    display_condition: "broken",
    touch: "partial",
    body_condition: "bent",
    camera: "dead",
    battery: "weak",
    network: "issue",
    water: "yes",
  });
  assert.equal(q.finalPriceInr, scrapFloor(10500));
  assert.equal(q.flooredAt, 525);
}

// Floor minimum is ₹300 for cheap bases.
assert.equal(scrapFloor(4000), 300);

// kills_deal hard-stops.
{
  const q = computeQuote(matrix, 24500, { authenticity: "clone", display_condition: "flawless" });
  assert.equal(q.status, "declined");
  assert.equal(q.finalPriceInr, 0);
}

// Unanswered questions contribute nothing; unknown option ids are ignored.
{
  const q = computeQuote(matrix, 24500, { display_condition: "does_not_exist" });
  assert.equal(q.finalPriceInr, 24500);
}

console.log("quote engine: all tests passed");
