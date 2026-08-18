import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import worker, {
  buildAppleRecommendation,
  buildGrapeRecommendation,
  buildPearRecommendation,
  createAppleRecommendations,
  createGrapeRecommendations,
  createPearRecommendations,
  getCachedAppleRecommendations,
  getCachedGrapeRecommendations,
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

test("returns dashboard-ready grape recommendations in demo mode", async () => {
  const response = await worker.fetch(
    new Request("https://example.test/api/recommendations/grape?date=2026-08-25"),
    { ASSETS: { fetch: async () => new Response("missing", { status: 404 }) } },
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.source.status, "demo");
  assert.equal(payload.fruit.cultivar.name, "캠벨얼리");
  assert.equal(payload.candidateScope.count, 7);
  assert.equal(payload.recommendations.length, 3);
  assert.equal(payload.dashboard.charts.length, 4);
  assert.match(payload.rules.disclaimer, /일사량 대신 일조시간/);
});

test("requires a service key for live grape recommendations", async () => {
  const response = await worker.fetch(
    new Request("https://example.test/api/recommendations/grape?date=2026-08-25&mode=live"),
    { ASSETS: { fetch: async () => new Response("missing", { status: 404 }) } },
  );
  const payload = await response.json();

  assert.equal(response.status, 503);
  assert.equal(payload.error, "GRAPE_RECOMMENDATION_FAILED");
});

test("returns dashboard-ready apple recommendations in demo mode", async () => {
  const response = await worker.fetch(
    new Request("https://example.test/api/recommendations/apple?date=2026-09-05"),
    { ASSETS: { fetch: async () => new Response("missing", { status: 404 }) } },
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.source.status, "demo");
  assert.equal(payload.fruit.cultivar.name, "홍로·아리수");
  assert.equal(payload.candidateScope.count, 13);
  assert.equal(payload.recommendations.length, 3);
  assert.equal(payload.dashboard.charts.length, 4);
  assert.equal(payload.rules.scoring.reduce((total, item) => total + item.weight, 0), 100);
  assert.match(payload.rules.disclaimer, /실제 당도·산도·경도·착색도/);
});

test("requires a service key for live apple recommendations", async () => {
  const response = await worker.fetch(
    new Request("https://example.test/api/recommendations/apple?date=2026-09-05&mode=live"),
    { ASSETS: { fetch: async () => new Response("missing", { status: 404 }) } },
  );
  const payload = await response.json();

  assert.equal(response.status, 503);
  assert.equal(payload.error, "APPLE_RECOMMENDATION_FAILED");
});

test("grape scoring uses temperature, moisture, and sunshine proxy equally", () => {
  const result = buildGrapeRecommendation({
    referenceDate: new Date("2026-08-25T00:00:00Z"),
    sourceStatus: "live",
    windowStart: "2026-06-06",
    windowEnd: "2026-08-22",
    metrics: [
      {
        regionId: "4374000000",
        gdd: 850,
        gddBaseline: 800,
        gddRatio: 106,
        sunshineHours: 430,
        sunshineBaselineHours: 400,
        sunshineRatio: 108,
        rainfallMm: 450,
        rainfallBaselineMm: 450,
        rainfallRatio: 100,
        averageTemperature: 23,
        hotDays: 5,
        rainyDays: 20,
        longestRainStreak: 3,
        humidityAverage: 72,
        windAverage: 1.3,
        warningDays: 1,
        observedDays: 78,
      },
      {
        regionId: "4715000000",
        gdd: 760,
        gddBaseline: 800,
        gddRatio: 95,
        sunshineHours: 360,
        sunshineBaselineHours: 400,
        sunshineRatio: 90,
        rainfallMm: 650,
        rainfallBaselineMm: 450,
        rainfallRatio: 144,
        averageTemperature: 21,
        hotDays: 2,
        rainyDays: 35,
        longestRainStreak: 7,
        humidityAverage: 80,
        windAverage: 1,
        warningDays: 4,
        observedDays: 78,
      },
    ],
  });

  assert.equal(result.recommendations[0].region.name, "영동");
  assert.deepEqual(Object.keys(result.recommendations[0].scoreBreakdown), [
    "temperature",
    "moisture",
    "sunshineProxy",
  ]);
  assert.equal(result.dataUsage.scoring.reduce((total, item) => total + item.weight, 0), 100);
});

test("does not award grape sunshine points when the station reports only missing zero values", () => {
  const result = buildGrapeRecommendation({
    referenceDate: new Date("2026-08-25T00:00:00Z"),
    sourceStatus: "live",
    windowStart: "2026-06-06",
    windowEnd: "2026-08-22",
    metrics: [
      {
        regionId: "4159000000",
        gdd: 800,
        gddBaseline: 800,
        gddRatio: 100,
        sunshineHours: null,
        sunshineBaselineHours: null,
        sunshineRatio: null,
        sunshineDataAvailable: false,
        rainfallMm: 450,
        rainfallBaselineMm: 450,
        rainfallRatio: 100,
        averageTemperature: 23,
        hotDays: 5,
        rainyDays: 20,
        longestRainStreak: 3,
        humidityAverage: 72,
        windAverage: 1.3,
        warningDays: 1,
        observedDays: 78,
      },
    ],
  });
  const recommendation = result.recommendations[0];

  assert.equal(recommendation.scoreBreakdown.sunshineProxy, 0);
  assert.equal(recommendation.confidence, "낮음");
  assert.match(recommendation.reasons[1], /점수에 반영하지 않았/);
});

test("excludes severely dry apple regions instead of rewarding lower rainfall indefinitely", () => {
  const common = {
    sunshineHours: 220,
    sunshineBaselineHours: 200,
    sunshineRatio: 110,
    averageDayNightRange: 11,
    dayNightRangeBaseline: 10,
    dayNightRangeRatio: 110,
    averageTemperature: 21,
    maxTemperature: 31,
    minTemperature: 11,
    hotDays: 2,
    rainyDays: 8,
    longestRainStreak: 2,
    humidityAverage: 70,
    windAverage: 1.2,
    warningDays: 0,
    observedDays: 43,
    sunshineDataAvailable: true,
  };
  const result = buildAppleRecommendation({
    referenceDate: new Date("2026-09-05T00:00:00Z"),
    sourceStatus: "live",
    windowStart: "2026-07-22",
    windowEnd: "2026-09-02",
    metrics: [
      {
        ...common,
        regionId: "4775000000",
        rainfallMm: 40,
        rainfallBaselineMm: 100,
        rainfallRatio: 40,
      },
      {
        ...common,
        regionId: "4728000000",
        rainfallMm: 80,
        rainfallBaselineMm: 100,
        rainfallRatio: 80,
      },
    ],
  });

  assert.equal(result.recommendations.length, 1);
  assert.equal(result.recommendations[0].region.name, "문경");
  assert.equal(result.candidates.find((item) => item.region.name === "청송").eligibility.status, "excluded");
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
  await assert.rejects(() => createGrapeRecommendations({ date: "2026-02-30" }), /YYYY-MM-DD/);
  await assert.rejects(() => createAppleRecommendations({ date: "2026-02-30" }), /YYYY-MM-DD/);
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

test("reuses a grape recommendation for repeated requests", async () => {
  const first = await getCachedGrapeRecommendations({ date: "2033-08-25", mode: "demo" });
  const second = await getCachedGrapeRecommendations({ date: "2033-08-25", mode: "demo" });

  assert.equal(first.cache.status, "miss");
  assert.equal(second.cache.status, "hit");
  assert.equal(second.cache.ttlSeconds, 1800);
  assert.deepEqual(second.recommendations, first.recommendations);
});

test("reuses an apple recommendation for repeated requests", async () => {
  const first = await getCachedAppleRecommendations({ date: "2034-09-05", mode: "demo" });
  const second = await getCachedAppleRecommendations({ date: "2034-09-05", mode: "demo" });

  assert.equal(first.cache.status, "miss");
  assert.equal(second.cache.status, "hit");
  assert.equal(second.cache.ttlSeconds, 1800);
  assert.deepEqual(second.recommendations, first.recommendations);
});

test("emits the files required by Sites packaging", async () => {
  await access(new URL("../dist/client/index.html", import.meta.url));
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
});
