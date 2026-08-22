import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import errorAnimation from "../assets/worm-apple-error.lottie?url";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion.js";
import FruitBackdrop from "./FruitBackdrop.jsx";

export default function ErrorScreen({ errorMessage, fruit, onBack, onRetry }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <>
      <FruitBackdrop />
      <main className="error-page">
        <p className="error-eyebrow mono">여기, 달지도?</p>

        <div className="error-visual" aria-hidden="true">
          <DotLottieReact
            autoplay={!prefersReducedMotion}
            className="error-lottie"
            loop={!prefersReducedMotion}
            src={errorAnimation}
          />
        </div>

        <section className="error-copy" role="alert">
          <h1>잠깐, 데이터를 불러오지 못했어요</h1>
          <p>
            <strong>{fruit.name}</strong> 산지 정보를 확인하는 데 예상보다 오래 걸렸어요.
            <br />
            잠시 후 다시 시도하면 이어서 확인할 수 있어요.
          </p>
          <span className="error-message mono">{errorMessage}</span>
        </section>

        <div className="error-actions">
          <button className="error-retry-button" onClick={onRetry} type="button">
            다시 시도
          </button>
          <button className="error-back-button" onClick={onBack} type="button">
            과일 다시 선택
          </button>
        </div>
      </main>
    </>
  );
}
