import ResultBarChart from "./ResultBarChart.jsx";
import ResultRegionMap from "./ResultRegionMap.jsx";

const SCORE_COLORS = [
  "var(--report-series-a)",
  "var(--report-series-b)",
  "var(--report-series-c)",
];

const METRICS_BY_FRUIT = {
  pear: {
    primary: [
      ["sunshineHours", "일조시간", "시간"],
      ["rainfallMm", "강수량", "mm"],
    ],
    secondary: [
      ["sunshineRatio", "평년 대비 일조", "%"],
      ["rainfallRatio", "평년 대비 강수", "%"],
      ["hotDays", "31℃ 이상 고온일", "일"],
    ],
    tertiary: [
      ["sunshineBaselineHours", "평년 일조시간", "시간"],
      ["rainfallBaselineMm", "평년 강수량", "mm"],
      ["maxTemperature", "최고기온", "℃"],
      ["humidityAverage", "평균습도", "%"],
      ["warningDays", "기상특보", "일"],
      ["observedDays", "관측일수", "일"],
    ],
  },
  grape: {
    primary: [
      ["gdd", "누적 생육온도(GDD)", "℃·일"],
      ["sunshineHours", "누적 일조", "시간"],
      ["rainfallMm", "누적 강수", "mm"],
    ],
    secondary: [
      ["gddRatio", "최근 3년 대비 GDD", "%"],
      ["sunshineRatio", "최근 3년 대비 일조", "%"],
      ["rainfallRatio", "최근 3년 대비 강수", "%"],
      ["hotDays", "31℃ 이상 고온일", "일"],
      ["longestRainStreak", "최장 연속 강우", "일"],
    ],
    tertiary: [
      ["gddBaseline", "3개년 평균 GDD", "℃·일"],
      ["sunshineBaselineHours", "3개년 평균 일조", "시간"],
      ["rainfallBaselineMm", "3개년 평균 강수", "mm"],
      ["averageTemperature", "기간 평균기온", "℃"],
      ["rainyDays", "강우일", "일"],
      ["humidityAverage", "평균 습도", "%"],
      ["windAverage", "평균 풍속", "m/s"],
      ["warningDays", "기상특보", "일"],
      ["observedDays", "관측일", "일"],
    ],
  },
  apple: {
    primary: [
      ["sunshineHours", "누적 일조", "시간"],
      ["rainfallMm", "누적 강수", "mm"],
      ["averageDayNightRange", "평균 일교차", "℃"],
    ],
    secondary: [
      ["sunshineRatio", "최근 3년 대비 일조", "%"],
      ["rainfallRatio", "최근 3년 대비 강수", "%"],
      ["dayNightRangeRatio", "최근 3년 대비 일교차", "%"],
      ["hotDays", "30℃ 이상 고온일", "일"],
      ["longestRainStreak", "최장 연속 강우", "일"],
    ],
    tertiary: [
      ["sunshineBaselineHours", "3개년 평균 일조", "시간"],
      ["rainfallBaselineMm", "3개년 평균 강수", "mm"],
      ["dayNightRangeBaseline", "3개년 평균 일교차", "℃"],
      ["averageTemperature", "평균기온", "℃"],
      ["maxTemperature", "최고기온", "℃"],
      ["minTemperature", "최저기온", "℃"],
      ["rainyDays", "강우일", "일"],
      ["humidityAverage", "평균 습도", "%"],
      ["windAverage", "평균 풍속", "m/s"],
      ["warningDays", "기상특보", "일"],
      ["observedDays", "관측일", "일"],
    ],
  },
};

const CHART_SCORE_KEY_BY_FRUIT = {
  grape: { gdd: "temperature", rainfall: "moisture", sunshineProxy: "sunshineProxy" },
  pear: { heat: "heat", rain: "rain", sunshine: "sunshine" },
  apple: { dayNightRange: "dayNightRange", rainfall: "rainfall", sunshine: "sunshine" },
};

function displayValue(value, unit = "") {
  return value === null || value === undefined ? "자료 없음" : `${value}${unit}`;
}

function formatDateTime(iso) {
  if (!iso) return null;
  const parts = new Intl.DateTimeFormat("ko-KR", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(new Date(iso));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}.${values.month}.${values.day} ${values.hour}:${values.minute}`;
}

function metricItems(metrics, definitions) {
  return definitions.map(([key, label, unit]) => ({
    key,
    label,
    value: displayValue(metrics[key], unit),
  }));
}

function scoreCategories(result) {
  return result.rules.scoring.map((item, index) => ({
    color: SCORE_COLORS[index % SCORE_COLORS.length],
    description: item.description,
    key: item.id,
    label: item.label,
    weight: item.weight,
  }));
}

function RegionCard({ categories, fruitId, recommendation }) {
  const definitions = METRICS_BY_FRUIT[fruitId];
  const primary = metricItems(recommendation.metrics, definitions.primary);
  const secondary = metricItems(recommendation.metrics, definitions.secondary);
  const tertiary = metricItems(recommendation.metrics, definitions.tertiary);
  const total = Math.max(
    categories.reduce((sum, category) => sum + (recommendation.scoreBreakdown[category.key] ?? 0), 0),
    1,
  );

  return (
    <article className="report-pick-card">
      <header className="report-pick-card-top">
        <span className="report-rank-badge">#{recommendation.rank}</span>
        <h3 className="report-region-name">
          {recommendation.region.name}
          <span>{recommendation.region.province}</span>
        </h3>
        <span className="report-score">
          {recommendation.score}
          <small>점</small>
        </span>
      </header>

      <div className="report-breakdown" aria-label="추천 점수 구성">
        <div className="report-stacked-track">
          {categories.map((category) => {
            const value = recommendation.scoreBreakdown[category.key] ?? 0;
            return (
              <span
                className="report-stacked-segment"
                key={category.key}
                style={{
                  "--segment-color": category.color,
                  "--segment-width": `${(value / total) * 100}%`,
                }}
              />
            );
          })}
        </div>
        <div className="report-breakdown-legend">
          {categories.map((category) => (
            <span key={category.key}>
              {category.label} {recommendation.scoreBreakdown[category.key] ?? 0}
            </span>
          ))}
        </div>
      </div>

      <div className="report-primary-metrics">
        {primary.map((metric) => (
          <div className="report-primary-metric" key={metric.key}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </div>

      <div className="report-secondary-metrics">
        {secondary.map((metric) => (
          <span key={metric.key}>
            {metric.label} <strong>{metric.value}</strong>
          </span>
        ))}
      </div>

      <p className="report-tertiary-metrics">
        {tertiary.map((metric) => `${metric.label} ${metric.value}`).join(" · ")}
      </p>

      <footer className="report-pick-card-foot">
        <span>{recommendation.eligibility?.label ?? recommendation.availability?.label ?? ""}</span>
      </footer>

    </article>
  );
}

export default function RawResults({ errorMessage, fruit, onBack, onReload, result, status }) {
  if (!result) {
    return (
      <main className="raw-results-page">
        <section className="raw-results-panel" aria-live="polite">
          <button className="raw-back-button" onClick={onBack} type="button">
            ← 과일 다시 선택
          </button>
          <header className="raw-results-intro">
            <p>여기 달지도</p>
            <h1>{fruit?.name ?? "과일"} 산지 추천</h1>
          </header>
          {status === "error" && (
            <div className="raw-error-message" role="alert">
              <strong>조회하지 못했습니다.</strong>
              <p>{errorMessage}</p>
              <button onClick={onReload} type="button">
                다시 조회
              </button>
            </div>
          )}
        </section>
      </main>
    );
  }

  const categories = scoreCategories(result);
  const chartKeyMap = CHART_SCORE_KEY_BY_FRUIT[result.fruit.id] ?? {};
  const barCharts = result.dashboard.charts.filter((chart) => chart.type !== "stacked-bar");
  const totalScoreChart = {
    color: "var(--gold-text)",
    title: "산지별 총점 비교",
    unit: "점",
    values: result.recommendations.map((item) => ({
      region: item.region.name,
      value: item.score,
    })),
  };
  const scopeLabel =
    result.candidateScope?.label ??
    `${result.fruit.name} 주산지 ${result.candidates?.length ?? result.recommendations.length}곳 중`;

  return (
    <main className="report-page">
      <div className="report-shell">
        <header className="report-nav">
          <button onClick={onBack} type="button">
            ← 과일 다시 선택
          </button>
        </header>

        <section className="report-intro">
          <p className="report-eyebrow mono">{result.rules.label}</p>
          <h1>{result.fruit.name}</h1>
          <p className="report-meta">
            {scopeLabel} · 기준일 {result.referenceDate} · 관측 기간 {result.observationWindow.start} ~{" "}
            {result.observationWindow.end}
          </p>
        </section>

        <section className="report-section" aria-labelledby="top-regions-title">
          <h2 id="top-regions-title">Top {result.recommendations.length} 추천 산지</h2>
          <div className="report-pick-grid">
            {result.recommendations.map((recommendation) => (
              <RegionCard
                categories={categories}
                fruitId={result.fruit.id}
                key={recommendation.region.id}
                recommendation={recommendation}
              />
            ))}
          </div>
        </section>

        <section className="report-section" aria-labelledby="scoring-title">
          <h2 id="scoring-title">평가 기준</h2>
          <div className="report-scoring-grid">
            {categories.map((category) => (
              <article className="report-scoring-card" key={category.key}>
                <strong style={{ color: category.color }}>{category.weight}%</strong>
                <h3>{category.label}</h3>
                <p>{category.description}</p>
              </article>
            ))}
          </div>

          {result.dataUsage?.contextOnly?.length > 0 && (
            <div className="report-reference-box">
              <h3>참고값으로만 표시 (점수 미반영)</h3>
              <div>
                {result.dataUsage.contextOnly.map((item) => (
                  <article key={item.id}>
                    <strong>{item.label}</strong>
                    <p>{item.reason}</p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="report-section" aria-labelledby="map-title">
          <h2 id="map-title">지도로 보기</h2>
          <ResultRegionMap recommendations={result.recommendations} />
        </section>

        <section className="report-section" aria-labelledby="charts-title">
          <h2 id="charts-title">데이터로 보기</h2>
          <div className="report-chart-grid">
            <ResultBarChart {...totalScoreChart} />
            {barCharts.map((chart, index) => {
              const scoreKey = chartKeyMap[chart.id] ?? chart.id;
              const category = categories.find((item) => item.key === scoreKey);
              return (
                <ResultBarChart
                  color={category?.color ?? SCORE_COLORS[index % SCORE_COLORS.length]}
                  key={chart.id}
                  title={chart.title}
                  unit={chart.unit}
                  values={chart.values}
                />
              );
            })}
          </div>
        </section>

        {result.dataUsage?.limitations?.length > 0 && (
          <section className="report-section" aria-labelledby="limitations-title">
            <h2 id="limitations-title">현재 한계</h2>
            <ul className="report-limitations">
              {result.dataUsage.limitations.map((limitation) => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="report-section report-source" aria-labelledby="source-title">
          <h2 id="source-title">데이터 출처</h2>
          <p>
            {result.source.links?.weather ? (
              <a href={result.source.links.weather} rel="noreferrer" target="_blank">
                {result.source.label}
              </a>
            ) : (
              result.source.label
            )}{" "}
            · {result.source.status === "live" ? "실시간 연동" : "캐시 데이터"}
            {result.source.updatedAt && ` · 업데이트 ${formatDateTime(result.source.updatedAt)}`}
          </p>
        </section>

        <section className="report-section" aria-labelledby="notice-title">
          <h2 id="notice-title">주의사항</h2>
          <div className="report-disclaimer">
            {result.rules.disclaimer}
            {result.rules.model && <span className="mono">모델 {result.rules.model}</span>}
          </div>
        </section>

        <footer className="report-footer mono">
          DATA SNAPSHOT · {result.referenceDate} 기준 (데모용 샘플 데이터)
        </footer>
      </div>
    </main>
  );
}
