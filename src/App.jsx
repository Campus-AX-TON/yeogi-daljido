import { useState } from "react";
import ErrorScreen from "./components/ErrorScreen.jsx";
import { FruitIconDefs } from "./components/FruitIcon.jsx";
import Home from "./components/Home.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import RawResults from "./components/RawResults.jsx";
import { FRUITS, getFruit } from "./data/fruits.js";

const RELOAD_COOLDOWN_MS = 60_000;
const MIN_LOADING_TIME_MS = 2200;
const REQUEST_TIMEOUT_MS = 10_000;

function waitForMinimumLoading(startedAt) {
  const remainingTime = MIN_LOADING_TIME_MS - (performance.now() - startedAt);
  return remainingTime > 0
    ? new Promise((resolve) => window.setTimeout(resolve, remainingTime))
    : Promise.resolve();
}

export function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [resultsByFruit, setResultsByFruit] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshAvailableAtByFruit, setRefreshAvailableAtByFruit] = useState({});

  async function loadRecommendations(fruitId) {
    const fruit = getFruit(fruitId);
    if (!fruit?.available || status === "loading") return;

    setSelectedId(fruitId);
    setStatus("loading");
    setResult(null);
    setErrorMessage("");

    const loadingStartedAt = performance.now();
    const cachedResult = resultsByFruit[fruitId];
    const canReuseResult =
      Boolean(cachedResult) && Date.now() < (refreshAvailableAtByFruit[fruitId] ?? 0);
    let requestTimedOut = false;

    try {
      if (canReuseResult) {
        await waitForMinimumLoading(loadingStartedAt);
        setResult(cachedResult);
        setStatus("success");
        return;
      }

      const controller = new AbortController();
      const requestTimeout = window.setTimeout(() => {
        requestTimedOut = true;
        controller.abort();
      }, REQUEST_TIMEOUT_MS);
      let payload;

      try {
        const response = await fetch(`/api/recommendations/${fruitId}?mode=auto`, {
          signal: controller.signal,
        });
        payload = await response.json();
        if (!response.ok) throw new Error(payload.message ?? "추천 결과를 불러오지 못했습니다.");
      } finally {
        window.clearTimeout(requestTimeout);
      }

      await waitForMinimumLoading(loadingStartedAt);

      setResult(payload);
      setResultsByFruit((current) => ({ ...current, [fruitId]: payload }));
      setStatus("success");
      setRefreshAvailableAtByFruit((current) => ({
        ...current,
        [fruitId]: Date.now() + RELOAD_COOLDOWN_MS,
      }));
    } catch (error) {
      await waitForMinimumLoading(loadingStartedAt);
      setErrorMessage(
        requestTimedOut
          ? "10초 동안 응답이 없어 요청을 멈췄어요."
          : "연결이 잠시 불안정해요. 다시 시도해 주세요.",
      );
      setStatus("error");
    }
  }

  function goHome() {
    setSelectedId(null);
    setStatus("idle");
    setResult(null);
    setErrorMessage("");
  }

  const selectedFruit = selectedId ? getFruit(selectedId) : null;

  return (
    <div className="app">
      <FruitIconDefs />
      {status === "loading" && selectedFruit ? (
        <LoadingScreen fruit={selectedFruit} />
      ) : status === "error" && selectedFruit ? (
        <ErrorScreen
          errorMessage={errorMessage}
          fruit={selectedFruit}
          onBack={goHome}
          onRetry={() => loadRecommendations(selectedId)}
        />
      ) : selectedId ? (
        <RawResults
          fruit={selectedFruit}
          onBack={goHome}
          onReload={() => loadRecommendations(selectedId)}
          result={result}
        />
      ) : (
        <Home fruits={FRUITS} onSelect={loadRecommendations} />
      )}
    </div>
  );
}
