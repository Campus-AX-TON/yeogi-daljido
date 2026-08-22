import assert from "node:assert/strict";
import test from "node:test";

import {
  ORIGIN_PURCHASE_COVERAGE,
  getOriginPurchaseCoverage,
  getVerifiedOriginPurchasePlaces,
} from "../src/data/originPurchaseCoverage.js";
import { getOriginPurchasePlacesForRegion } from "../src/data/fruitSellers.js";

const EXPECTED_REGIONS = {
  apple: ["청송", "문경", "영주", "안동", "의성", "군위", "상주", "충주", "장수", "무주", "거창", "예산", "밀양"],
  grape: ["영동", "김천", "영천", "상주", "화성", "옥천", "가평"],
  pear: ["평택", "천안", "아산", "안성", "상주"],
};

test("tracks every fruit and candidate-origin combination", () => {
  assert.equal(ORIGIN_PURCHASE_COVERAGE.length, 25);

  for (const [fruitId, regions] of Object.entries(EXPECTED_REGIONS)) {
    assert.deepEqual(
      ORIGIN_PURCHASE_COVERAGE
        .filter((entry) => entry.fruitId === fruitId)
        .map((entry) => entry.region),
      regions,
    );
  }
});

test("exposes purchase links only for verified coverage", () => {
  assert.equal(getOriginPurchaseCoverage("apple", "거창").status, "seasonal-unavailable");
  assert.deepEqual(getVerifiedOriginPurchasePlaces("apple", "거창"), []);
  assert.equal(getVerifiedOriginPurchasePlaces("apple", "청송").length, 1);
});

test("combines exact seller listings with verified regional fruit lists", () => {
  assert.equal(getOriginPurchasePlacesForRegion("grape", "김천").length, 2);
  assert.equal(getOriginPurchasePlacesForRegion("grape", "상주").length, 2);
  assert.equal(getOriginPurchasePlacesForRegion("pear", "평택").length, 1);
});

test("uses the current Sangju mall category routes instead of retired shop URLs", () => {
  const sangjuPlaces = ORIGIN_PURCHASE_COVERAGE
    .filter((entry) => entry.region === "상주")
    .flatMap((entry) => entry.places);

  for (const place of sangjuPlaces) {
    const url = new URL(place.listing.url);
    assert.equal(url.pathname, "/item/list");
    assert.ok(["2060", "2070"].includes(url.searchParams.get("cate")));
  }
});

test("keeps every exposed link scoped to a product or fruit list", () => {
  for (const entry of ORIGIN_PURCHASE_COVERAGE) {
    for (const place of entry.places) {
      assert.equal(entry.status, "verified");
      assert.match(place.listing.url, /^https:\/\//);
      assert.ok(["product", "fruit-list"].includes(place.listing.kind));
      assert.ok(place.listing.productName.includes(entry.region));
    }
  }
});
