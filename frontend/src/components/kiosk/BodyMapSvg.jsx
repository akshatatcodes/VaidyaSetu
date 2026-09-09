import React, { useState } from 'react';

const REGIONS = [
  { id: 'head', label: 'Head / Neck', path: 'M110,20 c-25,0 -40,20 -40,45 c0,18 10,32 25,38 l0,12 30,0 0,-12 c15,-6 25,-20 25,-38 c0,-25 -15,-45 -40,-45 z' },
  { id: 'chest', label: 'Chest', path: 'M70,115 l80,0 10,55 -100,0 z' },
  { id: 'abdomen', label: 'Abdomen', path: 'M75,175 l70,0 8,50 -86,0 z' },
  { id: 'left_arm', label: 'Left arm', path: 'M55,120 l-35,70 18,8 32,-65 z' },
  { id: 'right_arm', label: 'Right arm', path: 'M165,120 l35,70 -18,8 -32,-65 z' },
  { id: 'left_leg', label: 'Left leg', path: 'M85,230 l-5,90 25,0 10,-90 z' },
  { id: 'right_leg', label: 'Right leg', path: 'M135,230 l5,90 -25,0 -10,-90 z' },
  { id: 'back', label: 'Back', path: 'M95,115 l30,0 0,100 -30,0 z' }
];

/** Touch-friendly body map — sets site / chief-complaint localization */
export default function BodyMapSvg({ selected, onSelect, title = 'Tap where it hurts' }) {
  const [hover, setHover] = useState(null);
  return (
    <div className="flex flex-col items-center gap-3 my-4">
      <p className="text-sm text-slate-300 font-medium">{title}</p>
      <svg viewBox="0 0 220 340" className="w-48 sm:w-56 touch-manipulation">
        {REGIONS.map((r) => {
          const active = selected === r.label || selected === r.id;
          return (
            <path
              key={r.id}
              d={r.path}
              fill={active ? '#14b8a6' : hover === r.id ? '#334155' : '#1e293b'}
              stroke="#94a3b8"
              strokeWidth="2"
              className="cursor-pointer"
              onMouseEnter={() => setHover(r.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect(r.label)}
            />
          );
        })}
      </svg>
      {selected && (
        <p className="text-teal-300 text-sm font-semibold">Selected: {selected}</p>
      )}
    </div>
  );
}
