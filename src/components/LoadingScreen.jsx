import { useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import loadingAnimation from "../assets/thanksgiving-basket.lottie?url";
import FruitBackdrop from "./FruitBackdrop.jsx";

export default function LoadingScreen({ fruit }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return (
    <>
      <FruitBackdrop />
      <main className="loading-page" aria-busy="true" aria-live="polite">
        <p className="loading-eyebrow mono">여기, 달지도?</p>

        <div className="loading-visual" aria-hidden="true">
          <DotLottieReact
            autoplay={!prefersReducedMotion}
            className="loading-lottie"
            loop={!prefersReducedMotion}
            speed={2}
            src={loadingAnimation}
          />
        </div>

        <section className="loading-copy">
          <h1>잠시만 기다려주세요</h1>
          <p>
            기상·생육·출하 데이터를 모아
            <br />
            <strong>{fruit.name}</strong>가 가장 달콤할 산지를 찾고 있어요.
          </p>
        </section>

        <p className="loading-status mono" role="status">
          추천 데이터 불러오는 중…
        </p>
      </main>
    </>
  );
}
