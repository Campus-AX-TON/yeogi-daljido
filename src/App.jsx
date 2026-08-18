import { useEffect, useState } from "react";
import { FruitIconDefs } from "./components/FruitIcon.jsx";
import Home from "./components/Home.jsx";
import RawResults from "./components/RawResults.jsx";
import { FRUITS, getFruit } from "./data/fruits.js";

const RELOAD_COOLDOWN_SECONDS = 60;

export function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [resultsByFruit, setResultsByFruit] = useState({});
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
    const fruit = getFruit(fruitId);
    if (!fruit?.available || status === "loading") return;

    const cachedResult = resultsByFruit[fruitId];
    if (cachedResult && (cooldowns[fruitId] ?? 0) > 0) {
      setSelectedId(fruitId);
      setResult(cachedResult);
      setStatus("success");
      setErrorMessage("");
      return;
    }

    setSelectedId(fruitId);
    setStatus("loading");
    setResult(null);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/recommendations/${fruitId}?mode=auto`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "추천 결과를 불러오지 못했습니다.");

      setResult(payload);
      setResultsByFruit((current) => ({ ...current, [fruitId]: payload }));
      setStatus("success");
      setCooldowns((current) => ({ ...current, [fruitId]: RELOAD_COOLDOWN_SECONDS }));
    } catch (error) {
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
      {selectedId ? (
        <RawResults
          cooldown={cooldowns[selectedId] ?? 0}
          errorMessage={errorMessage}
          fruit={selectedFruit}
          onBack={goHome}
          onReload={() => loadRecommendations(selectedId)}
          result={result}
          status={status}
        />
      ) : (
        <Home cooldowns={cooldowns} fruits={FRUITS} onSelect={loadRecommendations} />
      )}
    </div>
  );
}
