import assert from "node:assert/strict";
import test from "node:test";

import {
  FRUIT_PURCHASE_OPTIONS,
  FRUIT_PURCHASE_VERIFICATION,
  getFruitPurchaseOptionsForRegion,
} from "../src/data/fruitSellers.js";

test("keeps producer, marketplace, and listing as separate linked entities", () => {
  for (const option of FRUIT_PURCHASE_OPTIONS) {
    assert.ok(option.producer.name);
    assert.ok(option.producer.description);
    assert.ok(option.producer.entityLabel);
    assert.match(option.producer.profileUrl, /^https:\/\//);
    assert.match(option.producer.phone, /^0\d{1,2}-\d{3,4}-\d{4}$/);
    assert.ok(option.listing.productName);
    assert.equal(option.listing.kind, "product");
    assert.ok(option.marketplace.name);
    assert.ok(option.marketplace.description);
    assert.match(option.listing.url, /^https:\/\//);
    const productUrl = new URL(option.listing.url);
    assert.ok(["/item/detail", "/shop/item.php"].includes(productUrl.pathname));
    assert.ok(productUrl.searchParams.get("id") || productUrl.searchParams.get("it_id"));
    if (productUrl.pathname === "/item/detail") {
      assert.ok(productUrl.searchParams.get("saleItemNo"));
    }
    assert.ok(option.region);
  }
});

test("does not recommend processed-only or experience-only products", () => {
  const excludedProductTerms = /(즙|주스|와인|체험|교육)/;
  for (const option of FRUIT_PURCHASE_OPTIONS) {
    assert.doesNotMatch(option.listing.productName, excludedProductTerms);
  }
});

test("matches sellers only when both fruit and origin are the same", () => {
  assert.deepEqual(
    getFruitPurchaseOptionsForRegion("apple", "의성").map((option) => option.producer.name),
    ["춘산사과농원"],
  );
  assert.deepEqual(
    getFruitPurchaseOptionsForRegion("apple", "영주").map((option) => option.producer.name),
    ["그랑농원"],
  );
  assert.deepEqual(getFruitPurchaseOptionsForRegion("apple", "상주"), []);
  assert.deepEqual(
    getFruitPurchaseOptionsForRegion("pear", "평택").map((option) => option.producer.name),
    ["슬기로운 청년농부"],
  );
  assert.deepEqual(
    getFruitPurchaseOptionsForRegion("grape", "김천").map((option) => option.producer.name),
    ["농업회사법인 주식회사 삼송"],
  );
  assert.deepEqual(
    getFruitPurchaseOptionsForRegion("grape", "상주").map((option) => option.producer.name),
    ["상주로컬푸드 유통사업단"],
  );
  assert.deepEqual(getFruitPurchaseOptionsForRegion("grape", "영천"), []);
  assert.deepEqual(getFruitPurchaseOptionsForRegion("pear", "아산"), []);
});

test("records when the curated seller evidence was reviewed", () => {
  assert.match(FRUIT_PURCHASE_VERIFICATION.verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(FRUIT_PURCHASE_VERIFICATION.criteria.length, 4);
});
