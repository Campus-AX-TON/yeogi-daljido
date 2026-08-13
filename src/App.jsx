import { useMemo, useState } from "react";

const fruits = [
  {
    id: "peach",
    name: "복숭아",
    english: "PEACH",
    description: "햇살을 머금어 향긋하고 달콤해요",
    accent: "#F16E5A",
    imagePosition: "left",
    regions: [
      { rank: 1, place: "충북 충주", score: 92, sun: "+12%", rain: "8mm", temp: "10.8°C", freshness: 90 },
      { rank: 2, place: "경북 영천", score: 87, sun: "+8%", rain: "12mm", temp: "9.6°C", freshness: 86 },
      { rank: 3, place: "충북 음성", score: 83, sun: "+6%", rain: "15mm", temp: "9.1°C", freshness: 81 },
    ],
  },
  {
    id: "grape",
    name: "포도",
    english: "GRAPE",
    description: "알알이 짙은 단맛이 오른 여름 포도예요",
    accent: "#765D9B",
    imagePosition: "center",
    regions: [
      { rank: 1, place: "경북 김천", score: 94, sun: "+14%", rain: "7mm", temp: "11.2°C", freshness: 92 },
      { rank: 2, place: "충북 영동", score: 89, sun: "+11%", rain: "10mm", temp: "10.4°C", freshness: 88 },
      { rank: 3, place: "경기 화성", score: 82, sun: "+5%", rain: "16mm", temp: "9.0°C", freshness: 80 },
    ],
  },
  {
    id: "watermelon",
    name: "수박",
    english: "WATERMELON",
    description: "한입 베어 물면 시원한 단물이 가득해요",
    accent: "#39825A",
    imagePosition: "right",
    regions: [
      { rank: 1, place: "충남 부여", score: 93, sun: "+13%", rain: "9mm", temp: "12.1°C", freshness: 91 },
      { rank: 2, place: "경남 함안", score: 88, sun: "+9%", rain: "13mm", temp: "11.4°C", freshness: 87 },
      { rank: 3, place: "전북 고창", score: 84, sun: "+7%", rain: "14mm", temp: "10.6°C", freshness: 82 },
    ],
  },
];

function FruitImage({ position, className = "" }) {
  return (
    <div className={`fruit-image ${className}`} aria-hidden="true">
      <img className="fruit-asset" src={`/assets/fruit-${position === "left" ? "peach" : position === "center" ? "grape" : "watermelon"}.png`} alt="" />
    </div>
  );
}

function Brand() {
  return (
    <button className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
      <span className="brand-mark">여</span>
      <span><strong>여기 달지도</strong><small>제철의 단맛을 찾는 지도</small></span>
    </button>
  );
}

function Home({ onSelect }) {
  const [notice, setNotice] = useState(false);

  const scrollToFruit = () => document.querySelector("#seasonal-fruits")?.scrollIntoView({ behavior: "smooth" });

  return (
    <main className="home-shell">
      <header className="topbar">
        <Brand />
        <button className="text-button" onClick={() => { setNotice(true); setTimeout(() => setNotice(false), 2200); }}>최근 본 산지 <span>→</span></button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">AUGUST SEASON PICK</span>
          <h1>지금 가장 달콤한<br /><em>과일의 고향</em>을 찾아요.</h1>
          <p>기온, 일조량, 강수량을 한눈에 비교해<br />오늘 더 맛있는 제철 산지를 알려드릴게요.</p>
          <button className="primary-button" onClick={scrollToFruit}>8월 제철 과일 보기 <span>↓</span></button>
        </div>
        <div className="hero-visual">
          <span className="hero-label label-one">오늘의 제철</span>
          <FruitImage position="left" className="hero-fruit" />
          <div className="score-card"><strong>92</strong><span>오늘의<br />산지 점수</span></div>
          <span className="hero-caption">충북 충주 복숭아 · 당도 상승 중</span>
        </div>
      </section>

      <section className="season-section" id="seasonal-fruits">
        <div className="section-heading">
          <div><span className="eyebrow">IN SEASON NOW</span><h2>8월, 지금 맛있는 과일</h2></div>
          <p>과일을 고르면 전국의 기상 데이터를 비교해<br />가장 좋은 산지를 찾아드려요.</p>
        </div>
        <div className="fruit-grid">
          {fruits.map((fruit, index) => (
            <article className="fruit-card" key={fruit.id} style={{ "--card-accent": fruit.accent }}>
              <div className="fruit-order">0{index + 1}</div>
              <FruitImage position={fruit.imagePosition} />
              <span className="fruit-en">{fruit.english}</span>
              <h3>{fruit.name}</h3>
              <p>{fruit.description}</p>
              <button onClick={() => onSelect(fruit.id)}>좋은 산지 찾기 <span>→</span></button>
            </article>
          ))}
        </div>
      </section>

      <section className="trust-strip">
        <div><span>01</span><strong>기상 관측</strong><small>최근 7일 기온·강수</small></div>
        <div><span>02</span><strong>생육 조건</strong><small>품종별 최적 기준 비교</small></div>
        <div><span>03</span><strong>산지 추천</strong><small>오늘의 품질 점수 산출</small></div>
      </section>
      {notice && <div className="toast">아직 최근에 본 산지가 없어요.</div>}
    </main>
  );
}

function Metric({ label, value, note }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

function Dashboard({ fruitId, onBack, onFruitChange }) {
  const fruit = useMemo(() => fruits.find((item) => item.id === fruitId) || fruits[0], [fruitId]);
  const [activeRank, setActiveRank] = useState(1);
  const active = fruit.regions.find((region) => region.rank === activeRank) || fruit.regions[0];

  return (
    <main className="dashboard-shell">
      <header className="dashboard-topbar">
        <Brand />
        <nav className="fruit-tabs" aria-label="과일 선택">
          {fruits.map((item) => <button className={item.id === fruit.id ? "active" : ""} onClick={() => { onFruitChange(item.id); setActiveRank(1); }} key={item.id}>{item.name}</button>)}
        </nav>
        <span className="updated">2026. 08. 13 · 06:00 업데이트</span>
      </header>

      <div className="dashboard-body">
        <button className="back-button" onClick={onBack}>← 제철 과일 다시 고르기</button>
        <div className="dashboard-title">
          <div><span className="eyebrow">TODAY'S BEST ORIGIN</span><h1>{fruit.name}가 가장 맛있을<br /><em>산지를 찾았어요.</em></h1></div>
          <p>최근 7일의 기상과 출하 데이터를 종합한 결과예요.<br />점수가 높을수록 지금 맛볼 가치가 높아요.</p>
        </div>

        <section className="dashboard-grid">
          <div className="map-panel">
            <div className="panel-header"><strong>산지 지도</strong><span>전국 실시간 비교</span></div>
            <img src="/assets/korea-map.png" alt={`${fruit.name} 추천 산지 지도`} />
            <div className="map-legend"><span><i className="dot coral" />85점 이상</span><span><i className="dot amber" />75–84점</span><span><i className="dot green" />70–74점</span></div>
          </div>

          <div className="rank-panel">
            <div className="panel-header"><strong>추천 산지</strong><span>종합 품질 점수</span></div>
            {fruit.regions.map((region) => (
              <button className={`rank-card ${activeRank === region.rank ? "selected" : ""}`} key={region.rank} onClick={() => setActiveRank(region.rank)}>
                <span className={`rank rank-${region.rank}`}>{region.rank}</span>
                <span className="rank-place"><strong>{region.place}</strong><small>{region.rank === 1 ? "비가 적고 일교차가 커 당도 형성에 좋아요." : "안정적인 날씨로 품질이 고르게 올랐어요."}</small></span>
                <span className="rank-score"><strong>{region.score}</strong>점<small>신뢰도 높음</small></span>
              </button>
            ))}
          </div>
        </section>

        <section className="evidence-panel">
          <div className="evidence-copy">
            <span className="rank rank-1">{active.rank}</span>
            <div><span className="eyebrow">WHY HERE?</span><h2>{active.place}, 지금 추천하는 이유</h2><p>평년보다 햇빛은 충분하고 수확 전 비는 적어요. 큰 일교차 덕분에 과육의 단맛과 향이 또렷해지는 시기예요.</p></div>
          </div>
          <div className="metrics">
            <Metric label="일조량" value={active.sun} note="평년 대비" />
            <Metric label="수확 전 강수" value={active.rain} note="최근 7일" />
            <Metric label="일교차" value={active.temp} note="일 평균" />
            <Metric label="출하 신선도" value={`${active.freshness}점`} note="산지 출하 기준" />
          </div>
        </section>

        <section className="method-strip">
          <div><span className="eyebrow">DATA STANDARD</span><h3>날씨가 맛이 되는 순간을 계산해요.</h3></div>
          <p>기상청 관측 데이터와 산지별 출하 신호를 품종의 생육 조건에 맞춰 비교합니다.</p>
          <button onClick={() => alert("기상청 ASOS · 농촌진흥청 농업기상 · 도매시장 출하정보를 기준으로 구성한 목업입니다.")}>추천 기준 보기 →</button>
        </section>
      </div>
    </main>
  );
}

export function App() {
  const [screen, setScreen] = useState("home");
  const [fruitId, setFruitId] = useState("peach");

  const selectFruit = (id) => {
    setFruitId(id);
    setScreen("dashboard");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  return screen === "home"
    ? <Home onSelect={selectFruit} />
    : <Dashboard fruitId={fruitId} onFruitChange={setFruitId} onBack={() => setScreen("home")} />;
}
