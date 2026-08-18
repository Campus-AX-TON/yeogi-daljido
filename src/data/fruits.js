export const FRUITS = [
  {
    id: "grape",
    name: "포도",
    accent: "grape",
    season: "제철",
    seasonNote: "추천 데이터를 불러오는 중",
    heroLine: "지금 포도, 어디가 가장 좋을까?",
    available: true,
  },
  {
    id: "pear",
    name: "배",
    accent: "pear",
    season: "출하 임박",
    seasonNote: "추천 데이터를 불러오는 중",
    heroLine: "지금 배, 어디가 가장 좋을까?",
    available: true,
  },
  {
    id: "apple",
    name: "사과",
    accent: "apple",
    season: "준비 중",
    seasonNote: "사과 데이터 준비 중",
    heroLine: "사과 추천은 곧 만나요.",
    available: false,
  },
];

export const getFruit = (id) => FRUITS.find((fruit) => fruit.id === id);
