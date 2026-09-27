import { useId } from "react";
import { clamp } from "@/lib/utils";

const PX_PER_DEG = 1.6;
const ROLL_TICKS = [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60];
const PITCH_LINES = [-30, -20, -10, 10, 20, 30];

/** Artificial horizon: sky/ground rotate with roll and shift with pitch. */
export function AttitudeIndicator({
  rollDeg,
  pitchDeg,
  size = 124,
}: {
  rollDeg: number | null | undefined;
  pitchDeg: number | null | undefined;
  size?: number;
}) {
  const clipId = useId();
  const roll = rollDeg ?? 0;
  const pitch = clamp(pitchDeg ?? 0, -35, 35);
  const valid = rollDeg != null && pitchDeg != null;

  return (
    <svg
      viewBox="-60 -60 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={`Sikap wahana: roll ${roll.toFixed(0)} derajat, pitch ${pitch.toFixed(0)} derajat`}
      className={valid ? undefined : "opacity-40"}
    >
      <defs>
        <clipPath id={clipId}>
          <circle r="56" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <g transform={`rotate(${-roll}) translate(0 ${pitch * PX_PER_DEG})`}>
          <rect x="-160" y="-320" width="320" height="320" fill="#133456" />
          <rect x="-160" y="0" width="320" height="320" fill="#3b2b17" />
          <line
            x1="-160"
            x2="160"
            y1="0"
            y2="0"
            stroke="#e6edf3"
            strokeWidth="1.2"
          />
          {PITCH_LINES.map((p) => {
            const y = -p * PX_PER_DEG;
            const half = Math.abs(p) % 20 === 0 ? 14 : 8;
            return (
              <g key={p}>
                <line
                  x1={-half}
                  x2={half}
                  y1={y}
                  y2={y}
                  stroke="#e6edf3"
                  strokeWidth="0.8"
                  opacity="0.85"
                />
                {Math.abs(p) % 20 === 0 && (
                  <text
                    x={half + 3}
                    y={y}
                    dy="0.35em"
                    fontSize="6"
                    fill="#e6edf3"
                    fontFamily="monospace"
                  >
                    {Math.abs(p)}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </g>

      {ROLL_TICKS.map((a) => {
        const long = a % 30 === 0;
        return (
          <line
            key={a}
            x1="0"
            x2="0"
            y1={-56}
            y2={long ? -49 : -52}
            stroke="#e6edf3"
            strokeWidth={a === 0 ? 1.6 : 0.9}
            transform={`rotate(${a})`}
          />
        );
      })}
      <g transform={`rotate(${-roll})`}>
        <polygon points="0,-48 -4,-41 4,-41" fill="#39d0d8" />
      </g>

      <path
        d="M-34 0 H-12 L-6 6 M34 0 H12 L6 6"
        stroke="#39d0d8"
        strokeWidth="3"
        fill="none"
        strokeLinejoin="round"
      />
      <circle r="2.2" fill="#39d0d8" />
      <circle r="56" fill="none" stroke="#30363d" strokeWidth="2" />
    </svg>
  );
}
