import { useState } from "react";

const MAP_SPAN = {
  latitude: 0.58,
  longitude: 0.82,
};

function openStreetMapEmbedUrl(region) {
  const west = region.longitude - MAP_SPAN.longitude;
  const south = region.latitude - MAP_SPAN.latitude;
  const east = region.longitude + MAP_SPAN.longitude;
  const north = region.latitude + MAP_SPAN.latitude;
  const params = new URLSearchParams({
    bbox: `${west},${south},${east},${north}`,
    layer: "mapnik",
    marker: `${region.latitude},${region.longitude}`,
  });

  return `https://www.openstreetmap.org/export/embed.html?${params}`;
}

function openStreetMapDetailUrl(region) {
  const params = new URLSearchParams({
    lat: String(region.latitude),
    lon: String(region.longitude),
    mlat: String(region.latitude),
    mlon: String(region.longitude),
    zoom: "11",
  });

  return `https://www.openstreetmap.org/?${params}`;
}

export default function ResultRegionMap({ recommendations }) {
  const [selectedRegionId, setSelectedRegionId] = useState(recommendations[0]?.region.id);
  const selectedRecommendation =
    recommendations.find(({ region }) => region.id === selectedRegionId) ?? recommendations[0];

  if (!selectedRecommendation) return null;

  const selectedRegion = selectedRecommendation.region;

  return (
    <div className="report-map">
      <div aria-label="지도에 표시할 추천 산지" className="report-map-tabs" role="group">
        {recommendations.map((recommendation) => (
          <button
            aria-pressed={recommendation.region.id === selectedRegion.id}
            data-rank={recommendation.rank}
            key={recommendation.region.id}
            onClick={() => setSelectedRegionId(recommendation.region.id)}
            type="button"
          >
            <strong>{recommendation.rank}위</strong>
            {recommendation.region.name}
          </button>
        ))}
      </div>

      <div className="report-map-card">
        <iframe
          key={selectedRegion.id}
          loading="lazy"
          src={openStreetMapEmbedUrl(selectedRegion)}
          title={`${selectedRecommendation.rank}위 ${selectedRegion.province} ${selectedRegion.name} 지도`}
        />
        <div className="report-map-caption">
          <p>
            <strong>{selectedRecommendation.rank}위 {selectedRegion.name}</strong>
            {selectedRegion.province} 산지 중심 위치
          </p>
          <a href={openStreetMapDetailUrl(selectedRegion)} rel="noreferrer" target="_blank">
            큰 지도로 보기
          </a>
        </div>
      </div>

      <p className="report-map-notice">
        마커는 해당 시·군의 대표 위치이며, 개별 농가의 주소는 아니에요.
      </p>
    </div>
  );
}
