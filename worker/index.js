const KMA_DAILY_STATISTICS_URL =
  "https://apis.data.go.kr/1360000/FmlandWthrInfoService/getDayStatistics";

const PEAR_CROP_ID = "PA160101";
const GRAPE_CROP_ID = "PA340101";
const APPLE_CROP_ID = "PA200101";
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

const GRAPE_REGIONS = [
  { id: "4374000000", name: "영동", province: "충북", latitude: 36.175, longitude: 127.7834 },
  { id: "4715000000", name: "김천", province: "경북", latitude: 36.1398, longitude: 128.1136 },
  { id: "4723000000", name: "영천", province: "경북", latitude: 35.9733, longitude: 128.9386 },
  { id: "4725000000", name: "상주", province: "경북", latitude: 36.4109, longitude: 128.1591 },
  { id: "4159000000", name: "화성", province: "경기", latitude: 37.1995, longitude: 126.8312 },
  { id: "4373000000", name: "옥천", province: "충북", latitude: 36.3064, longitude: 127.5714 },
  { id: "4182000000", name: "가평", province: "경기", latitude: 37.8315, longitude: 127.5096 },
];

const APPLE_REGIONS = [
  { id: "4775000000", name: "청송", province: "경북", latitude: 36.4363, longitude: 129.0571 },
  { id: "4728000000", name: "문경", province: "경북", latitude: 36.5865, longitude: 128.1868 },
  { id: "4721000000", name: "영주", province: "경북", latitude: 36.8057, longitude: 128.624 },
  { id: "4717000000", name: "안동", province: "경북", latitude: 36.5684, longitude: 128.7294 },
  { id: "4773000000", name: "의성", province: "경북", latitude: 36.3527, longitude: 128.6972 },
  { id: "2772000000", name: "군위", province: "대구", latitude: 36.2429, longitude: 128.5728 },
  { id: "4725000000", name: "상주", province: "경북", latitude: 36.4109, longitude: 128.1591 },
  { id: "4313000000", name: "충주", province: "충북", latitude: 36.991, longitude: 127.9259 },
  { id: "4574000000", name: "장수", province: "전북", latitude: 35.6473, longitude: 127.5212 },
  { id: "4573000000", name: "무주", province: "전북", latitude: 36.0069, longitude: 127.6608 },
  { id: "4888000000", name: "거창", province: "경남", latitude: 35.6867, longitude: 127.9095 },
  { id: "4481000000", name: "예산", province: "충남", latitude: 36.6828, longitude: 126.8489 },
  { id: "4827000000", name: "밀양", province: "경남", latitude: 35.5038, longitude: 128.7466 },
];

const DEMO_METRICS = [
  { regionId: "4122000000", sunshineRatio: 112, hotDays: 1, rainfallMm: 8, rainfallRatio: 82, warningDays: 0 },
  { regionId: "4413100000", sunshineRatio: 106, hotDays: 1, rainfallMm: 12, rainfallRatio: 108, warningDays: 0 },
  { regionId: "4420000000", sunshineRatio: 103, hotDays: 2, rainfallMm: 15, rainfallRatio: 138, warningDays: 0 },
  { regionId: "4155000000", sunshineRatio: 98, hotDays: 3, rainfallMm: 24, rainfallRatio: 181, warningDays: 1 },
  { regionId: "4725000000", sunshineRatio: 109, hotDays: 4, rainfallMm: 11, rainfallRatio: 95, warningDays: 0 },
];

const GRAPE_DEMO_METRICS = [
  {
    regionId: "4374000000",
    gdd: 860,
    gddBaseline: 820,
    gddRatio: 105,
    sunshineHours: 426,
    sunshineBaselineHours: 404,
    sunshineRatio: 105,
    rainfallMm: 438,
    rainfallBaselineMm: 462,
    rainfallRatio: 95,
    averageTemperature: 23.1,
    hotDays: 9,
    rainyDays: 27,
    longestRainStreak: 4,
    humidityAverage: 73,
    windAverage: 1.4,
    warningDays: 2,
    observedDays: 78,
  },
  {
    regionId: "4715000000",
    gdd: 892,
    gddBaseline: 844,
    gddRatio: 106,
    sunshineHours: 445,
    sunshineBaselineHours: 421,
    sunshineRatio: 106,
    rainfallMm: 471,
    rainfallBaselineMm: 452,
    rainfallRatio: 104,
    averageTemperature: 23.5,
    hotDays: 12,
    rainyDays: 25,
    longestRainStreak: 3,
    humidityAverage: 71,
    windAverage: 1.2,
    warningDays: 2,
    observedDays: 78,
  },
  {
    regionId: "4723000000",
    gdd: 904,
    gddBaseline: 858,
    gddRatio: 105,
    sunshineHours: 452,
    sunshineBaselineHours: 430,
    sunshineRatio: 105,
    rainfallMm: 410,
    rainfallBaselineMm: 443,
    rainfallRatio: 93,
    averageTemperature: 23.6,
    hotDays: 13,
    rainyDays: 23,
    longestRainStreak: 3,
    humidityAverage: 69,
    windAverage: 1.5,
    warningDays: 1,
    observedDays: 78,
  },
  {
    regionId: "4725000000",
    gdd: 875,
    gddBaseline: 836,
    gddRatio: 105,
    sunshineHours: 437,
    sunshineBaselineHours: 416,
    sunshineRatio: 105,
    rainfallMm: 492,
    rainfallBaselineMm: 468,
    rainfallRatio: 105,
    averageTemperature: 23.3,
    hotDays: 10,
    rainyDays: 28,
    longestRainStreak: 5,
    humidityAverage: 74,
    windAverage: 1.3,
    warningDays: 2,
    observedDays: 78,
  },
  {
    regionId: "4159000000",
    gdd: 828,
    gddBaseline: 806,
    gddRatio: 103,
    sunshineHours: 405,
    sunshineBaselineHours: 398,
    sunshineRatio: 102,
    rainfallMm: 521,
    rainfallBaselineMm: 479,
    rainfallRatio: 109,
    averageTemperature: 22.8,
    hotDays: 7,
    rainyDays: 30,
    longestRainStreak: 5,
    humidityAverage: 76,
    windAverage: 1.8,
    warningDays: 3,
    observedDays: 78,
  },
  {
    regionId: "4373000000",
    gdd: 848,
    gddBaseline: 819,
    gddRatio: 104,
    sunshineHours: 418,
    sunshineBaselineHours: 407,
    sunshineRatio: 103,
    rainfallMm: 449,
    rainfallBaselineMm: 460,
    rainfallRatio: 98,
    averageTemperature: 23,
    hotDays: 8,
    rainyDays: 26,
    longestRainStreak: 4,
    humidityAverage: 74,
    windAverage: 1.3,
    warningDays: 1,
    observedDays: 78,
  },
  {
    regionId: "4182000000",
    gdd: 781,
    gddBaseline: 770,
    gddRatio: 101,
    sunshineHours: 389,
    sunshineBaselineHours: 393,
    sunshineRatio: 99,
    rainfallMm: 540,
    rainfallBaselineMm: 501,
    rainfallRatio: 108,
    averageTemperature: 22.1,
    hotDays: 5,
    rainyDays: 31,
    longestRainStreak: 5,
    humidityAverage: 77,
    windAverage: 1.1,
    warningDays: 2,
    observedDays: 78,
  },
];

const APPLE_DEMO_METRICS = APPLE_REGIONS.map((region, index) => ({
  regionId: region.id,
  sunshineHours: 248 - index * 4,
  sunshineBaselineHours: 230,
  sunshineRatio: round(((248 - index * 4) / 230) * 100),
  rainfallMm: 118 + index * 9,
  rainfallBaselineMm: 150,
  rainfallRatio: round(((118 + index * 9) / 150) * 100),
  averageDayNightRange: round(10.8 - index * 0.15, 1),
  dayNightRangeBaseline: 9.8,
  dayNightRangeRatio: round(((10.8 - index * 0.15) / 9.8) * 100),
  averageTemperature: round(22.4 + index * 0.1, 1),
  maxTemperature: round(31.2 + index * 0.2, 1),
  minTemperature: round(13.1 + index * 0.1, 1),
  hotDays: 2 + Math.floor(index / 4),
  rainyDays: 11 + Math.floor(index / 3),
  longestRainStreak: 2 + Math.floor(index / 5),
  humidityAverage: 70 + Math.floor(index / 3),
  windAverage: round(1.1 + index * 0.05, 1),
  warningDays: Math.floor(index / 5),
  observedDays: 43,
  sunshineDataAvailable: true,
}));

const SOURCE_LINKS = {
  weather: "https://www.data.go.kr/data/15059518/openapi.do",
  varieties: "https://www.rda.go.kr/middlePopOpenPopNongsaroDBView.do?no=2019",
  heatRisk:
    "https://www.rda.go.kr/board/board.do?boardId=farmprmninfo&currPage=1&dataNo=100000812078&mode=updateCnt&prgId=day_farmprmninfoEntry",
};

const GRAPE_SOURCE_LINKS = {
  weather: "https://www.data.go.kr/data/15059518/openapi.do",
  harvestGuide: "https://www.rda.go.kr/middlePopOpenPopNongsaroDBView.do?no=1548",
  evidence:
    "https://app.notion.com/p/3bb41d2e95b380ffaecaea9b2b4f354d",
};

const APPLE_SOURCE_LINKS = {
  weather: "https://www.data.go.kr/data/15059518/openapi.do",
  qualityEvidence:
    "https://repository.krei.re.kr/bitstream/2018.oak/14894/1/%EC%82%AC%EA%B3%BC%20%EC%83%9D%EC%82%B0%EA%B4%80%EC%B8%A1%20%EA%B0%9C%EC%84%A0%EB%B0%A9%EC%95%88%20%EC%97%B0%EA%B5%AC.pdf",
  cultivarSeason:
    "https://www.rda.go.kr/board/board.do?boardId=farmprmninfo&currPage=67&dataNo=100000802112&mode=updateCnt&prgId=day_farmprmninfoEntry",
  researchMemo: "https://app.notion.com/p/3bb41d2e95b380ffaecaea9b2b4f354d",
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

const GRAPE_RULES = {
  model: "grape-weather-suitability-v0.1",
  label: "캠벨얼리 포도 생육기상 적합도",
  disclaimer:
    "실제 당도나 개별 상품 품질을 예측하는 모델이 아닙니다. 캠벨얼리 기준 기상 조건을 비교하며, 일사량 대신 일조시간을 대체지표로 사용합니다.",
  observationWindow: {
    startDaysBefore: 80,
    endDaysBefore: 3,
    historicalYears: 3,
    baseTemperatureCelsius: 10,
  },
  scoring: [
    {
      id: "temperature",
      label: "누적 생육온도",
      weight: 34,
      sourceFields: ["dayMaxTa", "dayMinTa"],
      description: "일 최고·최저기온으로 GDD를 계산하고 같은 지역의 최근 3개년 동기간과 비교합니다.",
    },
    {
      id: "moisture",
      label: "수분 안정성",
      weight: 33,
      sourceFields: ["daySumRn"],
      description: "시즌 누적강수가 같은 지역의 최근 3개년 동기간에서 크게 벗어나지 않는지 봅니다.",
    },
    {
      id: "sunshineProxy",
      label: "일조 대체지표",
      weight: 33,
      sourceFields: ["daySumSs"],
      description: "현재 API에 일사량이 없어 누적 일조시간을 조건부 대체지표로 사용합니다.",
    },
  ],
  excludedFromScore: [
    { id: "dayNightRange", label: "일교차", reason: "당도 직접 근거가 부족해 점수에서 제외합니다." },
    { id: "humidity", label: "습도", reason: "병해·열과 참고값으로만 표시합니다." },
    { id: "wind", label: "풍속", reason: "생산 위험 참고값으로만 표시합니다." },
    { id: "warning", label: "기상특보", reason: "재해 위험 참고값으로만 표시합니다." },
  ],
};

const APPLE_RULES = {
  model: "apple-weather-suitability-v0.1",
  label: "사과 착색·당도 형성기상 적합도",
  disclaimer:
    "실제 당도·산도·경도·착색도나 개별 상품 품질을 예측하지 않습니다. 수확 전 기상 여건을 지역별 최근 3개년 동기간과 비교하는 프로토타입 지표입니다.",
  observationWindow: {
    startDaysBefore: 45,
    endDaysBefore: 3,
    historicalYears: 3,
    droughtExclusionRatio: 50,
  },
  scoring: [
    {
      id: "sunshine",
      label: "일조 여건",
      weight: 40,
      sourceFields: ["daySumSs"],
      description: "수확 전 누적 일조시간을 같은 지역의 최근 3개년 같은 기간 평균과 비교합니다.",
    },
    {
      id: "rainfall",
      label: "강수 여건",
      weight: 40,
      sourceFields: ["daySumRn"],
      description:
        "과습은 감점하되 평년 강수의 50% 미만인 강한 건조는 가뭄 위험으로 추천에서 제외합니다.",
    },
    {
      id: "dayNightRange",
      label: "일교차 보조지표",
      weight: 20,
      sourceFields: ["dayMaxTa", "dayMinTa"],
      description: "일 최고·최저기온 차의 기간 평균을 같은 지역의 최근 3개년 평균과 비교합니다.",
    },
  ],
  excludedFromScore: [
    { id: "heat", label: "30℃ 이상 고온일", reason: "착색 저해 위험을 설명하는 참고값으로 표시합니다." },
    { id: "humidity", label: "습도", reason: "병해 위험을 해석하는 참고값으로 표시합니다." },
    { id: "wind", label: "풍속", reason: "낙과·재해 위험을 해석하는 참고값으로 표시합니다." },
    { id: "warning", label: "기상특보", reason: "재해 위험을 해석하는 참고값으로 표시합니다." },
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

function getAppleCultivar(date) {
  const monthDay = formatDate(date).slice(5);

  if (monthDay < "08-15" || monthDay > "11-20") {
    return { name: "저장 사과", status: "생과 비제철", season: "산지별 저장 출하" };
  }
  if (monthDay < "08-25") {
    return { name: "홍로·아리수", status: "출하 임박", season: "8월 하순~9월 중순" };
  }
  if (monthDay <= "09-20") {
    return { name: "홍로·아리수", status: "제철", season: "8월 하순~9월 중순" };
  }
  if (monthDay <= "10-15") {
    return { name: "감홍 등 중생종", status: "제철", season: "9월 하순~10월 중순" };
  }
  return { name: "후지", status: "제철", season: "10월 하순~11월 중순" };
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

function normalizeObservationDate(value) {
  return String(value ?? "").slice(0, 10);
}

function normalizeDailyRows(rows) {
  const byDate = new Map();

  for (const row of rows) {
    const date = normalizeObservationDate(row.ymd);
    if (!date) continue;

    const warningCode = row.wmCd ?? row.wrnCd;
    const existing = byDate.get(date);
    if (existing) {
      if (warningCode) existing.warningCodes.add(warningCode);
      existing.warningCount = Math.max(existing.warningCount, number(row.wmCount ?? row.wrnCount));
      continue;
    }

    byDate.set(date, {
      date,
      areaId: row.areaId,
      areaName: row.areaName,
      cropName: row.paCropName,
      cropId: row.paCropSpeId,
      cultivarName: row.paCropSpeName,
      averageTemperature: number(row.dayAvgTa),
      maximumTemperature: number(row.dayMaxTa),
      minimumTemperature: number(row.dayMinTa),
      averageHumidity: number(row.dayAvgRhm),
      minimumHumidity: number(row.dayMinRhm),
      rainfallMm: number(row.daySumRn),
      averageWindSpeed: number(row.dayAvgWs),
      sunshineHours: number(row.daySumSs),
      warningCount: number(row.wmCount ?? row.wrnCount),
      warningCodes: new Set(warningCode ? [warningCode] : []),
    });
  }

  return [...byDate.values()]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((row) => ({ ...row, warningCodes: [...row.warningCodes].sort() }));
}

function calculateGdd(rows, baseTemperature) {
  return rows.reduce((total, row) => {
    const dailyMean = (row.maximumTemperature + row.minimumTemperature) / 2;
    return total + Math.max(0, dailyMean - baseTemperature);
  }, 0);
}

function longestRainStreak(rows) {
  let longest = 0;
  let current = 0;

  for (const row of rows) {
    current = row.rainfallMm > 0 ? current + 1 : 0;
    longest = Math.max(longest, current);
  }

  return longest;
}

function summarizeGrapeRows(rows) {
  const gdd = calculateGdd(rows, GRAPE_RULES.observationWindow.baseTemperatureCelsius);

  return {
    gdd: round(gdd, 1),
    sunshineHours: round(rows.reduce((total, row) => total + row.sunshineHours, 0), 1),
    rainfallMm: round(rows.reduce((total, row) => total + row.rainfallMm, 0), 1),
    averageTemperature: round(average(rows.map((row) => row.averageTemperature)), 1),
    hotDays: rows.filter((row) => row.maximumTemperature >= 31).length,
    rainyDays: rows.filter((row) => row.rainfallMm > 0).length,
    longestRainStreak: longestRainStreak(rows),
    humidityAverage: round(average(rows.map((row) => row.averageHumidity)), 1),
    windAverage: round(average(rows.map((row) => row.averageWindSpeed)), 1),
    warningDays: rows.filter((row) => row.warningCount > 0).length,
    observedDays: rows.length,
  };
}

function summarizeAppleRows(rows) {
  return {
    sunshineHours: round(rows.reduce((total, row) => total + row.sunshineHours, 0), 1),
    rainfallMm: round(rows.reduce((total, row) => total + row.rainfallMm, 0), 1),
    averageDayNightRange: round(
      average(rows.map((row) => Math.max(0, row.maximumTemperature - row.minimumTemperature))),
      1,
    ),
    averageTemperature: round(average(rows.map((row) => row.averageTemperature)), 1),
    maxTemperature: round(Math.max(...rows.map((row) => row.maximumTemperature)), 1),
    minTemperature: round(Math.min(...rows.map((row) => row.minimumTemperature)), 1),
    hotDays: rows.filter((row) => row.maximumTemperature >= 30).length,
    rainyDays: rows.filter((row) => row.rainfallMm > 0).length,
    longestRainStreak: longestRainStreak(rows),
    humidityAverage: round(average(rows.map((row) => row.averageHumidity)), 1),
    windAverage: round(average(rows.map((row) => row.averageWindSpeed)), 1),
    warningDays: rows.filter((row) => row.warningCount > 0).length,
    observedDays: rows.length,
  };
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
  cropId = PEAR_CROP_ID,
  fetchImpl = fetch,
}) {
  const url = new URL(KMA_DAILY_STATISTICS_URL);
  url.search = new URLSearchParams({
    ServiceKey: normalizeServiceKey(serviceKey),
    pageNo: "1",
    numOfRows: "500",
    dataType: "JSON",
    ST_YMD: compactDate(startDate),
    ED_YMD: compactDate(endDate),
    AREA_ID: region.id,
    PA_CROP_SPE_ID: cropId,
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

async function collectGrapeLiveMetrics({ serviceKey, referenceDate, fetchImpl }) {
  const windowStart = addDays(referenceDate, -GRAPE_RULES.observationWindow.startDaysBefore);
  const windowEnd = addDays(referenceDate, -GRAPE_RULES.observationWindow.endDaysBefore);

  const collected = await mapWithConcurrency(
    GRAPE_REGIONS,
    2,
    async (region) => {
      const recentRaw = await fetchKmaDailyStatistics({
        serviceKey,
        region,
        startDate: windowStart,
        endDate: windowEnd,
        cropId: GRAPE_CROP_ID,
        fetchImpl,
      });
      const recent = normalizeDailyRows(recentRaw);

      if (recent.length === 0) {
        const error = new Error(`${region.name}의 최근 포도 기상 관측값이 없습니다.`);
        error.code = "NO_DATA";
        throw error;
      }

      const historicalSummaries = [];
      for (let offset = 1; offset <= GRAPE_RULES.observationWindow.historicalYears; offset += 1) {
        const historicalStart = addYears(windowStart, -offset);
        const historicalEnd = addYears(windowEnd, -offset);
        const historicalRaw = await fetchKmaDailyStatistics({
          serviceKey,
          region,
          startDate: historicalStart,
          endDate: historicalEnd,
          cropId: GRAPE_CROP_ID,
          fetchImpl,
        });
        const historical = normalizeDailyRows(historicalRaw);

        if (historical.length === 0) {
          const error = new Error(`${region.name}의 ${offset}년 전 포도 기준 관측값이 없습니다.`);
          error.code = "NO_DATA";
          throw error;
        }

        historicalSummaries.push({
          yearOffset: offset,
          start: formatDate(historicalStart),
          end: formatDate(historicalEnd),
          ...summarizeGrapeRows(historical),
        });
      }

      const current = summarizeGrapeRows(recent);
      const gddBaseline = average(historicalSummaries.map((summary) => summary.gdd));
      const sunshineBaseline = average(historicalSummaries.map((summary) => summary.sunshineHours));
      const rainfallBaseline = average(historicalSummaries.map((summary) => summary.rainfallMm));
      const sunshineDataAvailable = current.sunshineHours > 0 && sunshineBaseline > 0;

      return {
        metric: {
          regionId: region.id,
          ...current,
          gddBaseline: round(gddBaseline, 1),
          gddRatio: gddBaseline > 0 ? round((current.gdd / gddBaseline) * 100) : 100,
          sunshineHours: sunshineDataAvailable ? current.sunshineHours : null,
          sunshineBaselineHours: sunshineDataAvailable ? round(sunshineBaseline, 1) : null,
          sunshineRatio: sunshineDataAvailable
            ? round((current.sunshineHours / sunshineBaseline) * 100)
            : null,
          sunshineDataAvailable,
          rainfallBaselineMm: round(rainfallBaseline, 1),
          rainfallRatio: rainfallBaseline > 0 ? round((current.rainfallMm / rainfallBaseline) * 100) : 100,
        },
        evidence: {
          source: "기상청 작물별 농업주산지 상세날씨 일통계",
          rawResponseRows: recentRaw,
          normalizedDailyRows: recent,
          historicalSummaries,
          notes: [
            "같은 날짜에 복수 특보가 있으면 원본 행은 모두 보존하고, 계산용 일자료에서는 기상값을 한 번만 반영합니다.",
            "최근 3개년 원본은 응답 크기와 호출 비용을 줄이기 위해 연도별 계산 요약으로 제공합니다.",
          ],
        },
      };
    },
  );

  return {
    metrics: collected.map(({ metric }) => metric),
    evidenceByRegion: Object.fromEntries(
      collected.map(({ metric, evidence }) => [metric.regionId, evidence]),
    ),
    windowStart: formatDate(windowStart),
    windowEnd: formatDate(windowEnd),
  };
}

async function collectAppleLiveMetrics({ serviceKey, referenceDate, fetchImpl }) {
  const windowStart = addDays(referenceDate, -APPLE_RULES.observationWindow.startDaysBefore);
  const windowEnd = addDays(referenceDate, -APPLE_RULES.observationWindow.endDaysBefore);

  const collected = await mapWithConcurrency(
    APPLE_REGIONS,
    2,
    async (region) => {
      const recentRaw = await fetchKmaDailyStatistics({
        serviceKey,
        region,
        startDate: windowStart,
        endDate: windowEnd,
        cropId: APPLE_CROP_ID,
        fetchImpl,
      });
      const recent = normalizeDailyRows(recentRaw);

      if (recent.length === 0) {
        const error = new Error(`${region.name}의 최근 사과 기상 관측값이 없습니다.`);
        error.code = "NO_DATA";
        throw error;
      }

      const historicalSummaries = [];
      for (let offset = 1; offset <= APPLE_RULES.observationWindow.historicalYears; offset += 1) {
        const historicalStart = addYears(windowStart, -offset);
        const historicalEnd = addYears(windowEnd, -offset);
        const historicalRaw = await fetchKmaDailyStatistics({
          serviceKey,
          region,
          startDate: historicalStart,
          endDate: historicalEnd,
          cropId: APPLE_CROP_ID,
          fetchImpl,
        });
        const historical = normalizeDailyRows(historicalRaw);

        if (historical.length === 0) {
          const error = new Error(`${region.name}의 ${offset}년 전 사과 기준 관측값이 없습니다.`);
          error.code = "NO_DATA";
          throw error;
        }

        historicalSummaries.push({
          yearOffset: offset,
          start: formatDate(historicalStart),
          end: formatDate(historicalEnd),
          ...summarizeAppleRows(historical),
        });
      }

      const current = summarizeAppleRows(recent);
      const sunshineBaseline = average(historicalSummaries.map((summary) => summary.sunshineHours));
      const rainfallBaseline = average(historicalSummaries.map((summary) => summary.rainfallMm));
      const dayNightRangeBaseline = average(
        historicalSummaries.map((summary) => summary.averageDayNightRange),
      );
      const sunshineDataAvailable = current.sunshineHours > 0 && sunshineBaseline > 0;

      return {
        metric: {
          regionId: region.id,
          ...current,
          sunshineHours: sunshineDataAvailable ? current.sunshineHours : null,
          sunshineBaselineHours: sunshineDataAvailable ? round(sunshineBaseline, 1) : null,
          sunshineRatio: sunshineDataAvailable
            ? round((current.sunshineHours / sunshineBaseline) * 100)
            : null,
          sunshineDataAvailable,
          rainfallBaselineMm: round(rainfallBaseline, 1),
          rainfallRatio: rainfallBaseline > 0 ? round((current.rainfallMm / rainfallBaseline) * 100) : 100,
          dayNightRangeBaseline: round(dayNightRangeBaseline, 1),
          dayNightRangeRatio:
            dayNightRangeBaseline > 0
              ? round((current.averageDayNightRange / dayNightRangeBaseline) * 100)
              : 100,
        },
        evidence: {
          source: "기상청 작물별 농업주산지 상세날씨 일통계",
          rawResponseRows: recentRaw,
          normalizedDailyRows: recent,
          historicalSummaries,
          notes: [
            "기상청이 제공한 최근 관측 원본 행을 생략하지 않고 보존합니다.",
            "같은 날짜에 복수 특보가 있으면 원본 행은 모두 보존하고 계산용 일자료에서는 기상값을 한 번만 반영합니다.",
            "최근 3개년 원본은 호출·응답 크기를 줄이기 위해 연도별 계산 요약으로 제공합니다.",
          ],
        },
      };
    },
  );

  return {
    metrics: collected.map(({ metric }) => metric),
    evidenceByRegion: Object.fromEntries(
      collected.map(({ metric, evidence }) => [metric.regionId, evidence]),
    ),
    windowStart: formatDate(windowStart),
    windowEnd: formatDate(windowEnd),
  };
}

function scoreGrapeMetrics(metric) {
  const sunshineDataAvailable = metric.sunshineDataAvailable ?? (metric.sunshineRatio !== null);
  const temperatureFit = clamp(
    70 + (metric.gddRatio - 100) * 2 - Math.max(0, metric.hotDays - 5) * 1.5,
    0,
    100,
  );
  const moistureFit = clamp(100 - Math.abs(metric.rainfallRatio - 100), 0, 100);
  const sunshineProxyFit = sunshineDataAvailable
    ? clamp(70 + (metric.sunshineRatio - 100) * 2, 0, 100)
    : 0;
  const temperature = round((temperatureFit * 34) / 100);
  const moisture = round((moistureFit * 33) / 100);
  const sunshineProxy = round((sunshineProxyFit * 33) / 100);

  return {
    total: temperature + moisture + sunshineProxy,
    breakdown: { temperature, moisture, sunshineProxy },
    componentScores: {
      temperatureFit: round(temperatureFit),
      moistureFit: round(moistureFit),
      sunshineProxyFit: round(sunshineProxyFit),
    },
  };
}

function getGrapeRisk(metric) {
  if (
    metric.hotDays >= 20 ||
    metric.longestRainStreak >= 7 ||
    metric.rainfallRatio >= 160 ||
    metric.warningDays >= 6
  ) {
    return "높음";
  }
  if (
    metric.hotDays >= 10 ||
    metric.longestRainStreak >= 5 ||
    metric.rainfallRatio >= 130 ||
    metric.warningDays >= 3
  ) {
    return "주의";
  }
  return "낮음";
}

function ratioReason(label, ratio) {
  if (ratio === null || ratio === undefined) return `${label} 관측값이 없어 점수에 반영하지 않았어요.`;
  const difference = ratio - 100;
  if (difference === 0) return `${label}이 최근 3개년 같은 기간 평균과 같아요.`;
  return `${label}이 최근 3개년 같은 기간 평균보다 ${Math.abs(difference)}% ${difference > 0 ? "높아요" : "낮아요"}.`;
}

function buildGrapeReasons(metric) {
  return [
    ratioReason("누적 생육온도(GDD)", metric.gddRatio),
    ratioReason("누적 일조시간", metric.sunshineRatio),
    ratioReason("누적 강수량", metric.rainfallRatio),
    `31℃ 이상 고온일 ${metric.hotDays}일, 최장 연속 강우 ${metric.longestRainStreak}일이 관측됐어요.`,
  ];
}

function enrichGrapeMetric(metric, sourceStatus) {
  const region = GRAPE_REGIONS.find((candidate) => candidate.id === metric.regionId);
  const score = scoreGrapeMetrics(metric);

  return {
    region,
    score: score.total,
    scoreBreakdown: score.breakdown,
    componentScores: score.componentScores,
    risk: getGrapeRisk(metric),
    metrics: {
      gdd: metric.gdd,
      gddBaseline: metric.gddBaseline,
      gddRatio: metric.gddRatio,
      averageTemperature: metric.averageTemperature,
      hotDays: metric.hotDays,
      sunshineHours: metric.sunshineHours,
      sunshineBaselineHours: metric.sunshineBaselineHours,
      sunshineRatio: metric.sunshineRatio,
      rainfallMm: metric.rainfallMm,
      rainfallBaselineMm: metric.rainfallBaselineMm,
      rainfallRatio: metric.rainfallRatio,
      rainyDays: metric.rainyDays,
      longestRainStreak: metric.longestRainStreak,
      humidityAverage: metric.humidityAverage,
      windAverage: metric.windAverage,
      warningDays: metric.warningDays,
      observedDays: metric.observedDays,
      sunshineDataAvailable: metric.sunshineDataAvailable ?? (metric.sunshineRatio !== null),
    },
    availability: { status: "unverified", label: "출하 데이터 연결 전" },
    reasons: buildGrapeReasons(metric),
    confidence: sourceStatus === "live" && metric.sunshineDataAvailable !== false ? "보통" : "낮음",
  };
}

function buildGrapeDashboard(regions) {
  return {
    charts: [
      {
        id: "gdd",
        type: "bar",
        title: "3개년 대비 누적 GDD",
        unit: "%",
        baseline: 100,
        values: regions.map(({ region, metrics }) => ({ region: region.name, value: metrics.gddRatio })),
      },
      {
        id: "sunshineProxy",
        type: "bar",
        title: "3개년 대비 누적 일조",
        unit: "%",
        baseline: 100,
        values: regions.map(({ region, metrics }) => ({ region: region.name, value: metrics.sunshineRatio })),
      },
      {
        id: "rainfall",
        type: "bar",
        title: "3개년 대비 누적 강수",
        unit: "%",
        baseline: 100,
        values: regions.map(({ region, metrics }) => ({ region: region.name, value: metrics.rainfallRatio })),
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

function scoreAppleMetrics(metric) {
  const sunshineDataAvailable = metric.sunshineDataAvailable ?? metric.sunshineRatio !== null;
  const droughtExcluded = metric.rainfallRatio < APPLE_RULES.observationWindow.droughtExclusionRatio;
  const sunshineFit = sunshineDataAvailable
    ? clamp(70 + (metric.sunshineRatio - 100) * 2, 0, 100)
    : 0;
  const rainfallFit = droughtExcluded
    ? 0
    : metric.rainfallRatio <= 100
      ? clamp(70 + (100 - metric.rainfallRatio) * 0.6, 0, 100)
      : clamp(100 - (metric.rainfallRatio - 100) * 1.5, 0, 100);
  const dayNightRangeFit = clamp(70 + (metric.dayNightRangeRatio - 100) * 2, 0, 100);
  const sunshine = round((sunshineFit * 40) / 100);
  const rainfall = round((rainfallFit * 40) / 100);
  const dayNightRange = round((dayNightRangeFit * 20) / 100);

  return {
    total: sunshine + rainfall + dayNightRange,
    breakdown: { sunshine, rainfall, dayNightRange },
    componentScores: {
      sunshineFit: round(sunshineFit),
      rainfallFit: round(rainfallFit),
      dayNightRangeFit: round(dayNightRangeFit),
    },
    eligible: !droughtExcluded,
  };
}

function getAppleRisk(metric, eligible) {
  if (!eligible || metric.hotDays >= 12 || metric.longestRainStreak >= 7 || metric.warningDays >= 5) {
    return "높음";
  }
  if (metric.hotDays >= 6 || metric.longestRainStreak >= 4 || metric.warningDays >= 2) return "주의";
  return "낮음";
}

function buildAppleReasons(metric, eligible) {
  const rainReason = !eligible
    ? `누적 강수가 최근 3개년 같은 기간 평균의 ${metric.rainfallRatio}%로, 가뭄 안전선 50%보다 낮아 추천에서 제외했어요.`
    : ratioReason("누적 강수량", metric.rainfallRatio);

  return [
    ratioReason("누적 일조시간", metric.sunshineRatio),
    rainReason,
    ratioReason("평균 일교차 값", metric.dayNightRangeRatio),
    `30℃ 이상 고온일 ${metric.hotDays}일, 최장 연속 강우 ${metric.longestRainStreak}일, 기상특보 ${metric.warningDays}일이 관측됐어요.`,
  ];
}

function enrichAppleMetric(metric, sourceStatus) {
  const region = APPLE_REGIONS.find((candidate) => candidate.id === metric.regionId);
  const score = scoreAppleMetrics(metric);

  return {
    region,
    score: score.total,
    scoreBreakdown: score.breakdown,
    componentScores: score.componentScores,
    eligible: score.eligible,
    eligibility: score.eligible
      ? { status: "eligible", label: "추천 대상" }
      : { status: "excluded", label: "강한 건조로 추천 제외" },
    risk: getAppleRisk(metric, score.eligible),
    metrics: {
      sunshineHours: metric.sunshineHours,
      sunshineBaselineHours: metric.sunshineBaselineHours,
      sunshineRatio: metric.sunshineRatio,
      rainfallMm: metric.rainfallMm,
      rainfallBaselineMm: metric.rainfallBaselineMm,
      rainfallRatio: metric.rainfallRatio,
      averageDayNightRange: metric.averageDayNightRange,
      dayNightRangeBaseline: metric.dayNightRangeBaseline,
      dayNightRangeRatio: metric.dayNightRangeRatio,
      averageTemperature: metric.averageTemperature,
      maxTemperature: metric.maxTemperature,
      minTemperature: metric.minTemperature,
      hotDays: metric.hotDays,
      rainyDays: metric.rainyDays,
      longestRainStreak: metric.longestRainStreak,
      humidityAverage: metric.humidityAverage,
      windAverage: metric.windAverage,
      warningDays: metric.warningDays,
      observedDays: metric.observedDays,
      sunshineDataAvailable: metric.sunshineDataAvailable ?? metric.sunshineRatio !== null,
    },
    availability: { status: "unverified", label: "출하 데이터 연결 전" },
    reasons: buildAppleReasons(metric, score.eligible),
    confidence: sourceStatus === "live" && metric.sunshineDataAvailable !== false ? "보통" : "낮음",
  };
}

function buildAppleDashboard(regions) {
  return {
    charts: [
      {
        id: "sunshine",
        type: "bar",
        title: "3개년 대비 누적 일조",
        unit: "%",
        baseline: 100,
        values: regions.map(({ region, metrics }) => ({ region: region.name, value: metrics.sunshineRatio })),
      },
      {
        id: "rainfall",
        type: "bar",
        title: "3개년 대비 누적 강수",
        unit: "%",
        baseline: 100,
        values: regions.map(({ region, metrics }) => ({ region: region.name, value: metrics.rainfallRatio })),
      },
      {
        id: "dayNightRange",
        type: "bar",
        title: "3개년 대비 평균 일교차",
        unit: "%",
        baseline: 100,
        values: regions.map(({ region, metrics }) => ({
          region: region.name,
          value: metrics.dayNightRangeRatio,
        })),
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

export function buildGrapeRecommendation({
  metrics,
  referenceDate,
  sourceStatus,
  windowStart,
  windowEnd,
  evidenceByRegion = {},
  requestedDate = formatDate(referenceDate),
  fallbackYears = 0,
}) {
  const ranked = metrics
    .map((metric) => enrichGrapeMetric(metric, sourceStatus))
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.componentScores.sunshineProxyFit - left.componentScores.sunshineProxyFit,
    )
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return {
    fruit: {
      id: "grape",
      name: "포도",
      cultivar: {
        name: "캠벨얼리",
        status: "국내 정량 근거 기준",
        season: "만개 후 약 75~80일 성숙",
      },
    },
    referenceDate: formatDate(referenceDate),
    observationWindow: { start: windowStart, end: windowEnd },
    candidateScope: {
      count: GRAPE_REGIONS.length,
      label: `기상청 포도 주산지 ${GRAPE_REGIONS.length}곳 중`,
    },
    rules: GRAPE_RULES,
    recommendations: ranked.slice(0, 3),
    candidates: ranked,
    dashboard: buildGrapeDashboard(ranked),
    dataUsage: {
      scoring: GRAPE_RULES.scoring,
      contextOnly: GRAPE_RULES.excludedFromScore,
      rawFields: [
        { field: "ymd", label: "관측일" },
        { field: "dayAvgTa/dayMaxTa/dayMinTa", label: "평균·최고·최저기온" },
        { field: "dayAvgRhm/dayMinRhm", label: "평균·최저습도" },
        { field: "daySumRn", label: "일 강수량" },
        { field: "dayAvgWs", label: "일 평균풍속" },
        { field: "daySumSs", label: "일 누적일조시간" },
        { field: "wrnCd/wrnCount", label: "기상특보 코드·발효 여부" },
        { field: "areaId/paCropSpeId", label: "산지·작물 코드" },
      ],
      limitations: [
        "현재 연결된 API에는 일사량(sumGsr)이 없어 일조시간(daySumSs)을 조건부 대체지표로 사용합니다.",
        "장기간 일조가 모두 0으로 반환되는 관측망은 결측으로 처리하고 일조 점수와 신뢰도를 낮춥니다.",
        "강수량은 관수·배수·토양수분을 포함하지 않으므로 실제 포도나무 수분상태와 같지 않습니다.",
        "품종·농가별 착과량, 병해, 수확일, 표본 당도·산도·경도 데이터는 포함되지 않습니다.",
      ],
    },
    evidenceByRegion,
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
      links: GRAPE_SOURCE_LINKS,
    },
  };
}

export async function createGrapeRecommendations({
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

  const windowStartDate = addDays(referenceDate, -GRAPE_RULES.observationWindow.startDaysBefore);
  const windowEndDate = addDays(referenceDate, -GRAPE_RULES.observationWindow.endDaysBefore);

  if (!shouldUseLiveData) {
    return buildGrapeRecommendation({
      metrics: GRAPE_DEMO_METRICS,
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
      live = await collectGrapeLiveMetrics({ serviceKey, referenceDate: liveReferenceDate, fetchImpl });
      fallbackYears = offset;
      break;
    } catch (error) {
      if (error?.code !== "NO_DATA" || offset === 2) throw error;
    }
  }

  return buildGrapeRecommendation({
    metrics: live.metrics,
    evidenceByRegion: live.evidenceByRegion,
    referenceDate: liveReferenceDate,
    sourceStatus: "live",
    windowStart: live.windowStart,
    windowEnd: live.windowEnd,
    requestedDate: formatDate(referenceDate),
    fallbackYears,
  });
}

export function buildAppleRecommendation({
  metrics,
  referenceDate,
  sourceStatus,
  windowStart,
  windowEnd,
  evidenceByRegion = {},
  requestedDate = formatDate(referenceDate),
  fallbackYears = 0,
}) {
  const ranked = metrics
    .map((metric) => enrichAppleMetric(metric, sourceStatus))
    .sort(
      (left, right) =>
        Number(right.eligible) - Number(left.eligible) ||
        right.score - left.score ||
        right.componentScores.sunshineFit - left.componentScores.sunshineFit,
    )
    .map((item, index) => ({ ...item, candidateRank: index + 1 }));
  const recommendations = ranked
    .filter((item) => item.eligible)
    .slice(0, 3)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return {
    fruit: { id: "apple", name: "사과", cultivar: getAppleCultivar(referenceDate) },
    referenceDate: formatDate(referenceDate),
    observationWindow: { start: windowStart, end: windowEnd },
    candidateScope: {
      count: APPLE_REGIONS.length,
      eligibleCount: ranked.filter((item) => item.eligible).length,
      label: `기상청 사과 주산지 ${APPLE_REGIONS.length}곳 중`,
    },
    rules: APPLE_RULES,
    recommendations,
    candidates: ranked,
    dashboard: buildAppleDashboard(ranked),
    dataUsage: {
      scoring: APPLE_RULES.scoring,
      contextOnly: APPLE_RULES.excludedFromScore,
      rawFields: [
        { field: "ymd", label: "관측일" },
        { field: "dayAvgTa/dayMaxTa/dayMinTa", label: "평균·최고·최저기온과 일교차" },
        { field: "dayAvgRhm/dayMinRhm", label: "평균·최저습도" },
        { field: "daySumRn", label: "일 강수량" },
        { field: "dayAvgWs", label: "일 평균풍속" },
        { field: "daySumSs", label: "일 누적일조시간" },
        { field: "wmCd/wrnCd, wmCount/wrnCount", label: "기상특보 코드·발효 여부" },
        { field: "areaId/paCropSpeId", label: "산지·작물 코드" },
      ],
      limitations: [
        "기상 조건만 비교하며 실제 사과의 당도·산도·경도·착색도 측정값은 포함하지 않습니다.",
        "현재 API는 품종을 '-'로 제공하므로 기준일에 따라 대표 출하시기 품종을 안내용으로 표시합니다.",
        "강수량은 관수·토양수분·배수 상태를 포함하지 않아 실제 과원의 수분상태와 같지 않습니다.",
        "일조 관측이 장기간 0인 관측망은 결측으로 처리하고 일조 점수와 신뢰도를 낮춥니다.",
        "일교차는 착색 관련 보조지표이며, 고도·수관관리·착과량·병해·저장 상태는 반영하지 않습니다.",
      ],
    },
    evidenceByRegion,
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
      links: APPLE_SOURCE_LINKS,
    },
  };
}

export async function createAppleRecommendations({
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

  const windowStartDate = addDays(referenceDate, -APPLE_RULES.observationWindow.startDaysBefore);
  const windowEndDate = addDays(referenceDate, -APPLE_RULES.observationWindow.endDaysBefore);

  if (!shouldUseLiveData) {
    return buildAppleRecommendation({
      metrics: APPLE_DEMO_METRICS,
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
      live = await collectAppleLiveMetrics({ serviceKey, referenceDate: liveReferenceDate, fetchImpl });
      fallbackYears = offset;
      break;
    } catch (error) {
      if (error?.code !== "NO_DATA" || offset === 2) throw error;
    }
  }

  return buildAppleRecommendation({
    metrics: live.metrics,
    evidenceByRegion: live.evidenceByRegion,
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

export async function getCachedGrapeRecommendations({
  serviceKey,
  date = todayInKorea(),
  mode = "auto",
  fetchImpl = fetch,
} = {}) {
  const cacheKey = `grape:${date}:${mode}:${Boolean(serviceKey)}`;
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

  const request = createGrapeRecommendations({ serviceKey, date, mode, fetchImpl }).then((result) => {
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

export async function getCachedAppleRecommendations({
  serviceKey,
  date = todayInKorea(),
  mode = "auto",
  fetchImpl = fetch,
} = {}) {
  const cacheKey = `apple:${date}:${mode}:${Boolean(serviceKey)}`;
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

  const request = createAppleRecommendations({ serviceKey, date, mode, fetchImpl }).then((result) => {
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

  if (url.pathname === "/api/recommendations/grape" && request.method === "GET") {
    try {
      const result = await getCachedGrapeRecommendations({
        serviceKey: env.DATA_GO_KR_SERVICE_KEY,
        date: url.searchParams.get("date") ?? todayInKorea(),
        mode: url.searchParams.get("mode") ?? "auto",
      });

      const cacheControl = result.source.status === "live" ? "public, max-age=900, s-maxage=21600" : "no-store";
      return json(result, {
        headers: { "cache-control": cacheControl, "x-grape-cache": result.cache.status },
      });
    } catch (error) {
      return json(
        {
          error: "GRAPE_RECOMMENDATION_FAILED",
          message: error instanceof Error ? error.message : "추천 데이터를 만들지 못했습니다.",
        },
        { status: error?.status ?? 502, headers: { "cache-control": "no-store" } },
      );
    }
  }

  if (url.pathname === "/api/recommendations/apple" && request.method === "GET") {
    try {
      const result = await getCachedAppleRecommendations({
        serviceKey: env.DATA_GO_KR_SERVICE_KEY,
        date: url.searchParams.get("date") ?? todayInKorea(),
        mode: url.searchParams.get("mode") ?? "auto",
      });

      const cacheControl = result.source.status === "live" ? "public, max-age=900, s-maxage=21600" : "no-store";
      return json(result, {
        headers: { "cache-control": cacheControl, "x-apple-cache": result.cache.status },
      });
    } catch (error) {
      return json(
        {
          error: "APPLE_RECOMMENDATION_FAILED",
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
