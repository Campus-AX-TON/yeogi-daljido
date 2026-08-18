import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { getCachedPearRecommendations } from "./worker/index.js";

function localPearApi(serviceKey) {
  return {
    name: "local-pear-api",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url ?? "/", "http://localhost");
        if (url.pathname !== "/api/recommendations/pear") {
          next();
          return;
        }

        response.setHeader("content-type", "application/json; charset=utf-8");
        response.setHeader("cache-control", "no-store");
        if (request.method !== "GET") {
          response.statusCode = 405;
          response.setHeader("allow", "GET");
          response.end(JSON.stringify({ error: "METHOD_NOT_ALLOWED", message: "GET 요청만 지원합니다." }));
          return;
        }

        const startedAt = Date.now();
        console.info("[pear-api] 기상청 실측 조회 시작");

        try {
          const result = await getCachedPearRecommendations({
            serviceKey,
            date: url.searchParams.get("date") ?? undefined,
            mode: url.searchParams.get("mode") ?? "auto",
          });
          const top3 = result.recommendations.map((item) => item.region.name).join(", ");
          console.info(
            `[pear-api] 성공 · 캐시 ${result.cache.status} · 기준일 ${result.referenceDate} · Top 3: ${top3} · ${Date.now() - startedAt}ms`,
          );
          response.statusCode = 200;
          response.setHeader("x-pear-cache", result.cache.status);
          response.end(JSON.stringify(result));
        } catch (error) {
          console.error(
            `[pear-api] 실패 · ${error instanceof Error ? error.message : "알 수 없는 오류"} · ${Date.now() - startedAt}ms`,
          );
          response.statusCode = error?.status ?? 502;
          response.end(
            JSON.stringify({
              error: "PEAR_RECOMMENDATION_FAILED",
              message: error instanceof Error ? error.message : "추천 데이터를 만들지 못했습니다.",
            }),
          );
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    build: {
      outDir: "dist/client",
    },
    optimizeDeps: {
      include: ["react", "react-dom/client"],
    },
    server: {
      host: "0.0.0.0",
      allowedHosts: ["terminal.local"],
      warmup: {
        clientFiles: ["./src/main.jsx"],
      },
    },
    plugins: [react(), localPearApi(env.DATA_GO_KR_SERVICE_KEY)],
  };
});
