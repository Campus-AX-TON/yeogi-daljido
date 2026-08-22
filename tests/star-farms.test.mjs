import assert from "node:assert/strict";
import test from "node:test";

import {
  STAR_FARMS,
  STAR_FARM_SOURCE,
  getStarFarmsForRegion,
} from "../src/data/starFarms.js";

test("keeps all unique apple, pear, and grape farms from the source snapshot", () => {
  assert.equal(STAR_FARMS.length, 46);
  assert.equal(
    new Set(STAR_FARMS.map((farm) => `${farm.name}-${farm.address}`)).size,
    STAR_FARMS.length,
  );
});

test("returns fruit farms that match both fruit and recommended region", () => {
  assert.deepEqual(
    getStarFarmsForRegion("apple", "청송").map((farm) => farm.name),
    ["별바위농원", "산중농원"],
  );
  assert.deepEqual(
    getStarFarmsForRegion("grape", "영천").map((farm) => farm.name),
    ["까브스토리", "까치락골농원"],
  );
});

test("does not return a farm registered for another fruit in the same region", () => {
  assert.deepEqual(
    getStarFarmsForRegion("apple", "상주").map((farm) => farm.name),
    ["봉강교육농장"],
  );
  assert.deepEqual(
    getStarFarmsForRegion("grape", "상주").map((farm) => farm.name),
    ["윤지네유기농포도원"],
  );
});

test("returns an empty list when the Star Farm snapshot has no matching farm", () => {
  assert.deepEqual(getStarFarmsForRegion("pear", "평택"), []);
  assert.deepEqual(getStarFarmsForRegion("grape", "김천"), []);
});

test("exposes the public data snapshot metadata", () => {
  assert.equal(STAR_FARM_SOURCE.snapshotDate, "2026-03-10");
  assert.match(STAR_FARM_SOURCE.url, /^https:\/\/www\.data\.go\.kr\//);
});
