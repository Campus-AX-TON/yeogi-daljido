import assert from "node:assert/strict";
import test from "node:test";

import { getFarmDirectoryForRegion } from "../src/data/farmDirectory.js";

test("matches contactable producers by both fruit and recommended origin", () => {
  assert.deepEqual(
    getFarmDirectoryForRegion("apple", "의성").map((contact) => contact.name),
    [],
  );
  assert.deepEqual(
    getFarmDirectoryForRegion("apple", "밀양").map((contact) => contact.name),
    ["얼음골사과소고농원"],
  );
  assert.deepEqual(
    getFarmDirectoryForRegion("pear", "아산").map((contact) => contact.name),
    ["주원농원"],
  );
});

test("keeps the linked seller out of the additional farm contact list", () => {
  assert.deepEqual(getFarmDirectoryForRegion("apple", "의성"), []);
  assert.equal(
    getFarmDirectoryForRegion("apple", "밀양")[0].contactStatus,
    "inquiry-required",
  );
});

test("does not present education farms or farms without public phone evidence", () => {
  assert.deepEqual(getFarmDirectoryForRegion("apple", "상주"), []);
  for (const contact of getFarmDirectoryForRegion("grape", "상주")) {
    assert.ok(contact.phone);
    assert.match(contact.sourceUrl, /^https:\/\//);
    assert.doesNotMatch(contact.name, /(교육농장|체험)/);
  }
});
