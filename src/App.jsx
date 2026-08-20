import { useState } from "react";
import { FruitIconDefs } from "./components/FruitIcon.jsx";
import Home from "./components/Home.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import RawResults from "./components/RawResults.jsx";
import { FRUITS, getFruit } from "./data/fruits.js";

const RELOAD_COOLDOWN_MS = 60_000;
const MIN_LOADING_TIME_MS = 2200;

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

    try {
      if (canReuseResult) {
        await waitForMinimumLoading(loadingStartedAt);
        setResult(cachedResult);
        setStatus("success");
        return;
      }

      const response = await fetch(`/api/recommendations/${fruitId}?mode=auto`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "추천 결과를 불러오지 못했습니다.");

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
      setErrorMessage(error instanceof Error ? error.message : "추천 결과를 불러오지 못했습니다.");
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
      ) : selectedId ? (
        <RawResults
          errorMessage={errorMessage}
          fruit={selectedFruit}
          onBack={goHome}
          onReload={() => loadRecommendations(selectedId)}
          result={result}
          status={status}
        />
      ) : (
        <Home fruits={FRUITS} onSelect={loadRecommendations} />
      )}
    </div>
  );
}
