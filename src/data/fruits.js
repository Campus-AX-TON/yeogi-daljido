export const FRUITS = [
  {
    id: "grape",
    name: "포도",
    accent: "grape",
    season: "한창이에요",
    seasonNote: "추천 데이터를 불러오는 중",
    heroLine: "지금 포도, 어디가 가장 좋을까?",
    available: true,
  },
  {
    id: "pear",
    name: "배",
    accent: "pear",
    season: "막 나왔어요",
    seasonNote: "추천 데이터를 불러오는 중",
    heroLine: "지금 배, 어디가 가장 좋을까?",
    available: true,
  },
  {
    id: "apple",
    name: "사과",
    accent: "apple",
    season: "막 나왔어요",
    seasonNote: "기상청 사과 주산지 실측 데이터",
    heroLine: "지금 사과, 어디가 가장 좋을까?",
    available: true,
  },
];

export const getFruit = (id) => FRUITS.find((fruit) => fruit.id === id);
