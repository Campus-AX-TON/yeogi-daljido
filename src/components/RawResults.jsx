import { useState } from "react";
import detailRainIcon from "../assets/detail-rain.png";
import detailSunIcon from "../assets/detail-sun.png";
import detailTemperatureIcon from "../assets/detail-temperature.png";
import heroApple from "../assets/hero-apple-cutout.png";
import heroGrape from "../assets/hero-grape-cutout.png";
import heroPear from "../assets/hero-pear-cutout.png";
import rankMedalBronze from "../assets/rank-medal-bronze.png";
import rankMedalGold from "../assets/rank-medal-gold.png";
import rankMedalSilver from "../assets/rank-medal-silver.png";
import { getResultPresentation } from "../data/resultPresentation.js";
import FruitBackdrop from "./FruitBackdrop.jsx";
import ResultBarChart from "./ResultBarChart.jsx";
import ResultRegionMap from "./ResultRegionMap.jsx";

const SCORE_COLORS = [
  "var(--report-series-a)",
  "var(--report-series-b)",
  "var(--report-series-c)",
];

const RANK_MEDALS = [rankMedalGold, rankMedalSilver, rankMedalBronze];

const DETAIL_ICONS = {
  rainfall: detailRainIcon,
  sunshine: detailSunIcon,
  temperature: detailTemperatureIcon,
};

const HERO_ASSETS = {
  apple: heroApple,
  grape: heroGrape,
  pear: heroPear,
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

function metricValue(metrics, definition) {
  if (!definition.calculation) return metrics[definition.key];

  if (definition.calculation.type === "percentage") {
    const numerator = metrics[definition.calculation.numeratorKey];
    const denominator = metrics[definition.calculation.denominatorKey];
    if (numerator === null || numerator === undefined || !denominator) return null;
    return Math.round((numerator / denominator) * 100);
  }

  throw new Error(`지원하지 않는 지표 계산 방식입니다: ${definition.calculation.type}`);
}

function metricItems(metrics, definitions) {
  return definitions
    .map((definition) => ({ definition, value: metricValue(metrics, definition) }))
    .filter(({ value }) => value !== null && value !== undefined)
    .map(({ definition, value }) => ({
      key: definition.key,
      label: definition.label,
      value: displayValue(value, definition.unit),
    }));
}

function ratioInterpretation(value, subject) {
  if (value === null || value === undefined) {
    return `${subject} 비교에 필요한 관측값이 부족해요.`;
  }

  if (value === 100) return `${subject} 수치가 최근 3년 평균과 비슷해요.`;
  return `${subject} 수치가 최근 3년 평균보다 ${Math.abs(value - 100)}% ${value > 100 ? "높아요" : "낮아요"}.`;
}

function detailSectionInterpretation(interpretation, metrics) {
  if (interpretation.type === "ratio") {
    return ratioInterpretation(metrics[interpretation.key], interpretation.subject);
  }

  if (interpretation.type === "count") {
    const value = metrics[interpretation.key];
    if (value === null || value === undefined) return interpretation.missingText;
    return `${interpretation.subject}이 ${value}${interpretation.unit} 관측됐어요.`;
  }

  throw new Error(`지원하지 않는 상세 해석 방식입니다: ${interpretation.type}`);
}

function withSubjectParticle(value) {
  const lastCharacter = value.at(-1);
  const code = lastCharacter?.charCodeAt(0) ?? 0;
  const hasFinalConsonant = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
  return `${value}${hasFinalConsonant ? "이" : "가"}`;
}

function detailStorySteps(section, metrics) {
  const steps = section.steps
    .map((definition) => {
      const value = metricValue(metrics, definition);
      if (value === null || value === undefined) return null;
      return {
        eyebrow: definition.eyebrow,
        key: definition.key,
        label: definition.label,
        value: displayValue(value, definition.unit),
      };
    })
    .filter(Boolean);

  if (section.fallback?.type === "normalized-ratio" && steps.length === section.fallback.whenVisibleStepCount) {
    const ratio = metrics[section.fallback.ratioKey];
    if (ratio === null || ratio === undefined) return steps;
    const difference = ratio - 100;
    return [
      {
        eyebrow: "관측 데이터",
        key: section.fallback.ratioKey,
        label: section.fallback.observedLabel,
        value: displayValue(ratio, "%"),
      },
      {
        eyebrow: "비교 기준",
        key: section.fallback.baselineKey,
        label: section.fallback.baselineLabel,
        value: "100%",
      },
      {
        eyebrow: "계산 결과",
        key: section.fallback.differenceKey,
        label: section.fallback.differenceLabel,
        value: `${difference > 0 ? "+" : ""}${difference}%`,
      },
    ];
  }

  return steps;
}

function detailSectionExplanation(explanation, metrics) {
  if (explanation.type === "fixed") return explanation.text;

  if (explanation.type === "threshold") {
    const value = metrics[explanation.key];
    if (value === null || value === undefined) return explanation.missingText;
    const outcome = explanation.outcomes.find(({ max }) => max === undefined || value <= max);
    if (!outcome) {
      throw new Error(`상세 설명 조건에 맞는 결과가 없습니다: ${explanation.key}`);
    }
    return outcome.text;
  }

  throw new Error(`지원하지 않는 상세 설명 방식입니다: ${explanation.type}`);
}

function supportingMetricItems(section, metrics) {
  return metricItems(metrics, section.supportingMetrics);
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

function RankMedal({ rank }) {
  return (
    <span className="report-rank-medal" aria-label={`${rank}위`}>
      <img alt="" aria-hidden="true" src={RANK_MEDALS[rank - 1]} />
      <strong>
        {rank}<small>위</small>
      </strong>
    </span>
  );
}

function RegionCard({ isSelected, onToggle, presentation, recommendation }) {
  const reasons = presentation.aiReasonsByRank[recommendation.rank];
  if (!reasons) {
    throw new Error(`${recommendation.rank}위 AI 추천 이유 설정이 없습니다.`);
  }

  return (
    <article
      className="report-pick-card"
      data-expanded={isSelected}
      data-rank={recommendation.rank}
    >
      <button
        aria-controls="top-region-detail-panel"
        aria-expanded={isSelected}
        className="report-pick-card-toggle"
        onClick={onToggle}
        type="button"
      >
        <span className="report-pick-card-top">
          <RankMedal rank={recommendation.rank} />
          <span className="report-region-name">
            {recommendation.region.name}
            <span>{recommendation.region.province}</span>
          </span>
        </span>

        <span className="report-ai-summary">
          <strong>AI 추천 이유</strong>
          <ul>
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </span>

        <span className="report-pick-card-action">
          {isSelected ? "상세 근거 접기" : "상세 근거 보기"}
        </span>
      </button>
    </article>
  );
}

function RegionDetailPanel({ isOpen, observationWindow, presentation, recommendation }) {
  const referenceMetrics = recommendation
    ? metricItems(recommendation.metrics, presentation.contextMetrics)
    : [];

  return (
    <div
      className="report-detail-collapse"
      data-open={isOpen}
      data-rank={recommendation?.rank}
      id="top-region-detail-panel"
    >
      <div className="report-detail-collapse-inner">
        {recommendation && (
          <section
            aria-label={`${recommendation.region.name} 상세 근거`}
            className="report-region-detail"
          >
            <header className="report-region-detail-header">
              <div>
                <span>{recommendation.rank}위 추천 산지</span>
                <h3>{withSubjectParticle(recommendation.region.name)} 좋은 이유</h3>
                {recommendation.reasons?.[0] && <p>{recommendation.reasons[0]}</p>}
              </div>
              <div className="report-detail-meta">
                {referenceMetrics.length > 0 && (
                  <dl className="report-detail-context" aria-label="관측 참고 정보">
                    {referenceMetrics.map((metric) => (
                      <div key={metric.key}>
                        <dt>{metric.label}</dt>
                        <dd>{metric.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <p>
                  {observationWindow.start} ~ {observationWindow.end}
                </p>
              </div>
            </header>

            <div
              className="report-detail-groups"
              style={{ "--detail-column-count": presentation.detailSections.length }}
            >
              {presentation.detailSections.map((section) => {
                const steps = detailStorySteps(section, recommendation.metrics);
                const supportingMetrics = supportingMetricItems(section, recommendation.metrics);
                return (
                  <article className="report-detail-group" key={section.id}>
                    <header>
                      <img alt="" aria-hidden="true" src={DETAIL_ICONS[section.icon]} />
                      <div>
                        <h4>{section.label}</h4>
                        <p>{detailSectionInterpretation(section.interpretation, recommendation.metrics)}</p>
                      </div>
                    </header>
                    <dl className="report-detail-flow">
                      {steps.map((step) => (
                        <div key={step.key}>
                          <span>{step.eyebrow}</span>
                          <dt>{step.label}</dt>
                          <dd>{step.value}</dd>
                        </div>
                      ))}
                    </dl>
                    {supportingMetrics.length > 0 && (
                      <dl className="report-detail-support">
                        {supportingMetrics.map((metric) => (
                          <div key={metric.key}>
                            <dt>{metric.label}</dt>
                            <dd>{metric.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    <aside className="report-detail-explanation">
                      <strong>왜 좋은가요?</strong>
                      <p>{detailSectionExplanation(section.explanation, recommendation.metrics)}</p>
                    </aside>
                  </article>
                );
              })}
            </div>

          </section>
        )}
      </div>
    </div>
  );
}

export default function RawResults({ errorMessage, fruit, onBack, onReload, result, status }) {
  const [selectedRegion, setSelectedRegion] = useState(null);

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

  const presentation = getResultPresentation(result.fruit.id);
  const categories = scoreCategories(result);
  const chartKeyMap = presentation.chartScoreKeys;
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
  const selectedRecommendation =
    selectedRegion?.fruitId === result.fruit.id
      ? result.recommendations.find((item) => item.region.id === selectedRegion.regionId)
      : null;

  return (
    <main className="report-page">
      <FruitBackdrop variant="report" />
      <div className="report-shell">
        <header className="report-nav">
          <button className="report-back-button" onClick={onBack} type="button">
            <span aria-hidden="true" className="report-back-button-icon">
              ←
            </span>
            과일 다시 선택
          </button>
        </header>

        <section className="report-intro" data-fruit={result.fruit.id}>
          <div className="report-intro-content">
            <h1>지금 {result.fruit.name}, 어디가 좋을까?</h1>
            <p className="report-fruit-description">{presentation.hero.description}</p>
            <dl className="report-meta-list" aria-label="분석 정보">
              <div className="report-meta-item">
                <dt>비교 산지</dt>
                <dd>{scopeLabel}</dd>
              </div>
              <div className="report-meta-item">
                <dt>기준일</dt>
                <dd className="mono">{result.referenceDate}</dd>
              </div>
              <div className="report-meta-item">
                <dt>관측 기간</dt>
                <dd className="mono">
                  {result.observationWindow.start} ~ {result.observationWindow.end}
                </dd>
              </div>
            </dl>
          </div>
          <img
            alt=""
            aria-hidden="true"
            className="report-intro-art"
            src={HERO_ASSETS[presentation.hero.asset]}
          />
        </section>

        <section className="report-section" aria-labelledby="top-regions-title">
          <h2 id="top-regions-title">Top {result.recommendations.length} 추천 산지</h2>
          <div className="report-pick-grid">
            {result.recommendations.map((recommendation) => (
              <RegionCard
                isSelected={selectedRecommendation?.region.id === recommendation.region.id}
                key={recommendation.region.id}
                onToggle={() =>
                  setSelectedRegion((current) =>
                    current?.fruitId === result.fruit.id && current.regionId === recommendation.region.id
                      ? null
                      : { fruitId: result.fruit.id, regionId: recommendation.region.id },
                  )
                }
                presentation={presentation}
                recommendation={recommendation}
              />
            ))}
          </div>
          <RegionDetailPanel
            isOpen={Boolean(selectedRecommendation)}
            observationWindow={result.observationWindow}
            presentation={presentation}
            recommendation={selectedRecommendation}
          />
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
