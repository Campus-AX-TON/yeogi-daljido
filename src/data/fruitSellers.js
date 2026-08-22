import { getVerifiedOriginPurchasePlaces } from "./originPurchaseCoverage.js";

export const FRUIT_PURCHASE_VERIFICATION = {
  criteria: [
    "추천 산지와 생산지가 일치함",
    "생과 상품 상세 또는 해당 과일 판매 목록이 확인됨",
    "구매 가능한 상품이 노출되고 품절 상태가 아님",
    "개별 상품은 생산자 관계를, 지역 목록은 운영 주체를 확인함",
  ],
  verifiedAt: "2026-08-22",
};

export const FRUIT_PURCHASE_OPTIONS = [
  {
    producer: {
      description: "경북 의성에서 여름 품종 썸머킹 생과를 판매하는 사과 농가예요.",
      entityLabel: "생산 농가",
      name: "춘산사과농원",
      phone: "010-5512-5754",
      profileUrl: "https://esmall.cyso.co.kr/seller/main?id=dbsdbsxo",
    },
    fruitId: "apple",
    listing: {
      kind: "product",
      productName: "여름 햇사과 썸머킹 5kg 꼬마과",
      url: "https://esmall.cyso.co.kr/item/detail?id=17547654&saleItemNo=1785031448",
    },
    marketplace: {
      description: "의성군이 위탁 운영하는 공식 농특산물 직거래몰로, 가격과 배송·결제를 확인할 수 있어요.",
      name: "의성군 직거래장터 의성장날",
    },
    region: "의성",
  },
  {
    producer: {
      description: "경북 영주에서 아오리사과 생과를 판매하는 사과 농가예요.",
      entityLabel: "생산 농가",
      name: "그랑농원",
      phone: "010-8751-1813",
      profileUrl: "https://yjmarket.cyso.co.kr/seller/main?id=msk1813",
    },
    fruitId: "apple",
    listing: {
      kind: "product",
      productName: "영주 아오리사과 3kg 소과",
      url: "https://yjmarket.cyso.co.kr/item/detail?id=10039689&saleItemNo=1723176390",
    },
    marketplace: {
      description: "경북 농특산물 쇼핑몰 사이소의 영주 지역몰로, 상품 가격과 배송·결제를 확인할 수 있어요.",
      name: "경상북도 사이소·영주장날",
    },
    region: "영주",
  },
  {
    producer: {
      description: "1956년부터 3대째 경기 평택 진위면에서 배를 재배해 온 농가예요.",
      entityLabel: "생산 농가",
      name: "슬기로운 청년농부",
      phone: "070-4012-3960",
      profileUrl: "https://ptfarm.co.kr/shop/marketView.php?id=mprepsh",
    },
    fruitId: "pear",
    listing: {
      kind: "product",
      productName: "2026 추석 일반 선물용 배 7.5kg",
      url: "https://ptfarm.co.kr/shop/item.php?it_id=1786931654",
    },
    marketplace: {
      description: "평택시로컬푸드재단이 운영하는 평택시 공식 농특산물 온라인 쇼핑몰이에요.",
      name: "평택시 공식쇼핑몰 평택팜",
    },
    region: "평택",
  },
  {
    producer: {
      description: "김천산 샤인머스켓 생과를 판매하는 산지 농업회사법인이에요.",
      entityLabel: "산지 판매자",
      name: "농업회사법인 주식회사 삼송",
      phone: "054-434-8886",
      profileUrl: "https://gcmall.cyso.co.kr/seller/main?id=samsong4160",
    },
    fruitId: "grape",
    listing: {
      kind: "product",
      productName: "김천 망고포도 샤인머스켓 4kg",
      url: "https://gcmall.cyso.co.kr/item/detail?id=10061325&saleItemNo=1817909383",
    },
    marketplace: {
      description: "김천시가 위탁 운영하는 공식 농특산물 직거래몰로, 가격과 배송·결제를 확인할 수 있어요.",
      name: "김천시 공식몰 김천팜앤장터",
    },
    region: "김천",
  },
  {
    producer: {
      description: "상품 고시에는 이진우 농가가 생산자로 표시되며, 상주 농가 상품을 모아 판매하는 로컬푸드 사업단이에요.",
      entityLabel: "산지 판매자",
      name: "상주로컬푸드 유통사업단",
      phone: "054-535-3388",
      profileUrl: "https://sjmall.cyso.co.kr/seller/main?id=doejrwjd",
    },
    fruitId: "grape",
    listing: {
      kind: "product",
      productName: "상주 샤인머스캣 특명품 2kg",
      url: "https://sjmall.cyso.co.kr/item/detail?id=10039439&saleItemNo=1721184051",
    },
    marketplace: {
      description: "상주시가 위탁 운영하는 공식 농특산물 쇼핑몰로, 가격과 배송·결제를 확인할 수 있어요.",
      name: "상주시 공식몰 명실상주몰",
    },
    region: "상주",
  },
];

export function getFruitPurchaseOptionsForRegion(fruitId, regionName) {
  return FRUIT_PURCHASE_OPTIONS.filter(
    (option) => option.fruitId === fruitId && option.region === regionName,
  );
}

export function getOriginPurchasePlacesForRegion(fruitId, regionName) {
  return [
    ...getFruitPurchaseOptionsForRegion(fruitId, regionName),
    ...getVerifiedOriginPurchasePlaces(fruitId, regionName),
  ];
}
