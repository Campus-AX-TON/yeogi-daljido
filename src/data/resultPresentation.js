const metric = (key, label, unit) => ({ key, label, unit });

const ratioInterpretation = (key, subject) => ({ key, subject, type: "ratio" });

const fixedExplanation = (text) => ({ text, type: "fixed" });

const rainfallExplanation = {
  key: "rainfallRatio",
  missingText: "강수량과 평년값을 함께 비교해 과습 부담을 확인해요.",
  outcomes: [
    { max: 100, text: "비가 평년보다 적어 과습 부담이 낮아요." },
    { text: "비가 평년보다 많아 과습 부담을 함께 살펴봐야 해요." },
  ],
  type: "threshold",
};

const commonSunshineSteps = [
  { eyebrow: "관측 데이터", ...metric("sunshineHours", "이번 기간 누적 일조", "시간") },
  { eyebrow: "비교 기준", ...metric("sunshineBaselineHours", "최근 3년 같은 기간 평균", "시간") },
  { eyebrow: "계산 결과", ...metric("sunshineRatio", "평년 대비", "%") },
];

const commonRainfallSteps = [
  { eyebrow: "관측 데이터", ...metric("rainfallMm", "이번 기간 누적 강수", "mm") },
  { eyebrow: "비교 기준", ...metric("rainfallBaselineMm", "최근 3년 같은 기간 평균", "mm") },
  { eyebrow: "계산 결과", ...metric("rainfallRatio", "평년 대비", "%") },
];

const normalizedSunshineFallback = {
  baselineKey: "sunshineNormalizedBaseline",
  baselineLabel: "최근 3년 같은 기간 평균",
  differenceKey: "sunshineDifference",
  differenceLabel: "평균과 차이",
  observedLabel: "이번 기간 일조 수준",
  ratioKey: "sunshineRatio",
  type: "normalized-ratio",
  whenVisibleStepCount: 1,
};

export const RESULT_PRESENTATIONS = {
  pear: {
    hero: {
      asset: "pear",
      description:
        "배는 과실이 자라는 기간에 받은 햇빛이 단맛 형성에 중요한 과일이에요. 누적 일조가 충분할수록 당이 차오르기 좋은 조건이 됩니다.",
    },
    aiReasonsByRank: {
      1: ["일조가 충분해요", "강수와 고온 부담이 낮아요"],
      2: ["일조·강수 조건이 안정적이에요", "고온 부담이 크지 않아요"],
      3: ["주요 기상 조건이 양호해요", "일부 지표는 상위 산지보다 낮아요"],
    },
    chartScoreKeys: { heat: "heat", rain: "rain", sunshine: "sunshine" },
    contextMetrics: [
      metric("observedDays", "관측일수", "일"),
      metric("warningDays", "기상특보", "일"),
    ],
    detailSections: [
      {
        explanation: fixedExplanation("수확 전 햇빛이 충분해 당도 형성에 유리한 조건이에요."),
        fallback: normalizedSunshineFallback,
        icon: "sunshine",
        id: "sunshine",
        interpretation: ratioInterpretation("sunshineRatio", "일조"),
        label: "일조",
        steps: commonSunshineSteps,
        supportingMetrics: [],
      },
      {
        explanation: rainfallExplanation,
        icon: "rainfall",
        id: "rainfall",
        interpretation: ratioInterpretation("rainfallRatio", "강수"),
        label: "강수",
        steps: commonRainfallSteps,
        supportingMetrics: [metric("humidityAverage", "평균습도", "%")],
      },
      {
        explanation: {
          key: "hotDays",
          missingText: "고온일과 관측일수를 함께 비교해 과실 스트레스 부담을 확인해요.",
          outcomes: [
            { max: 1, text: "고온일이 적어 과실 스트레스 부담이 낮아요." },
            { text: "고온일이 있어 과실 스트레스 가능성을 함께 살펴봐야 해요." },
          ],
          type: "threshold",
        },
        icon: "temperature",
        id: "temperature",
        interpretation: {
          key: "hotDays",
          missingText: "고온 부담을 판단할 관측값이 부족해요.",
          subject: "31℃ 이상 고온일",
          type: "count",
          unit: "일",
        },
        label: "기온",
        steps: [
          { eyebrow: "관측 데이터", ...metric("hotDays", "31℃ 이상 고온일", "일") },
          { eyebrow: "비교 기준", ...metric("observedDays", "관측일수", "일") },
          {
            calculation: {
              denominatorKey: "observedDays",
              numeratorKey: "hotDays",
              type: "percentage",
            },
            eyebrow: "계산 결과",
            ...metric("hotDayShare", "고온 발생 비율", "%"),
          },
        ],
        supportingMetrics: [metric("maxTemperature", "최고기온", "℃")],
      },
    ],
  },
  grape: {
    hero: {
      asset: "grape",
      description:
        "포도는 착색이 시작되는 시기부터 수확까지 당이 빠르게 쌓여요. 이 기간에 누적된 기온·강수·일사 조건이 당도 형성에 영향을 줍니다.",
    },
    aiReasonsByRank: {
      1: ["생육온도와 일조가 충분해요", "강수 조건도 안정적이에요"],
      2: ["생육온도와 수분 조건이 안정적이에요", "일조도 전반적으로 좋아요"],
      3: ["포도 생육 조건을 갖췄어요", "일부 지표는 상위 산지보다 낮아요"],
    },
    chartScoreKeys: { gdd: "temperature", rainfall: "moisture", sunshineProxy: "sunshineProxy" },
    contextMetrics: [
      metric("observedDays", "관측일", "일"),
      metric("warningDays", "기상특보", "일"),
      metric("windAverage", "평균 풍속", "m/s"),
    ],
    detailSections: [
      {
        explanation: fixedExplanation("생육에 필요한 온도가 평년보다 충분히 누적됐는지 확인해요."),
        icon: "temperature",
        id: "growth",
        interpretation: ratioInterpretation("gddRatio", "생육온도"),
        label: "생육온도",
        steps: [
          { eyebrow: "관측 데이터", ...metric("gdd", "이번 기간 누적 생육온도", "℃·일") },
          { eyebrow: "비교 기준", ...metric("gddBaseline", "최근 3년 같은 기간 평균", "℃·일") },
          { eyebrow: "계산 결과", ...metric("gddRatio", "평년 대비", "%") },
        ],
        supportingMetrics: [
          metric("averageTemperature", "기간 평균기온", "℃"),
          metric("hotDays", "31℃ 이상 고온일", "일"),
        ],
      },
      {
        explanation: fixedExplanation("수확 전 햇빛이 충분해 당도 형성에 유리한 조건이에요."),
        fallback: normalizedSunshineFallback,
        icon: "sunshine",
        id: "sunshine",
        interpretation: ratioInterpretation("sunshineRatio", "일조"),
        label: "일조",
        steps: commonSunshineSteps,
        supportingMetrics: [],
      },
      {
        explanation: rainfallExplanation,
        icon: "rainfall",
        id: "rainfall",
        interpretation: ratioInterpretation("rainfallRatio", "강수"),
        label: "강수",
        steps: commonRainfallSteps,
        supportingMetrics: [
          metric("rainyDays", "강우일", "일"),
          metric("longestRainStreak", "최장 연속 강우", "일"),
          metric("humidityAverage", "평균 습도", "%"),
        ],
      },
    ],
  },
  apple: {
    hero: {
      asset: "apple",
      description:
        "한국 사과는 보통 9~10월 수확기에 당도와 색이 본격적으로 형성돼요. 이때 햇빛이 충분하고 비가 적으며 일교차가 클수록 좋은 조건이 됩니다.",
    },
    aiReasonsByRank: {
      1: ["일조와 일교차가 좋아요", "강수 부담이 낮아요"],
      2: ["일조·강수 조건이 안정적이에요", "일교차도 전반적으로 좋아요"],
      3: ["주요 기상 조건이 양호해요", "일부 지표는 상위 산지보다 낮아요"],
    },
    chartScoreKeys: { dayNightRange: "dayNightRange", rainfall: "rainfall", sunshine: "sunshine" },
    contextMetrics: [
      metric("observedDays", "관측일", "일"),
      metric("warningDays", "기상특보", "일"),
      metric("windAverage", "평균 풍속", "m/s"),
    ],
    detailSections: [
      {
        explanation: fixedExplanation("수확 전 햇빛이 충분해 당도와 착색 형성에 유리한 조건이에요."),
        fallback: normalizedSunshineFallback,
        icon: "sunshine",
        id: "sunshine",
        interpretation: ratioInterpretation("sunshineRatio", "일조"),
        label: "일조",
        steps: commonSunshineSteps,
        supportingMetrics: [],
      },
      {
        explanation: rainfallExplanation,
        icon: "rainfall",
        id: "rainfall",
        interpretation: ratioInterpretation("rainfallRatio", "강수"),
        label: "강수",
        steps: commonRainfallSteps,
        supportingMetrics: [
          metric("rainyDays", "강우일", "일"),
          metric("longestRainStreak", "최장 연속 강우", "일"),
          metric("humidityAverage", "평균 습도", "%"),
        ],
      },
      {
        explanation: fixedExplanation("수확 전 일교차가 크면 착색에 유리한 조건이 될 수 있어요."),
        icon: "temperature",
        id: "temperature",
        interpretation: ratioInterpretation("dayNightRangeRatio", "일교차"),
        label: "기온과 일교차",
        steps: [
          { eyebrow: "관측 데이터", ...metric("averageDayNightRange", "이번 기간 평균 일교차", "℃") },
          { eyebrow: "비교 기준", ...metric("dayNightRangeBaseline", "최근 3년 같은 기간 평균", "℃") },
          { eyebrow: "계산 결과", ...metric("dayNightRangeRatio", "평년 대비", "%") },
        ],
        supportingMetrics: [
          metric("averageTemperature", "평균기온", "℃"),
          metric("maxTemperature", "최고기온", "℃"),
          metric("minTemperature", "최저기온", "℃"),
          metric("hotDays", "30℃ 이상 고온일", "일"),
        ],
      },
    ],
  },
};

const SUPPORTED_ICONS = new Set(["rainfall", "sunshine", "temperature"]);
const SUPPORTED_HERO_ASSETS = new Set(["apple", "grape", "pear"]);
const SUPPORTED_INTERPRETATIONS = new Set(["count", "ratio"]);
const SUPPORTED_EXPLANATIONS = new Set(["fixed", "threshold"]);

function assertConfiguration(condition, message) {
  if (!condition) throw new Error(`결과 화면 설정 오류: ${message}`);
}

function validateMetricDefinition(definition, path) {
  assertConfiguration(definition?.key, `${path}의 key가 없습니다.`);
  assertConfiguration(definition?.label, `${path}의 label이 없습니다.`);
  assertConfiguration(typeof definition.unit === "string", `${path}의 unit이 없습니다.`);
  if (definition.calculation) {
    assertConfiguration(
      definition.calculation.type === "percentage",
      `${path}의 계산 방식이 지원되지 않습니다.`,
    );
  }
}

function validatePresentation(fruitId, presentation) {
  assertConfiguration(presentation.hero?.description, `${fruitId}.hero.description이 없습니다.`);
  assertConfiguration(
    SUPPORTED_HERO_ASSETS.has(presentation.hero?.asset),
    `${fruitId}.hero.asset이 지원되지 않습니다.`,
  );
  assertConfiguration(presentation.chartScoreKeys, `${fruitId}.chartScoreKeys가 없습니다.`);
  assertConfiguration(
    Array.isArray(presentation.contextMetrics),
    `${fruitId}.contextMetrics는 배열이어야 합니다.`,
  );
  presentation.contextMetrics.forEach((definition, index) =>
    validateMetricDefinition(definition, `${fruitId}.contextMetrics[${index}]`),
  );

  [1, 2, 3].forEach((rank) => {
    assertConfiguration(
      Array.isArray(presentation.aiReasonsByRank?.[rank]),
      `${fruitId}.aiReasonsByRank[${rank}]가 없습니다.`,
    );
  });

  assertConfiguration(
    Array.isArray(presentation.detailSections) && presentation.detailSections.length > 0,
    `${fruitId}.detailSections가 비어 있습니다.`,
  );
  const sectionIds = new Set();
  presentation.detailSections.forEach((section, sectionIndex) => {
    const path = `${fruitId}.detailSections[${sectionIndex}]`;
    assertConfiguration(section.id && !sectionIds.has(section.id), `${path}의 id가 없거나 중복됩니다.`);
    sectionIds.add(section.id);
    assertConfiguration(section.label, `${path}의 label이 없습니다.`);
    assertConfiguration(SUPPORTED_ICONS.has(section.icon), `${path}의 icon이 지원되지 않습니다.`);
    assertConfiguration(
      SUPPORTED_INTERPRETATIONS.has(section.interpretation?.type),
      `${path}의 interpretation이 지원되지 않습니다.`,
    );
    assertConfiguration(
      SUPPORTED_EXPLANATIONS.has(section.explanation?.type),
      `${path}의 explanation이 지원되지 않습니다.`,
    );
    assertConfiguration(Array.isArray(section.steps) && section.steps.length > 0, `${path}.steps가 비어 있습니다.`);
    section.steps.forEach((definition, index) => validateMetricDefinition(definition, `${path}.steps[${index}]`));
    assertConfiguration(Array.isArray(section.supportingMetrics), `${path}.supportingMetrics는 배열이어야 합니다.`);
    section.supportingMetrics.forEach((definition, index) =>
      validateMetricDefinition(definition, `${path}.supportingMetrics[${index}]`),
    );
  });
}

Object.entries(RESULT_PRESENTATIONS).forEach(([fruitId, presentation]) =>
  validatePresentation(fruitId, presentation),
);

export function getResultPresentation(fruitId) {
  const presentation = RESULT_PRESENTATIONS[fruitId];
  if (!presentation) {
    throw new Error(`결과 화면 설정이 없는 과일입니다: ${fruitId}`);
  }
  return presentation;
}
