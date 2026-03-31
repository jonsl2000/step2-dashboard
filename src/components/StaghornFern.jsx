import { useMemo } from 'react';

export default function StaghornFern({ pomodoroCount = 0, className = '' }) {
  const stage = useMemo(() => {
    if (pomodoroCount === 0) return 0;
    if (pomodoroCount <= 2) return 1;
    if (pomodoroCount <= 6) return 2;
    if (pomodoroCount <= 14) return 3;
    if (pomodoroCount <= 25) return 4;
    return 5;
  }, [pomodoroCount]);

  const scale = Math.min(0.4 + (pomodoroCount * 0.015), 1);

  return (
    <div className={className} style={{ position: 'relative', display: 'inline-block', width: '100%', height: '100%' }}>
      <svg viewBox="0 0 200 220" style={{ width: '100%', height: '100%', transition: 'all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)', transform: `scale(${scale})`, transformOrigin: 'bottom center', filter: stage === 0 ? 'grayscale(0.8) opacity(0.4)' : 'none' }}>
        <ellipse cx="100" cy="205" rx="55" ry="12" fill="#8B6B4A" opacity="0.6" />
        <ellipse cx="100" cy="202" rx="45" ry="10" fill="#A07850" opacity="0.8" />
        {stage >= 1 && (
          <g>
            <path d="M100 195 C85 185, 75 170, 80 155 C85 140, 95 135, 100 140 C105 135, 115 140, 120 155 C125 170, 115 185, 100 195Z" fill="#4A6B3A" opacity="0.9" />
          </g>
        )}
        {stage >= 2 && (
          <g>
            <path d="M90 155 C70 145, 50 135, 40 115 C35 105, 38 95, 45 90 C52 85, 60 90, 65 100 C70 110, 72 125, 80 138" fill="none" stroke="#3D7A3A" strokeWidth="3" strokeLinecap="round" />
            <path d="M110 155 C130 145, 150 135, 160 115 C165 105, 162 95, 155 90 C148 85, 140 90, 135 100 C130 110, 128 125, 120 138" fill="none" stroke="#3D7A3A" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}
        {stage >= 3 && (
          <g>
            <path d="M95 148 C75 130, 55 110, 40 85 C30 65, 35 45, 45 40 C55 35, 65 45, 68 60" fill="none" stroke="#3D7A3A" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M105 148 C125 130, 145 110, 160 85 C170 65, 165 45, 155 40 C145 35, 135 45, 132 60" fill="none" stroke="#3D7A3A" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}
        {stage >= 4 && (
          <g>
            <path d="M100 150 C98 130, 96 105, 92 80 C88 55, 84 35, 85 18 C86 8, 95 5, 100 12 C105 5, 114 8, 115 18 C116 35, 112 55, 108 80 C104 105, 102 130, 100 150Z" fill="#4A8A40" opacity="0.85" />
          </g>
        )}
        {stage >= 5 && (
          <g>
            <circle cx="75" cy="105" r="3" fill="#8B6B30" opacity="0.7" />
            <circle cx="70" cy="90" r="3" fill="#8B6B30" opacity="0.7" />
            <circle cx="125" cy="105" r="3" fill="#8B6B30" opacity="0.7" />
            <circle cx="130" cy="90" r="3" fill="#8B6B30" opacity="0.7" />
          </g>
        )}
        {pomodoroCount > 0 && (
          <text x="100" y="218" textAnchor="middle" fontSize="8" fill="#8B6B4A" fontFamily="Georgia, serif" opacity="0.7">
            {pomodoroCount} {pomodoroCount === 1 ? 'session' : 'sessions'}
          </text>
        )}
      </svg>
    </div>
  );
}
