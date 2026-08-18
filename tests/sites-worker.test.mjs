import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import worker, {
  buildPearRecommendation,
  createPearRecommendations,
  getCachedPearRecommendations,
} from "../worker/index.js";

test("serves existing static assets without a fallback", async () => {
  const calls = [];
  const response = await worker.fetch(new Request("https://example.test/assets/app.js"), {
    ASSETS: {
      fetch: async (request) => {
        calls.push(new URL(request.url).pathname);
        return new Response("asset", { status: 200 });
      },
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/assets/app.js"]);
});

test("falls back to index.html for an unknown app route", async () => {
  const calls = [];
  const response = await worker.fetch(
    new Request("https://example.test/flow/step-two?source=share", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async (request) => {
          const url = new URL(request.url);
          calls.push(url.pathname + url.search);
          return new Response(url.pathname === "/index.html" ? "app" : "missing", {
            status: url.pathname === "/index.html" ? 200 : 404,
          });
        },
      },
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/flow/step-two?source=share", "/index.html"]);
});

test("does not turn missing API routes into the app shell", async () => {
  let calls = 0;
  const response = await worker.fetch(
    new Request("https://example.test/api/missing", { headers: { accept: "application/json" } }),
    {
      ASSETS: {
        fetch: async () => {
          calls += 1;
          return new Response("missing", { status: 404 });
        },
      },
    },
  );

  assert.equal(response.status, 404);
  assert.equal(calls, 0);
});

test("does not turn write requests into the app shell", async () => {
  let calls = 0;
  const response = await worker.fetch(
    new Request("https://example.test/flow", { method: "POST", headers: { accept: "text/html" } }),
    {
      ASSETS: {
        fetch: async () => {
          calls += 1;
          return new Response("missing", { status: 404 });
        },
      },
    },
  );

  assert.equal(response.status, 404);
  assert.equal(calls, 1);
});

test("returns dashboard-ready pear recommendations in demo mode", async () => {
  const response = await worker.fetch(new Request("https://example.test/api/recommendations/pear?date=2026-08-25"), {
    ASSETS: { fetch: async () => new Response("missing", { status: 404 }) },
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.source.status, "demo");
  assert.equal(payload.fruit.cultivar.name, "원황");
  assert.equal(payload.recommendations.length, 3);
  assert.equal(payload.recommendations[0].rank, 1);
  assert.equal(payload.dashboard.charts.length, 4);
  assert.match(payload.rules.disclaimer, /실제 당도를 예측/);
});

test("requires a service key when live mode is explicitly requested", async () => {
  const response = await worker.fetch(
    new Request("https://example.test/api/recommendations/pear?date=2026-08-25&mode=live"),
    { ASSETS: { fetch: async () => new Response("missing", { status: 404 }) } },
  );
  const payload = await response.json();

  assert.equal(response.status, 503);
  assert.equal(payload.error, "PEAR_RECOMMENDATION_FAILED");
});

test("ranks safer regions ahead when sunshine is comparable", () => {
  const result = buildPearRecommendation({
    referenceDate: new Date("2026-08-25T00:00:00Z"),
    sourceStatus: "live",
    windowStart: "2026-08-11",
    windowEnd: "2026-08-22",
    metrics: [
      { regionId: "4122000000", sunshineRatio: 110, hotDays: 0, rainfallMm: 10, rainfallRatio: 100, warningDays: 0 },
      { regionId: "4413100000", sunshineRatio: 111, hotDays: 4, rainfallMm: 10, rainfallRatio: 100, warningDays: 0 },
    ],
  });

  assert.equal(result.recommendations[0].region.name, "평택");
  assert.ok(result.recommendations[0].score > result.recommendations[1].score);
});

test("rejects invalid recommendation dates", async () => {
  await assert.rejects(() => createPearRecommendations({ date: "2026-02-30" }), /YYYY-MM-DD/);
});

test("reuses a pear recommendation for repeated requests", async () => {
  const first = await getCachedPearRecommendations({ date: "2031-08-25", mode: "demo" });
  const second = await getCachedPearRecommendations({ date: "2031-08-25", mode: "demo" });

  assert.equal(first.cache.status, "miss");
  assert.equal(second.cache.status, "hit");
  assert.equal(second.cache.ttlSeconds, 1800);
  assert.deepEqual(second.recommendations, first.recommendations);
});

test("shares one pending recommendation across simultaneous requests", async () => {
  const [first, second] = await Promise.all([
    getCachedPearRecommendations({ date: "2032-08-25", mode: "demo" }),
    getCachedPearRecommendations({ date: "2032-08-25", mode: "demo" }),
  ]);

  assert.deepEqual(new Set([first.cache.status, second.cache.status]), new Set(["miss", "shared"]));
});

test("emits the files required by Sites packaging", async () => {
  await access(new URL("../dist/client/index.html", import.meta.url));
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
});
