type Props = { theme: string };

const wrap = { width: '100%', height: '100%', display: 'block' } as const;

export function LevelArt({ theme }: Props) {
  switch (theme) {
    case 'bathroom':
      return (
        <svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" style={wrap} aria-hidden="true">
          <defs>
            <linearGradient id="bw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bfe3de" /><stop offset="1" stopColor="#6fa69d" /></linearGradient>
            <pattern id="tile" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 0H14V14" fill="none" stroke="#ffffff55" strokeWidth="1" /></pattern>
          </defs>
          <rect width="200" height="260" fill="url(#bw)" /><rect width="200" height="260" fill="url(#tile)" />
          <rect x="22" y="40" width="64" height="70" rx="4" fill="#e9f3f1" stroke="#fff" strokeWidth="3" /><rect x="28" y="46" width="52" height="58" fill="#9ecbd2" />
          <ellipse cx="140" cy="168" rx="34" ry="14" fill="#f6f4ee" /><rect x="116" y="130" width="48" height="36" rx="8" fill="#f6f4ee" /><rect x="120" y="116" width="40" height="18" rx="5" fill="#ece8de" />
          <rect x="30" y="170" width="70" height="40" rx="10" fill="#f1f1ec" stroke="#fff" strokeWidth="2" />
        </svg>
      );
    case 'store':
      return (
        <svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" style={wrap} aria-hidden="true">
          <rect width="200" height="260" fill="#6b655a" />
          {[40, 100, 160].map((y) => <g key={y}><rect x="14" y={y} width="172" height="6" fill="#8a7d63" />{[0, 1, 2].map((i) => <rect key={i} x={24 + i * 54} y={y - 34} width="40" height="34" fill={['#b98d52', '#a67b45', '#c69a5c'][i]} stroke="#7a5a2e" strokeWidth="2" />)}</g>)}
          <rect x="150" y="196" width="22" height="50" rx="3" fill="#c9503f" /><rect x="40" y="200" width="30" height="40" rx="4" fill="#5a85a8" /><rect x="76" y="218" width="4" height="40" fill="#8a6a3a" />
        </svg>
      );
    case 'kitchen':
      return (
        <svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" style={wrap} aria-hidden="true">
          <rect width="200" height="260" fill="#d9b98a" />
          {Array.from({ length: 7 }).map((_, i) => <rect key={i} x={i * 30} y="0" width="15" height="150" fill="#00000010" />)}
          <rect y="150" width="200" height="110" fill="#8b6a46" /><rect x="10" y="108" width="180" height="46" fill="#e8dcc3" /><rect x="10" y="102" width="180" height="8" fill="#6f5a40" />
          <circle cx="60" cy="90" r="14" fill="#cfd5d6" /><rect x="52" y="52" width="16" height="36" fill="#b9c2c4" /><rect x="116" y="60" width="50" height="46" rx="4" fill="#e4a76d" />
          <rect x="30" y="20" width="80" height="22" fill="#c9a572" /><rect x="120" y="20" width="60" height="22" fill="#c9a572" />
        </svg>
      );
    case 'bedroom':
      return (
        <svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" style={wrap} aria-hidden="true">
          <rect width="200" height="260" fill="#2c2538" />
          <circle cx="150" cy="56" r="22" fill="#cfd8ff" opacity=".9" /><circle cx="160" cy="50" r="19" fill="#2c2538" />
          <rect x="20" y="130" width="160" height="70" rx="6" fill="#9a7ba3" /><rect x="20" y="118" width="160" height="22" rx="6" fill="#b39ac0" /><rect x="30" y="110" width="44" height="18" rx="8" fill="#efe4ef" />
          <rect x="14" y="200" width="172" height="60" fill="#3b2f4a" /><rect x="156" y="80" width="26" height="46" fill="#4a3d5c" />
          {[40, 90, 140].map((x) => <circle key={x} cx={x} cy="30" r="1.8" fill="#fff" />)}
        </svg>
      );
    case 'living':
      return (
        <svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" style={wrap} aria-hidden="true">
          <rect width="200" height="260" fill="#cdb48a" />
          <rect x="108" y="64" width="72" height="46" fill="#1c1f26" stroke="#4a403a" strokeWidth="4" /><rect x="100" y="112" width="88" height="16" fill="#5a4636" />
          <rect x="16" y="140" width="120" height="48" rx="10" fill="#6d8a79" /><rect x="16" y="120" width="120" height="30" rx="10" fill="#5a7868" />
          <rect y="206" width="200" height="54" fill="#8a6b46" /><ellipse cx="80" cy="222" rx="42" ry="9" fill="#a6805a" />
          <circle cx="40" cy="60" r="16" fill="#8fb28a" /><rect x="38" y="76" width="4" height="26" fill="#6a8a62" />
        </svg>
      );
    case 'boss':
      return (
        <svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" style={wrap} aria-hidden="true">
          <rect width="200" height="260" fill="#3a1d1b" />
          <circle cx="100" cy="110" r="70" fill="#a3303d" opacity=".35" />
          <ellipse cx="62" cy="168" rx="28" ry="12" fill="#4a93c7" /><ellipse cx="62" cy="164" rx="22" ry="8" fill="#6bb2e0" />
          <rect x="128" y="120" width="26" height="62" rx="8" fill="#d8403f" /><rect x="134" y="104" width="14" height="18" rx="3" fill="#eee" />
          <path d="M20 232 L180 232" stroke="#a3303d" strokeWidth="3" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" style={wrap} aria-hidden="true">
          <rect width="200" height="260" fill="#3a2d16" />
          <circle cx="100" cy="100" r="80" fill="#e0b04f" opacity=".3" />
          <rect x="22" y="150" width="156" height="14" fill="#f4efe3" /><rect x="30" y="164" width="140" height="70" fill="#c25a45" opacity=".8" />
          {[50, 90, 130].map((x) => <g key={x}><ellipse cx={x} cy="140" rx="16" ry="5" fill="#f4d77a" /><circle cx={x} cy="130" r="10" fill="#e8786a" /></g>)}
        </svg>
      );
  }
}
