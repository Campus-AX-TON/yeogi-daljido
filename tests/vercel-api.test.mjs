import assert from "node:assert/strict";
import test from "node:test";
import health from "../api/health.js";
import pearRecommendation from "../api/recommendations/pear.js";

test("Vercel health endpoint reports whether the weather key is configured", async () => {
  const originalKey = process.env.DATA_GO_KR_SERVICE_KEY;
  delete process.env.DATA_GO_KR_SERVICE_KEY;

  try {
    const response = health.fetch();
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.weatherApiConfigured, false);
    assert.equal(payload.platform, "vercel");
  } finally {
    if (originalKey === undefined) delete process.env.DATA_GO_KR_SERVICE_KEY;
    else process.env.DATA_GO_KR_SERVICE_KEY = originalKey;
  }
});

test("Vercel pear endpoint returns demo data until a new key is configured", async () => {
  const originalKey = process.env.DATA_GO_KR_SERVICE_KEY;
  delete process.env.DATA_GO_KR_SERVICE_KEY;

  try {
    const response = await pearRecommendation.fetch(
      new Request("https://example.test/api/recommendations/pear?date=2026-08-25"),
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.source.status, "demo");
    assert.equal(payload.recommendations.length, 3);
    assert.equal(response.headers.get("cache-control"), "no-store");
  } finally {
    if (originalKey === undefined) delete process.env.DATA_GO_KR_SERVICE_KEY;
    else process.env.DATA_GO_KR_SERVICE_KEY = originalKey;
  }
});

test("Vercel pear endpoint rejects non-GET requests", async () => {
  const response = await pearRecommendation.fetch(
    new Request("https://example.test/api/recommendations/pear", { method: "POST" }),
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET");
});
