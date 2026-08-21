import FruitIcon from "./FruitIcon.jsx";

const ITEMS = [
  { fruit: "grape", width: 260, style: { top: "-9%", left: "-7%", transform: "rotate(-16deg)", opacity: 0.12 } },
  { fruit: "apple", width: 190, style: { top: "2%", right: "-7%", transform: "rotate(14deg)", opacity: 0.11 } },
  { fruit: "pear", width: 220, style: { bottom: "-11%", left: "9%", transform: "rotate(9deg)", opacity: 0.1 } },
  { fruit: "grape", width: 150, style: { bottom: "-4%", right: "8%", transform: "rotate(-22deg)", opacity: 0.08 } },
  { fruit: "apple", width: 130, style: { top: "48%", left: "-9%", transform: "rotate(18deg)", opacity: 0.07 } },
];

export default function FruitBackdrop({ variant = "home" }) {
  return (
    <div className={`fruit-backdrop fruit-backdrop--${variant}`} aria-hidden="true">
      {ITEMS.map((item, index) => (
        <FruitIcon
          key={`${item.fruit}-${index}`}
          fruit={item.fruit}
          className="fruit-backdrop-icon"
          style={{ ...item.style, width: item.width, height: item.width * 1.2 }}
        />
      ))}
    </div>
  );
}
