import { useEffect, useState } from "react";

const RELOAD_COOLDOWN_SECONDS = 60;

const fruits = [
  { id: "pear", name: "배", emoji: "🍐", available: true },
  { id: "grape", name: "포도", emoji: "🍇", available: false },
  { id: "apple", name: "사과", emoji: "🍎", available: false },
];

const metricLabels = [
  ["sunshineRatio", "평년 대비 일조", "%"],
  ["sunshineHours", "누적 일조", "시간"],
  ["sunshineBaselineHours", "3개년 평균 일조", "시간"],
  ["hotDays", "31℃ 이상 고온일", "일"],
  ["maxTemperature", "최고기온", "℃"],
  ["rainfallMm", "누적 강수", "mm"],
  ["rainfallRatio", "평년 대비 강수", "%"],
  ["rainfallBaselineMm", "3개년 평균 강수", "mm"],
  ["humidityAverage", "평균 습도", "%"],
  ["warningDays", "기상특보 발생일", "일"],
  ["observedDays", "관측일", "일"],
];

function displayValue(value, unit) {
  return value === null || value === undefined ? "자료 없음" : `${value}${unit}`;
}

export function App() {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds === 0) return undefined;
    const timeout = window.setTimeout(() => {
      setCooldownSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [cooldownSeconds]);

  async function loadPearRecommendations() {
    if (status === "loading" || cooldownSeconds > 0) return;
    setStatus("loading");
    setResult(null);
    setErrorMessage("");

    try {
      const response = await fetch("/api/recommendations/pear?mode=live");
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message ?? "추천 결과를 불러오지 못했습니다.");
      }

      setResult(payload);
      setStatus("success");
      setCooldownSeconds(RELOAD_COOLDOWN_SECONDS);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "추천 결과를 불러오지 못했습니다.");
      setStatus("error");
    }
  }

  return (
    <main className="fruit-picker">
      <section className="fruit-picker__panel" aria-labelledby="fruit-picker-title">
        <p className="fruit-picker__eyebrow">여기 달지도</p>
        <h1 id="fruit-picker-title">어떤 과일을 찾아볼까요?</h1>
        <p className="fruit-picker__description">
          과일을 선택하면 기상 데이터를 조합해 좋은 산지 Top 3를 추천합니다.
        </p>

        <div className="fruit-picker__buttons">
          {fruits.map((fruit) => (
            <button
              className="fruit-button"
              data-fruit-id={fruit.id}
              disabled={
                !fruit.available || status === "loading" || (fruit.id === "pear" && cooldownSeconds > 0)
              }
              key={fruit.id}
              onClick={fruit.available ? loadPearRecommendations : undefined}
              type="button"
            >
              <span className="fruit-button__image" aria-hidden="true">
                {fruit.emoji}
              </span>
              <span>{fruit.name}</span>
              {!fruit.available && <small>준비 중</small>}
              {fruit.id === "pear" && cooldownSeconds > 0 && <small>{cooldownSeconds}초 후 재조회</small>}
            </button>
          ))}
        </div>

        <div className="result-status" aria-live="polite">
          {status === "loading" && <p>기상청 실측 자료를 조합하고 있습니다…</p>}
          {status === "error" && (
            <div className="error-message" role="alert">
              <strong>조회하지 못했습니다.</strong>
              <p>{errorMessage}</p>
              <button disabled={cooldownSeconds > 0} onClick={loadPearRecommendations} type="button">
                {cooldownSeconds > 0 ? `${cooldownSeconds}초 후 재조회` : "다시 조회"}
              </button>
            </div>
          )}
        </div>

        {status === "success" && result && (
          <section className="results" aria-labelledby="results-title">
            <div className="results__heading">
              <div>
                <p className="results__source">
                  {result.source.label} · {result.cache.status === "miss" ? "새로 조회" : "캐시 사용"}
                </p>
                <h2 id="results-title">배 산지 추천 Top 3</h2>
              </div>
              <button disabled={cooldownSeconds > 0} onClick={loadPearRecommendations} type="button">
                {cooldownSeconds > 0 ? `${cooldownSeconds}초 후 재조회` : "다시 조회"}
              </button>
            </div>

            <p className="results__summary">
              기준일 {result.referenceDate} · 관측 기간 {result.observationWindow.start} ~{" "}
              {result.observationWindow.end} · 품종 {result.fruit.cultivar.name} ({result.fruit.cultivar.status})
            </p>
            {result.source.note && <p className="results__notice">{result.source.note}</p>}

            <ol className="recommendation-list">
              {result.recommendations.map((recommendation) => (
                <li className="recommendation" key={recommendation.region.id}>
                  <h3>
                    {recommendation.rank}위 {recommendation.region.province} {recommendation.region.name} ·{" "}
                    {recommendation.score}점
                  </h3>
                  <p>
                    위험도 {recommendation.risk} · 신뢰도 {recommendation.confidence}
                  </p>
                  <ul className="reason-list">
                    {recommendation.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>

                  <h4>근거 원시값</h4>
                  <dl className="raw-metrics">
                    {metricLabels.map(([key, label, unit]) => (
                      <div key={key}>
                        <dt>{label}</dt>
                        <dd>{displayValue(recommendation.metrics[key], unit)}</dd>
                      </div>
                    ))}
                    <div>
                      <dt>점수 구성</dt>
                      <dd>
                        일조 {recommendation.scoreBreakdown.sunshine}점 / 고온{" "}
                        {recommendation.scoreBreakdown.heat}점 / 강수 {recommendation.scoreBreakdown.rain}점
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ol>

            <p className="results__disclaimer">{result.rules.disclaimer}</p>
            <details className="raw-response">
              <summary>전체 API 응답 JSON 보기</summary>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </details>
          </section>
        )}
      </section>
    </main>
  );
}
