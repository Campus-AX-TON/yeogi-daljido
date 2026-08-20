const MAP_BOUNDS = {
  east: 130.9,
  north: 38.7,
  south: 33,
  west: 125.4,
};

function markerPosition(region) {
  const left = ((region.longitude - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * 100;
  const top =
    (1 - (region.latitude - MAP_BOUNDS.south) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * 100;

  return {
    "--marker-left": `${Math.min(95, Math.max(5, left))}%`,
    "--marker-top": `${Math.min(93, Math.max(7, top))}%`,
  };
}

export default function ResultRegionMap({ recommendations }) {
  return (
    <div className="report-map-card">
      <iframe
        loading="lazy"
        src="https://www.openstreetmap.org/export/embed.html?bbox=125.4%2C33%2C130.9%2C38.7&layer=mapnik"
        title="추천 산지 지도"
      />
      <div className="report-map-markers" aria-label="추천 산지 순위">
        {recommendations.map((recommendation) => (
          <span
            aria-label={`${recommendation.rank}위 ${recommendation.region.province} ${recommendation.region.name}`}
            className="report-map-marker"
            data-rank={recommendation.rank}
            key={recommendation.region.id}
            style={markerPosition(recommendation.region)}
          >
            #{recommendation.rank}
          </span>
        ))}
      </div>
    </div>
  );
}
