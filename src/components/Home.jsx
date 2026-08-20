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
          <p className="eyebrow mono">SWEETNESS INTELLIGENCE MAP</p>
          <h1 className="pun">
            여기, <span className="pun-accent">달</span>지도?
          </h1>
          <p className="lede">
            여기달지도는 기후·생육·출하 데이터를 분석해
            <br />
            제철 과일의 진짜 단맛 산지를 알려주는 서비스예요.
          </p>
          <p className="thesis">“그래서 지금, 이 과일은 어느 산지를 사는 게 좋을까?”</p>
        </header>

        <section className="picker" aria-label="과일 선택">
          <p className="picker-label mono">과일을 선택하세요</p>
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
                <span className="fruit-card-cta mono">
                  {fruit.available ? "Top 3 산지 보기 →" : "데이터 준비 중"}
                </span>
              </button>
            ))}
          </div>
        </section>

        <footer className="home-foot mono">DATA SNAPSHOT · {todayInKorea()} 기준</footer>
      </main>
    </>
  );
}
