import { getCachedPearRecommendations } from "../../worker/index.js";

function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export default {
  async fetch(request) {
    if (request.method !== "GET") {
      return json(
        { error: "METHOD_NOT_ALLOWED", message: "GET 요청만 지원합니다." },
        { status: 405, headers: { allow: "GET" } },
      );
    }

    const url = new URL(request.url);

    try {
      const result = await getCachedPearRecommendations({
        serviceKey: process.env.DATA_GO_KR_SERVICE_KEY,
        date: url.searchParams.get("date") ?? undefined,
        mode: url.searchParams.get("mode") ?? "auto",
      });
      const cacheHeaders =
        result.source.status === "live"
          ? {
              "cache-control": "public, max-age=900",
              "vercel-cdn-cache-control": "public, s-maxage=21600, stale-while-revalidate=86400",
            }
          : { "cache-control": "no-store" };

      return json(result, {
        headers: { ...cacheHeaders, "x-pear-cache": result.cache.status },
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
  },
};
