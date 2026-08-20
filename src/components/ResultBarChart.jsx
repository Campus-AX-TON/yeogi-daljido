export default function ResultBarChart({ color, title, unit, values }) {
  const availableValues = values.filter((item) => item.value !== null && item.value !== undefined);
  const max = Math.max(...availableValues.map((item) => item.value), 1);

  return (
    <article className="report-chart-card">
      <h3>{title}</h3>
      <div className="report-chart-rows">
        {availableValues.map((item) => (
          <div className="report-chart-row" key={item.region}>
            <span>{item.region}</span>
            <div className="report-chart-track">
              <span
                style={{
                  "--bar-color": color,
                  "--bar-width": `${Math.max(4, (item.value / max) * 100)}%`,
                }}
              />
            </div>
            <strong>
              {item.value}
              {unit}
            </strong>
          </div>
        ))}
      </div>
    </article>
  );
}
