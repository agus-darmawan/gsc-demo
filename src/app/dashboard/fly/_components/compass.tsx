const CARDINAL: Record<number, string> = {
  0: "U",
  90: "T",
  180: "S",
  270: "B",
};
const TICKS = Array.from({ length: 36 }, (_, i) => i * 10);

/**
 * Heading card (rotates with the vehicle) with cardinal points in Indonesian
 * (U/T/S/B) and a bearing-to-home pointer.
 */
export function Compass({
  headingDeg,
  homeBearingDeg,
  size = 124,
}: {
  headingDeg: number | null | undefined;
  homeBearingDeg: number | null;
  size?: number;
}) {
  const heading = headingDeg ?? 0;
  const valid = headingDeg != null;

  return (
    <svg
      viewBox="-60 -60 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={`Arah hadap ${Math.round(heading)} derajat`}
      className={valid ? undefined : "opacity-40"}
    >
      <circle r="56" fill="#0d1117" stroke="#30363d" strokeWidth="2" />
      <g transform={`rotate(${-heading})`}>
        {TICKS.map((deg) => {
          const major = deg % 30 === 0;
          const label = CARDINAL[deg] ?? (major ? String(deg) : null);
          return (
            <g key={deg} transform={`rotate(${deg})`}>
              <line
                x1="0"
                x2="0"
                y1="-55"
                y2={major ? -48 : -51}
                stroke="#8b949e"
                strokeWidth={major ? 1.2 : 0.7}
              />
              {label && (
                <text
                  y="-40"
                  textAnchor="middle"
                  dy="0.35em"
                  fontFamily="monospace"
                  fontSize={CARDINAL[deg] ? 9 : 6}
                  fontWeight={CARDINAL[deg] ? 700 : 400}
                  fill={deg === 0 ? "#f85149" : "#c9d1d9"}
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </g>

      {homeBearingDeg != null && (
        <g transform={`rotate(${homeBearingDeg - heading})`}>
          <line
            x1="0"
            x2="0"
            y1="-30"
            y2="-18"
            stroke="#3fb950"
            strokeWidth="1.5"
          />
          <text
            y="-24"
            x="5"
            fontSize="7"
            fontFamily="monospace"
            fontWeight="700"
            fill="#3fb950"
          >
            H
          </text>
        </g>
      )}

      <polygon points="0,-58 -4,-51 4,-51" fill="#39d0d8" />
      <path d="M0 -12 L7 9 L0 5 L-7 9 Z" fill="#39d0d8" />
      <text
        y="24"
        textAnchor="middle"
        fontFamily="monospace"
        fontSize="10"
        fontWeight="700"
        fill="#e6edf3"
      >
        {valid ? `${Math.round(heading).toString().padStart(3, "0")}°` : "---"}
      </text>
    </svg>
  );
}
