import { createPearRecommendations } from "../worker/index.js";

const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
const requestedDate = process.argv[2];

if (!serviceKey) {
  console.error("[pear-api] DATA_GO_KR_SERVICE_KEY가 .env.local에 없습니다.");
  process.exit(1);
}

console.info(`[pear-api] 실측 API 확인 시작${requestedDate ? ` · 요청일 ${requestedDate}` : ""}`);
const startedAt = Date.now();

try {
  const result = await createPearRecommendations({
    serviceKey,
    date: requestedDate,
    mode: "live",
  });

  console.info(`[pear-api] 연결 성공 · ${Date.now() - startedAt}ms`);
  console.info(
    `[pear-api] 기준일 ${result.referenceDate} · 관측 기간 ${result.observationWindow.start} ~ ${result.observationWindow.end}`,
  );
  if (result.source.note) console.info(`[pear-api] 참고 · ${result.source.note}`);
  console.info("[pear-api] Top 3 추천");

  for (const recommendation of result.recommendations) {
    const metrics = recommendation.metrics;
    console.info(
      [
        `  ${recommendation.rank}위 ${recommendation.region.province} ${recommendation.region.name}`,
        `${recommendation.score}점`,
        `위험도 ${recommendation.risk}`,
        `일조 평년비 ${metrics.sunshineRatio}%`,
        `고온일 ${metrics.hotDays}일`,
        `누적 강수 ${metrics.rainfallMm}mm`,
        `평균 습도 ${metrics.humidityAverage ?? "자료 없음"}%`,
        `특보 ${metrics.warningDays}일`,
      ].join(" · "),
    );
  }
} catch (error) {
  console.error(
    `[pear-api] 확인 실패 · ${error instanceof Error ? error.message : "알 수 없는 오류"} · ${Date.now() - startedAt}ms`,
  );
  process.exit(1);
}
