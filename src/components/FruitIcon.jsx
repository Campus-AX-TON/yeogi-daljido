const PATHS = {
  grape: (
    <>
      <ellipse cx="50" cy="98" rx="28" ry="7" fill="url(#groundShadow)" />
      <path d="M50 6 C47 6 45 9 45 13 C45 16 47 19 50 20" stroke="url(#stemGrad)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M61 12 C58 6 50 5 45 9 C51 8 57 9 61 12 Z" fill="url(#leafGrad)" />
      <circle cx="50" cy="35" r="13" fill="url(#grapeBody)" />
      <circle cx="35" cy="49" r="13" fill="url(#grapeBody)" />
      <circle cx="65" cy="49" r="13" fill="url(#grapeBody)" />
      <circle cx="50" cy="63" r="13" fill="url(#grapeBody)" />
      <circle cx="27" cy="66" r="11" fill="url(#grapeBody)" />
      <circle cx="73" cy="66" r="11" fill="url(#grapeBody)" />
      <circle cx="50" cy="86" r="11" fill="url(#grapeBody)" />
      <ellipse cx="45" cy="30" rx="4" ry="3" fill="#fff" opacity="0.5" />
      <ellipse cx="30" cy="44" rx="3" ry="2.4" fill="#fff" opacity="0.4" />
      <ellipse cx="45" cy="58" rx="3.2" ry="2.6" fill="#fff" opacity="0.4" />
    </>
  ),
  pear: (
    <>
      <ellipse cx="50" cy="108" rx="22" ry="6" fill="url(#groundShadow)" />
      <path d="M50 26 L50 15" stroke="url(#stemGrad)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M60 17 C57 10 48 9 43 14 C50 12 56 13 60 17 Z" fill="url(#leafGrad)" />
      <path d="M50 28 C40 28 33 38 33 50 C33 57 36 62 35 70 C34 90 41 106 50 106 C59 106 66 90 65 70 C64 62 67 57 67 50 C67 38 60 28 50 28 Z" fill="url(#pearBody)" />
      <ellipse cx="62" cy="72" rx="10" ry="18" fill="#d98a4a" opacity="0.2" />
      <ellipse cx="41" cy="46" rx="6" ry="10" fill="#fff" opacity="0.35" />
      <ellipse cx="46" cy="40" rx="2.4" ry="4" fill="#fff" opacity="0.5" />
    </>
  ),
  apple: (
    <>
      <ellipse cx="50" cy="106" rx="24" ry="6" fill="url(#groundShadow)" />
      <path d="M50 34 C48 26 43 20 36 20" stroke="url(#stemGrad)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M60 24 C57 17 48 16 43 21 C50 19 56 20 60 24 Z" fill="url(#leafGrad)" />
      <path d="M50 42 C46 33 37 29 29 33 C17 39 14 52 14 62 C14 86 32 104 50 104 C68 104 86 86 86 62 C86 52 83 39 71 33 C63 29 54 33 50 42 Z" fill="url(#appleBody)" />
      <path d="M30 40 C22 52 22 74 34 92 C24 76 23 54 30 40 Z" fill="#d7dd7e" opacity="0.3" />
      <ellipse cx="38" cy="50" rx="7" ry="12" fill="#fff" opacity="0.4" />
      <ellipse cx="44" cy="42" rx="2.6" ry="4.4" fill="#fff" opacity="0.55" />
    </>
  ),
};

export default function FruitIcon({ fruit, className, style }) {
  return (
    <svg viewBox="0 0 100 120" className={className} style={style} aria-hidden="true">
      {PATHS[fruit]}
    </svg>
  );
}

export function FruitIconDefs() {
  return (
    <svg width="0" height="0" className="icon-defs" aria-hidden="true">
      <defs>
        <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(36,29,51,0.3)" />
          <stop offset="100%" stopColor="rgba(36,29,51,0)" />
        </radialGradient>
        <linearGradient id="stemGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9c7a4a" />
          <stop offset="1" stopColor="#4a3420" />
        </linearGradient>
        <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--pear)" />
          <stop offset="1" stopColor="#4c5a1c" />
        </linearGradient>
        <radialGradient id="grapeBody" cx="32%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#d9bdef" />
          <stop offset="45%" stopColor="var(--grape)" />
          <stop offset="100%" stopColor="#442a5e" />
        </radialGradient>
        <radialGradient id="pearBody" cx="32%" cy="26%" r="85%">
          <stop offset="0%" stopColor="#f1f3c0" />
          <stop offset="45%" stopColor="var(--pear)" />
          <stop offset="100%" stopColor="#4c5a1c" />
        </radialGradient>
        <radialGradient id="appleBody" cx="30%" cy="24%" r="85%">
          <stop offset="0%" stopColor="#ffa389" />
          <stop offset="42%" stopColor="var(--apple)" />
          <stop offset="100%" stopColor="#711f14" />
        </radialGradient>
      </defs>
    </svg>
  );
}
