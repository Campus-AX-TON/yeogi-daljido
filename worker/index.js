const KMA_DAILY_STATISTICS_URL =
  "https://apis.data.go.kr/1360000/FmlandWthrInfoService/getDayStatistics";

const PEAR_CROP_ID = "PA160101";
const RECOMMENDATION_CACHE_TTL_MS = 30 * 60 * 1000;
const recommendationCache = new Map();
const pendingRecommendations = new Map();
const PEAR_REGIONS = [
  { id: "4122000000", name: "평택", province: "경기", latitude: 36.9877, longitude: 127.1088 },
  { id: "4413100000", name: "천안", province: "충남", latitude: 36.7622, longitude: 127.2928 },
  { id: "4420000000", name: "아산", province: "충남", latitude: 36.8458, longitude: 126.8654 },
  { id: "4155000000", name: "안성", province: "경기", latitude: 37.0037, longitude: 127.2502 },
  { id: "4725000000", name: "상주", province: "경북", latitude: 36.4084, longitude: 128.1574 },
];

const DEMO_METRICS = [
  { regionId: "4122000000", sunshineRatio: 112, hotDays: 1, rainfallMm: 8, rainfallRatio: 82, warningDays: 0 },
  { regionId: "4413100000", sunshineRatio: 106, hotDays: 1, rainfallMm: 12, rainfallRatio: 108, warningDays: 0 },
  { regionId: "4420000000", sunshineRatio: 103, hotDays: 2, rainfallMm: 15, rainfallRatio: 138, warningDays: 0 },
  { regionId: "4155000000", sunshineRatio: 98, hotDays: 3, rainfallMm: 24, rainfallRatio: 181, warningDays: 1 },
  { regionId: "4725000000", sunshineRatio: 109, hotDays: 4, rainfallMm: 11, rainfallRatio: 95, warningDays: 0 },
];

const SOURCE_LINKS = {
  weather: "https://www.data.go.kr/data/15059518/openapi.do",
  varieties: "https://www.rda.go.kr/middlePopOpenPopNongsaroDBView.do?no=2019",
  heatRisk:
    "https://www.rda.go.kr/board/board.do?boardId=farmprmninfo&currPage=1&dataNo=100000812078&mode=updateCnt&prgId=day_farmprmninfoEntry",
};

const RULES = {
  model: "pear-weather-suitability-v0.1",
  label: "배 산지 기상 적합도",
  disclaimer: "실제 당도를 예측하는 모델이 아니라 수확 전 기상 여건을 비교하는 프로토타입 지표입니다.",
  observationWindow: {
    startDaysBefore: 14,
    endDaysBefore: 3,
    historicalYears: 3,
  },
  scoring: [
    {
      id: "sunshine",
      label: "평년 대비 일조",
      weight: 60,
      description: "최근 누적 일조시간을 같은 지역·같은 기간의 3개년 평균과 비교합니다.",
    },
    {
      id: "heat",
      label: "고온 위험",
      weight: 25,
      description: "일 최고기온 31℃ 이상인 날이 많을수록 감점합니다.",
    },
    {
      id: "rain",
      label: "강수 급변 위험",
      weight: 15,
      description: "평년 대비 강수와 기상특보 발생을 위험 신호로 반영합니다.",
    },
  ],
};

function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return null;

  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function compactDate(date) {
  return formatDate(date).replaceAll("-", "");
}

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function addYears(date, years) {
  const result = new Date(date);
  result.setUTCFullYear(result.getUTCFullYear() + years);
  return result;
}

function todayInKorea(now = new Date()) {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function getCultivar(date) {
  const monthDay = formatDate(date).slice(5);

  if (monthDay < "08-01" || monthDay > "11-05") {
    return { name: "저장 배", status: "생과 비제철", season: "산지별 저장 출하" };
  }
  if (monthDay < "08-20") {
    return { name: "원황", status: "출하 임박", season: "8월 하순~9월 상순" };
  }
  if (monthDay <= "09-05") {
    return { name: "원황", status: "제철", season: "8월 하순~9월 상순" };
  }
  if (monthDay <= "09-20") {
    return { name: "슈퍼골드·황금배", status: "제철", season: "9월 상·중순" };
  }
  if (monthDay <= "10-10") {
    return { name: "화산·신고", status: "제철", season: "9월 하순~10월 상순" };
  }
  if (monthDay <= "11-05") {
    return { name: "추황배·만황", status: "제철", season: "10월 중·하순" };
  }

  return { name: "저장 배", status: "생과 비제철", season: "산지별 저장 출하" };
}

function number(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sum(items, field) {
  return items.reduce((total, item) => total + number(item[field]), 0);
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function round(value, digits = 0) {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

function unwrapItems(payload) {
  const response = payload?.response ?? payload;
  const header = response?.header ?? {};
  const resultCode = String(header.resultCode ?? payload?.resultCode ?? "00");

  if (resultCode === "03") return [];

  if (resultCode !== "00") {
    const error = new Error(header.resultMsg ?? payload?.resultMsg ?? `KMA API error ${resultCode}`);
    error.code = resultCode;
    throw error;
  }

  const item = response?.body?.items?.item ?? payload?.items?.item ?? [];
  if (Array.isArray(item)) return item;
  return item ? [item] : [];
}

function normalizeServiceKey(serviceKey) {
  try {
    return decodeURIComponent(serviceKey);
  } catch {
    return serviceKey;
  }
}

export async function fetchKmaDailyStatistics({
  serviceKey,
  region,
  startDate,
  endDate,
  fetchImpl = fetch,
}) {
  const url = new URL(KMA_DAILY_STATISTICS_URL);
  url.search = new URLSearchParams({
    ServiceKey: normalizeServiceKey(serviceKey),
    pageNo: "1",
    numOfRows: "100",
    dataType: "JSON",
    ST_YMD: compactDate(startDate),
    ED_YMD: compactDate(endDate),
    AREA_ID: region.id,
    PA_CROP_SPE_ID: PEAR_CROP_ID,
  }).toString();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        headers: { accept: "application/json" },
      });

      if (!response.ok) {
        const error = new Error(`KMA API HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }

      return unwrapItems(await response.json());
    } catch (error) {
      const isRetriable =
        error?.message === "DB_ERROR" ||
        error?.code === "01" ||
        error?.code === "02" ||
        [429, 500, 502, 503, 504].includes(error?.status);
      if (!isRetriable || attempt === 2) throw error;
      await delay(500 * (attempt + 1));
    }
  }
}

async function collectLiveMetrics({ serviceKey, referenceDate, fetchImpl }) {
  const windowStart = addDays(referenceDate, -RULES.observationWindow.startDaysBefore);
  const windowEnd = addDays(referenceDate, -RULES.observationWindow.endDaysBefore);

  const metrics = await mapWithConcurrency(
    PEAR_REGIONS,
    2,
    async (region) => {
      const recent = await fetchKmaDailyStatistics({
        serviceKey,
        region,
        startDate: windowStart,
        endDate: windowEnd,
        fetchImpl,
      });

      if (recent.length === 0) {
        const error = new Error(`${region.name}의 최근 기상 관측값이 없습니다.`);
        error.code = "NO_DATA";
        throw error;
      }

      const historicalWindows = [];
      for (let offset = 1; offset <= RULES.observationWindow.historicalYears; offset += 1) {
        const historical = await fetchKmaDailyStatistics({
          serviceKey,
          region,
          startDate: addYears(windowStart, -offset),
          endDate: addYears(windowEnd, -offset),
          fetchImpl,
        });
        if (historical.length === 0) {
          const error = new Error(`${region.name}의 ${offset}년 전 기준 관측값이 없습니다.`);
          error.code = "NO_DATA";
          throw error;
        }
        historicalWindows.push(historical);
      }

      const recentSunshine = sum(recent, "daySumSs");
      const historicalSunshine = historicalWindows.map((items) => sum(items, "daySumSs"));
      const recentRainfall = sum(recent, "daySumRn");
      const historicalRainfall = historicalWindows.map((items) => sum(items, "daySumRn"));
      const sunshineBaseline = average(historicalSunshine);
      const rainfallBaseline = average(historicalRainfall);

      return {
        regionId: region.id,
        sunshineHours: round(recentSunshine, 1),
        sunshineBaselineHours: round(sunshineBaseline, 1),
        sunshineRatio: sunshineBaseline > 0 ? round((recentSunshine / sunshineBaseline) * 100) : 100,
        hotDays: recent.filter((item) => number(item.dayMaxTa) >= 31).length,
        maxTemperature: round(Math.max(...recent.map((item) => number(item.dayMaxTa))), 1),
        rainfallMm: round(recentRainfall, 1),
        rainfallBaselineMm: round(rainfallBaseline, 1),
        rainfallRatio: rainfallBaseline > 0 ? round((recentRainfall / rainfallBaseline) * 100) : 100,
        humidityAverage: round(average(recent.map((item) => number(item.dayAvgRhm))), 1),
        warningDays: recent.filter((item) => number(item.wmCount ?? item.wrnCount) > 0).length,
        observedDays: recent.length,
      };
    },
  );

  return {
    metrics,
    windowStart: formatDate(windowStart),
    windowEnd: formatDate(windowEnd),
  };
}

function scoreMetrics(metric) {
  const sunshine = round(clamp(45 + (metric.sunshineRatio - 100) * 0.75, 0, 60));
  const heat = round(clamp(25 - metric.hotDays * 5, 0, 25));
  const rainAnomalyPenalty = metric.rainfallRatio >= 250 ? 10 : metric.rainfallRatio >= 150 ? 5 : 0;
  const rain = round(clamp(15 - rainAnomalyPenalty - metric.warningDays * 5, 0, 15));

  return {
    total: sunshine + heat + rain,
    breakdown: { sunshine, heat, rain },
  };
}

function getRisk(metric) {
  if (metric.hotDays >= 4 || metric.warningDays >= 2 || metric.rainfallRatio >= 250) return "높음";
  if (metric.hotDays >= 2 || metric.warningDays >= 1 || metric.rainfallRatio >= 150) return "주의";
  return "낮음";
}

function buildReasons(metric) {
  const sunshineDifference = metric.sunshineRatio - 100;
  const sunshineReason =
    sunshineDifference >= 0
      ? `일조량이 3개년 같은 기간 평균보다 ${sunshineDifference}% 많아요.`
      : `일조량이 3개년 같은 기간 평균보다 ${Math.abs(sunshineDifference)}% 적어요.`;

  const heatReason =
    metric.hotDays === 0
      ? "31℃ 이상 고온일이 없어 고온 위험이 낮아요."
      : `31℃ 이상 고온일이 ${metric.hotDays}일 관측됐어요.`;

  const rainReason =
    metric.warningDays > 0
      ? `관측 기간 중 기상특보가 ${metric.warningDays}일 있었어요.`
      : `최근 누적 강수량은 ${metric.rainfallMm}mm이고 기상특보는 없었어요.`;

  return [sunshineReason, heatReason, rainReason];
}

function enrichMetric(metric, sourceStatus) {
  const region = PEAR_REGIONS.find((candidate) => candidate.id === metric.regionId);
  const score = scoreMetrics(metric);

  return {
    region,
    score: score.total,
    scoreBreakdown: score.breakdown,
    risk: getRisk(metric),
    metrics: {
      sunshineRatio: metric.sunshineRatio,
      sunshineHours: metric.sunshineHours ?? null,
      sunshineBaselineHours: metric.sunshineBaselineHours ?? null,
      hotDays: metric.hotDays,
      maxTemperature: metric.maxTemperature ?? null,
      rainfallMm: metric.rainfallMm,
      rainfallRatio: metric.rainfallRatio,
      rainfallBaselineMm: metric.rainfallBaselineMm ?? null,
      humidityAverage: metric.humidityAverage ?? null,
      warningDays: metric.warningDays,
      observedDays: metric.observedDays ?? 12,
    },
    availability: {
      status: "unverified",
      label: "출하 데이터 연결 전",
    },
    reasons: buildReasons(metric),
    confidence: sourceStatus === "live" ? "보통" : "낮음",
  };
}

function buildDashboard(regions) {
  return {
    charts: [
      {
        id: "sunshine",
        type: "bar",
        title: "평년 대비 일조",
        unit: "%",
        baseline: 100,
        values: regions.map(({ region, metrics }) => ({ region: region.name, value: metrics.sunshineRatio })),
      },
      {
        id: "heat",
        type: "bar",
        title: "31℃ 이상 고온일",
        unit: "일",
        preferredDirection: "lower",
        values: regions.map(({ region, metrics }) => ({ region: region.name, value: metrics.hotDays })),
      },
      {
        id: "rain",
        type: "bar",
        title: "최근 누적 강수",
        unit: "mm",
        preferredDirection: "contextual",
        values: regions.map(({ region, metrics }) => ({ region: region.name, value: metrics.rainfallMm })),
      },
      {
        id: "scoreBreakdown",
        type: "stacked-bar",
        title: "추천 점수 구성",
        unit: "점",
        values: regions.map(({ region, scoreBreakdown }) => ({ region: region.name, ...scoreBreakdown })),
      },
    ],
  };
}

export function buildPearRecommendation({
  metrics,
  referenceDate,
  sourceStatus,
  windowStart,
  windowEnd,
  requestedDate = formatDate(referenceDate),
  fallbackYears = 0,
}) {
  const ranked = metrics
    .map((metric) => enrichMetric(metric, sourceStatus))
    .sort((left, right) => right.score - left.score || right.metrics.sunshineRatio - left.metrics.sunshineRatio)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return {
    fruit: { id: "pear", name: "배", cultivar: getCultivar(referenceDate) },
    referenceDate: formatDate(referenceDate),
    observationWindow: { start: windowStart, end: windowEnd },
    rules: RULES,
    recommendations: ranked.slice(0, 3),
    candidates: ranked,
    dashboard: buildDashboard(ranked),
    source: {
      status: sourceStatus,
      label: sourceStatus === "live" ? "기상청 실측 자료" : "UI 개발용 합성 데이터",
      requestedDate,
      fallbackYears,
      note:
        fallbackYears > 0
          ? `요청 시점 자료가 없어 ${fallbackYears}년 전 같은 기간의 최신 가용 실측 자료를 사용했습니다.`
          : null,
      updatedAt: new Date().toISOString(),
      links: SOURCE_LINKS,
    },
  };
}

export async function createPearRecommendations({
  serviceKey,
  date = todayInKorea(),
  mode = "auto",
  fetchImpl = fetch,
} = {}) {
  const referenceDate = parseDate(date);
  if (!referenceDate) {
    const error = new Error("date는 YYYY-MM-DD 형식이어야 합니다.");
    error.status = 400;
    throw error;
  }

  const shouldUseLiveData = mode === "live" || (mode === "auto" && serviceKey);
  if (!["auto", "live", "demo"].includes(mode)) {
    const error = new Error("mode는 auto, live, demo 중 하나여야 합니다.");
    error.status = 400;
    throw error;
  }
  if (mode === "live" && !serviceKey) {
    const error = new Error("실측 모드에는 DATA_GO_KR_SERVICE_KEY가 필요합니다.");
    error.status = 503;
    throw error;
  }

  const windowStartDate = addDays(referenceDate, -RULES.observationWindow.startDaysBefore);
  const windowEndDate = addDays(referenceDate, -RULES.observationWindow.endDaysBefore);

  if (!shouldUseLiveData) {
    return buildPearRecommendation({
      metrics: DEMO_METRICS,
      referenceDate,
      sourceStatus: "demo",
      windowStart: formatDate(windowStartDate),
      windowEnd: formatDate(windowEndDate),
    });
  }

  let live;
  let liveReferenceDate = referenceDate;
  let fallbackYears = 0;

  for (let offset = 0; offset <= 2; offset += 1) {
    liveReferenceDate = addYears(referenceDate, -offset);
    try {
      live = await collectLiveMetrics({ serviceKey, referenceDate: liveReferenceDate, fetchImpl });
      fallbackYears = offset;
      break;
    } catch (error) {
      if (error?.code !== "NO_DATA" || offset === 2) throw error;
    }
  }

  return buildPearRecommendation({
    metrics: live.metrics,
    referenceDate: liveReferenceDate,
    sourceStatus: "live",
    windowStart: live.windowStart,
    windowEnd: live.windowEnd,
    requestedDate: formatDate(referenceDate),
    fallbackYears,
  });
}

function withCacheMetadata(result, status, expiresAt) {
  return {
    ...result,
    cache: {
      status,
      ttlSeconds: RECOMMENDATION_CACHE_TTL_MS / 1000,
      expiresAt: new Date(expiresAt).toISOString(),
    },
  };
}

export async function getCachedPearRecommendations({
  serviceKey,
  date = todayInKorea(),
  mode = "auto",
  fetchImpl = fetch,
} = {}) {
  const cacheKey = `${date}:${mode}:${Boolean(serviceKey)}`;
  const now = Date.now();
  const cached = recommendationCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return withCacheMetadata(cached.result, "hit", cached.expiresAt);
  }
  if (cached) recommendationCache.delete(cacheKey);

  const pending = pendingRecommendations.get(cacheKey);
  if (pending) {
    const entry = await pending;
    return withCacheMetadata(entry.result, "shared", entry.expiresAt);
  }

  const request = createPearRecommendations({ serviceKey, date, mode, fetchImpl }).then((result) => {
    const entry = { result, expiresAt: Date.now() + RECOMMENDATION_CACHE_TTL_MS };
    recommendationCache.set(cacheKey, entry);
    return entry;
  });
  pendingRecommendations.set(cacheKey, request);

  try {
    const entry = await request;
    return withCacheMetadata(entry.result, "miss", entry.expiresAt);
  } finally {
    pendingRecommendations.delete(cacheKey);
  }
}

async function handleApi(request, env) {
  const url = new URL(request.url);

  if (url.pathname === "/api/health") {
    return json({ ok: true, weatherApiConfigured: Boolean(env.DATA_GO_KR_SERVICE_KEY) });
  }

  if (url.pathname === "/api/recommendations/pear" && request.method === "GET") {
    try {
      const result = await getCachedPearRecommendations({
        serviceKey: env.DATA_GO_KR_SERVICE_KEY,
        date: url.searchParams.get("date") ?? todayInKorea(),
        mode: url.searchParams.get("mode") ?? "auto",
      });

      const cacheControl = result.source.status === "live" ? "public, max-age=900, s-maxage=21600" : "no-store";
      return json(result, {
        headers: { "cache-control": cacheControl, "x-pear-cache": result.cache.status },
      });
    } catch (error) {
      return json(
        {
          error: "PEAR_RECOMMENDATION_FAILED",
          message: error instanceof Error ? error.message : "추천 데이터를 만들지 못했습니다.",
        },
        { status: error?.status ?? 502, headers: { "cache-control": "no-store" } },
      );
    }
  }

  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      const apiResponse = await handleApi(request, env);
      return apiResponse ?? json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const response = await env.ASSETS.fetch(request);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

    if (response.status !== 404 || !acceptsHtml || !["GET", "HEAD"].includes(request.method)) {
      return response;
    }

    const indexUrl = new URL(request.url);
    indexUrl.pathname = "/index.html";
    indexUrl.search = "";
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
