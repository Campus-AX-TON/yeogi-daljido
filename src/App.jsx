import { useEffect, useState } from "react";

const RELOAD_COOLDOWN_SECONDS = 60;

const fruits = [
  { id: "pear", name: "배", emoji: "🍐", available: true },
  { id: "grape", name: "포도", emoji: "🍇", available: true },
  { id: "apple", name: "사과", emoji: "🍎", available: false },
];

const metricLabelsByFruit = {
  pear: [
    ["sunshineRatio", "최근 3년 대비 일조", "%"],
    ["sunshineHours", "누적 일조", "시간"],
    ["sunshineBaselineHours", "3개년 평균 일조", "시간"],
    ["hotDays", "31℃ 이상 고온일", "일"],
    ["maxTemperature", "최고기온", "℃"],
    ["rainfallMm", "누적 강수", "mm"],
    ["rainfallRatio", "최근 3년 대비 강수", "%"],
    ["rainfallBaselineMm", "3개년 평균 강수", "mm"],
    ["humidityAverage", "평균 습도", "%"],
    ["warningDays", "기상특보 발생일", "일"],
    ["observedDays", "관측일", "일"],
  ],
  grape: [
    ["gdd", "누적 생육온도(GDD)", "℃·일"],
    ["gddBaseline", "3개년 평균 GDD", "℃·일"],
    ["gddRatio", "최근 3년 대비 GDD", "%"],
    ["averageTemperature", "기간 평균기온", "℃"],
    ["hotDays", "31℃ 이상 고온일", "일"],
    ["sunshineHours", "누적 일조", "시간"],
    ["sunshineBaselineHours", "3개년 평균 일조", "시간"],
    ["sunshineRatio", "최근 3년 대비 일조", "%"],
    ["rainfallMm", "누적 강수", "mm"],
    ["rainfallBaselineMm", "3개년 평균 강수", "mm"],
    ["rainfallRatio", "최근 3년 대비 강수", "%"],
    ["rainyDays", "강우일", "일"],
    ["longestRainStreak", "최장 연속 강우", "일"],
    ["humidityAverage", "평균 습도", "%"],
    ["windAverage", "평균 풍속", "m/s"],
    ["warningDays", "기상특보 발생일", "일"],
    ["observedDays", "관측일", "일"],
  ],
};

function displayValue(value, unit) {
  return value === null || value === undefined ? "자료 없음" : `${value}${unit}`;
}

function scoreBreakdownText(result, recommendation) {
  if (result.fruit.id === "grape") {
    return `생육온도 ${recommendation.scoreBreakdown.temperature}점 / 수분 ${recommendation.scoreBreakdown.moisture}점 / 일조 대체지표 ${recommendation.scoreBreakdown.sunshineProxy}점`;
  }

  return `일조 ${recommendation.scoreBreakdown.sunshine}점 / 고온 ${recommendation.scoreBreakdown.heat}점 / 강수 ${recommendation.scoreBreakdown.rain}점`;
}

export function App() {
  const [status, setStatus] = useState("idle");
  const [activeFruitId, setActiveFruitId] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [cooldowns, setCooldowns] = useState({});

  useEffect(() => {
    if (!Object.values(cooldowns).some((seconds) => seconds > 0)) return undefined;

    const timeout = window.setTimeout(() => {
      setCooldowns((current) =>
        Object.fromEntries(
          Object.entries(current).map(([fruitId, seconds]) => [fruitId, Math.max(0, seconds - 1)]),
        ),
      );
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [cooldowns]);

  async function loadRecommendations(fruitId) {
    if (status === "loading" || (cooldowns[fruitId] ?? 0) > 0) return;
    setActiveFruitId(fruitId);
    setStatus("loading");
    setResult(null);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/recommendations/${fruitId}?mode=live`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message ?? "추천 결과를 불러오지 못했습니다.");
      }

      setResult(payload);
      setStatus("success");
      setCooldowns((current) => ({ ...current, [fruitId]: RELOAD_COOLDOWN_SECONDS }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "추천 결과를 불러오지 못했습니다.");
      setStatus("error");
    }
  }

  const activeCooldown = activeFruitId ? cooldowns[activeFruitId] ?? 0 : 0;
  const metricLabels = result ? metricLabelsByFruit[result.fruit.id] ?? [] : [];

  return (
    <main className="fruit-picker">
      <section className="fruit-picker__panel" aria-labelledby="fruit-picker-title">
        <p className="fruit-picker__eyebrow">여기 달지도</p>
        <h1 id="fruit-picker-title">어떤 과일을 찾아볼까요?</h1>
        <p className="fruit-picker__description">
          과일을 선택하면 기상 데이터를 조합해 좋은 산지 Top 3를 추천합니다.
        </p>

        <div className="fruit-picker__buttons">
          {fruits.map((fruit) => {
            const cooldown = cooldowns[fruit.id] ?? 0;
            return (
              <button
                className="fruit-button"
                data-fruit-id={fruit.id}
                disabled={!fruit.available || status === "loading" || cooldown > 0}
                key={fruit.id}
                onClick={fruit.available ? () => loadRecommendations(fruit.id) : undefined}
                type="button"
              >
                <span className="fruit-button__image" aria-hidden="true">
                  {fruit.emoji}
                </span>
                <span>{fruit.name}</span>
                {!fruit.available && <small>준비 중</small>}
                {cooldown > 0 && <small>{cooldown}초 후 재조회</small>}
              </button>
            );
          })}
        </div>

        <div className="result-status" aria-live="polite">
          {status === "loading" && <p>기상청 실측 자료와 최근 3개년 기준값을 조합하고 있습니다…</p>}
          {status === "error" && (
            <div className="error-message" role="alert">
              <strong>조회하지 못했습니다.</strong>
              <p>{errorMessage}</p>
              <button
                disabled={activeCooldown > 0}
                onClick={() => loadRecommendations(activeFruitId)}
                type="button"
              >
                {activeCooldown > 0 ? `${activeCooldown}초 후 재조회` : "다시 조회"}
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
                <h2 id="results-title">{result.fruit.name} 산지 추천 Top 3</h2>
              </div>
              <button
                disabled={activeCooldown > 0}
                onClick={() => loadRecommendations(result.fruit.id)}
                type="button"
              >
                {activeCooldown > 0 ? `${activeCooldown}초 후 재조회` : "다시 조회"}
              </button>
            </div>

            <p className="results__summary">
              {result.candidateScope ? `${result.candidateScope.label} · ` : ""}기준일 {result.referenceDate} · 관측 기간{" "}
              {result.observationWindow.start} ~ {result.observationWindow.end} · 품종 {result.fruit.cultivar.name} ({" "}
              {result.fruit.cultivar.status})
            </p>
            {result.source.note && <p className="results__notice">{result.source.note}</p>}

            <ol className="recommendation-list">
              {result.recommendations.map((recommendation) => {
                const evidence = result.evidenceByRegion?.[recommendation.region.id];
                return (
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

                    <h4>추천 계산에 활용한 데이터</h4>
                    <dl className="raw-metrics">
                      {metricLabels.map(([key, label, unit]) => (
                        <div key={key}>
                          <dt>{label}</dt>
                          <dd>{displayValue(recommendation.metrics[key], unit)}</dd>
                        </div>
                      ))}
                      <div>
                        <dt>점수 구성</dt>
                        <dd>{scoreBreakdownText(result, recommendation)}</dd>
                      </div>
                    </dl>

                    {evidence && (
                      <details className="raw-response raw-response--region">
                        <summary>
                          {recommendation.region.name} 기상청 일별 원본 · 계산용 정규화 데이터 보기
                        </summary>
                        <pre>{JSON.stringify(evidence, null, 2)}</pre>
                      </details>
                    )}
                  </li>
                );
              })}
            </ol>

            {result.dataUsage && (
              <section className="data-usage" aria-labelledby="data-usage-title">
                <h3 id="data-usage-title">데이터 활용 기준</h3>
                <h4>점수에 반영</h4>
                <ul>
                  {result.dataUsage.scoring.map((item) => (
                    <li key={item.id}>
                      <strong>{item.label}</strong> {item.weight}% — {item.description}
                    </li>
                  ))}
                </ul>
                <h4>참고값으로만 표시</h4>
                <ul>
                  {result.dataUsage.contextOnly.map((item) => (
                    <li key={item.id}>
                      <strong>{item.label}</strong> — {item.reason}
                    </li>
                  ))}
                </ul>
                <h4>현재 한계</h4>
                <ul>
                  {result.dataUsage.limitations.map((limitation) => (
                    <li key={limitation}>{limitation}</li>
                  ))}
                </ul>
              </section>
            )}

            <p className="results__disclaimer">{result.rules.disclaimer}</p>
            <details className="raw-response">
              <summary>가공된 추천 API 응답 JSON 전체 보기</summary>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </details>
          </section>
        )}
      </section>
    </main>
  );
}
