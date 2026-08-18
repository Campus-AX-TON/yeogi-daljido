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

export default function RawResults({
  cooldown,
  errorMessage,
  fruit,
  onBack,
  onReload,
  result,
  status,
}) {
  const metricLabels = result ? metricLabelsByFruit[result.fruit.id] ?? [] : [];

  return (
    <main className="raw-results-page">
      <section className="raw-results-panel" aria-live="polite">
        <button className="raw-back-button" onClick={onBack} type="button">
          ← 과일 다시 선택
        </button>

        <header className="raw-results-intro">
          <p>여기 달지도 · 원본 데이터 화면</p>
          <h1>{fruit.name} 산지 추천</h1>
          <span>두 번째 화면 디자인 적용 전, 추천 근거와 API 데이터를 그대로 표시합니다.</span>
        </header>

        {status === "loading" && (
          <div className="raw-result-status" role="status">
            기상청 실측 자료와 최근 3개년 기준값을 조합하고 있습니다…
          </div>
        )}

        {status === "error" && (
          <div className="raw-error-message" role="alert">
            <strong>조회하지 못했습니다.</strong>
            <p>{errorMessage}</p>
            <button disabled={cooldown > 0} onClick={onReload} type="button">
              {cooldown > 0 ? `${cooldown}초 후 재조회` : "다시 조회"}
            </button>
          </div>
        )}

        {status === "success" && result && (
          <section className="raw-results" aria-labelledby="raw-results-title">
            <div className="raw-results-heading">
              <div>
                <p className="raw-results-source">
                  {result.source.label} · {result.cache.status === "miss" ? "새로 조회" : "캐시 사용"}
                </p>
                <h2 id="raw-results-title">{result.fruit.name} 산지 추천 Top 3</h2>
              </div>
              <button disabled={cooldown > 0} onClick={onReload} type="button">
                {cooldown > 0 ? `${cooldown}초 후 재조회` : "다시 조회"}
              </button>
            </div>

            <p className="raw-results-summary">
              {result.candidateScope ? `${result.candidateScope.label} · ` : ""}
              기준일 {result.referenceDate} · 관측 기간 {result.observationWindow.start} ~{" "}
              {result.observationWindow.end} · 품종 {result.fruit.cultivar.name} (
              {result.fruit.cultivar.status})
            </p>
            {result.source.note && <p className="raw-results-notice">{result.source.note}</p>}

            <ol className="raw-recommendation-list">
              {result.recommendations.map((recommendation) => {
                const evidence = result.evidenceByRegion?.[recommendation.region.id];
                return (
                  <li className="raw-recommendation" key={recommendation.region.id}>
                    <h3>
                      {recommendation.rank}위 {recommendation.region.province}{" "}
                      {recommendation.region.name} · {recommendation.score}점
                    </h3>
                    <p>
                      위험도 {recommendation.risk} · 신뢰도 {recommendation.confidence}
                    </p>
                    <ul className="raw-reason-list">
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
              <section className="raw-data-usage" aria-labelledby="raw-data-usage-title">
                <h3 id="raw-data-usage-title">데이터 활용 기준</h3>
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

            <p className="raw-results-disclaimer">{result.rules.disclaimer}</p>
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
