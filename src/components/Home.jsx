import FruitBackdrop from "./FruitBackdrop.jsx";
import FruitIcon from "./FruitIcon.jsx";

function todayInKorea() {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replaceAll(". ", ".")
    .replace(/\.$/, "");
}

export default function Home({ fruits, onSelect }) {
  return (
    <>
      <FruitBackdrop />
      <main className="home">
        <header className="home-hero">
          <p className="eyebrow mono">Seasonal Fruit Origin Map</p>
          <h1 className="pun">
            여기 <span className="pun-accent">달</span>지도
          </h1>
          <p className="lede">
            제철 과일, 어디서 살지 고민된다면?
            <br />
            기후데이터를 바탕으로 더 나은 산지 선택을 도와드려요.
          </p>
          <p className="thesis">“다가오는 추석, 어느 산지의 과일이 좋을까요?”</p>
        </header>

        <section className="picker" aria-label="과일 선택">
          <p className="picker-label mono">과일을 선택하고 Top 3 산지를 확인하세요</p>
          <div className="picker-grid">
            {fruits.map((fruit) => (
              <button
                key={fruit.id}
                className="fruit-card"
                data-accent={fruit.accent}
                disabled={!fruit.available}
                onClick={() => onSelect(fruit.id)}
                type="button"
              >
                <span className="fruit-card-badge">
                  <FruitIcon fruit={fruit.id} className="fruit-card-icon" />
                </span>
                <span className="fruit-card-name">{fruit.name}</span>
                <span className="fruit-card-season">{fruit.season}</span>
              </button>
            ))}
          </div>
        </section>

        <footer className="home-foot mono">DATA SNAPSHOT · {todayInKorea()} 기준</footer>
      </main>
    </>
  );
}
