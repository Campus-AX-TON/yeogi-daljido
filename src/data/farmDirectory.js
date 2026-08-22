import { getFruitPurchaseOptionsForRegion } from "./fruitSellers.js";
import {
  STAR_FARM_SOURCE,
  getStarFarmsForRegion,
} from "./starFarms.js";

const FRUIT_PRODUCT_NAMES = {
  apple: "사과",
  grape: "포도",
  pear: "배",
};

const NON_SALES_FARM_NAME_PATTERN = /(교육농장|체험)/;
const PROCESSED_PRODUCT_PATTERN = /(즙|주스|와인|차|잼|파이|장아찌)/;

function hasFreshFruitRecord(farm, fruitId) {
  const fruitName = FRUIT_PRODUCT_NAMES[fruitId];
  return fruitName
    ? farm.products
        .split(",")
        .some(
          (product) =>
            product.trim().includes(fruitName) && !PROCESSED_PRODUCT_PATTERN.test(product),
        )
    : false;
}

function publicFarmContact(farm) {
  return {
    address: farm.address,
    contactStatus: "inquiry-required",
    description: `${farm.products} 생산 정보가 등록된 ${farm.region} 농가예요. 전화 주문과 출고 가능 여부는 문의가 필요해요.`,
    entityLabel: "생산 농가",
    name: farm.name,
    phone: farm.phone,
    products: farm.products,
    sourceLabel: STAR_FARM_SOURCE.label,
    sourceUrl: farm.contactSourceUrl,
    verifiedAt: STAR_FARM_SOURCE.snapshotDate,
  };
}

export function getFarmDirectoryForRegion(fruitId, regionName) {
  const linkedSellers = getFruitPurchaseOptionsForRegion(fruitId, regionName);
  const linkedPhones = new Set(linkedSellers.map((option) => option.producer.phone).filter(Boolean));
  const linkedNames = new Set(linkedSellers.map((option) => option.producer.name).filter(Boolean));

  return getStarFarmsForRegion(fruitId, regionName)
    .filter(
      (farm) =>
        farm.phone &&
        farm.contactSourceUrl &&
        hasFreshFruitRecord(farm, fruitId) &&
        !NON_SALES_FARM_NAME_PATTERN.test(farm.name) &&
        !linkedPhones.has(farm.phone) &&
        !linkedNames.has(farm.name),
    )
    .map(publicFarmContact);
}
