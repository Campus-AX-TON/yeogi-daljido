import assert from "node:assert/strict";
import test from "node:test";

import { getResultPresentation } from "../src/data/resultPresentation.js";

const EXPECTED_SECTIONS = {
  apple: ["sunshine", "rainfall", "temperature"],
  grape: ["growth", "sunshine", "rainfall"],
  pear: ["sunshine", "rainfall", "temperature"],
};

for (const [fruitId, expectedSectionIds] of Object.entries(EXPECTED_SECTIONS)) {
  test(`${fruitId} result presentation exposes the shared UI schema`, () => {
    const presentation = getResultPresentation(fruitId);

    assert.deepEqual(
      presentation.detailSections.map((section) => section.id),
      expectedSectionIds,
    );
    assert.deepEqual(Object.keys(presentation.aiReasonsByRank), ["1", "2", "3"]);
    assert.equal(presentation.hero.asset, fruitId);
    assert.ok(presentation.hero.description.length > 20);
    assert.ok(presentation.contextMetrics.length > 0);
  });
}

test("rejects a fruit without a result presentation", () => {
  assert.throws(
    () => getResultPresentation("peach"),
    /결과 화면 설정이 없는 과일입니다: peach/,
  );
});
