interface BarChartProps {
  data: { label: string; value: number; value2?: number }[];
  height?: number;
  color?: string;
  color2?: string;
  label?: string;
  label2?: string;
}

const BarChart = ({
  data,
  height = 200,
  color = '#2563eb',
  color2 = '#0d9488',
  label = 'Borrows',
  label2,
}: BarChartProps) => {
  const maxVal = Math.max(...data.flatMap(d => [d.value, d.value2 ?? 0]), 1);
  const W = 500;
  const H = height;
  const PAD = { top: 16, right: 16, bottom: 36, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const barW = Math.max(4, (chartW / data.length) * (label2 ? 0.38 : 0.55));
  const gap = label2 ? barW * 0.2 : 0;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(t * maxVal));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }} preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {yTicks.map((tick, i) => {
        const y = PAD.top + chartH - (tick / maxVal) * chartH;
        return (
          <g key={i}>
            <line
              x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y}
              stroke="var(--border)" strokeWidth="1" strokeDasharray={tick === 0 ? 'none' : '4,4'}
            />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">
              {tick}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const slotW = chartW / data.length;
        const centerX = PAD.left + i * slotW + slotW / 2;
        const offset = label2 ? (barW + gap) / 2 : 0;

        const barH1 = Math.max(2, (d.value / maxVal) * chartH);
        const x1 = centerX - offset - barW;
        const y1 = PAD.top + chartH - barH1;

        const barH2 = d.value2 !== undefined ? Math.max(2, (d.value2 / maxVal) * chartH) : 0;
        const x2 = centerX + gap / 2;
        const y2 = PAD.top + chartH - barH2;

        return (
          <g key={i}>
            {/* Bar 1 */}
            <rect
              x={label2 ? x1 : centerX - barW / 2}
              y={y1} width={barW} height={barH1}
              fill={color} rx="3"
              opacity="0.9"
            >
              <title>{label}: {d.value}</title>
            </rect>
            {/* Bar 2 */}
            {label2 && d.value2 !== undefined && (
              <rect x={x2} y={y2} width={barW} height={barH2} fill={color2} rx="3" opacity="0.9">
                <title>{label2}: {d.value2}</title>
              </rect>
            )}
            {/* X label */}
            <text
              x={centerX} y={PAD.top + chartH + 18}
              textAnchor="middle" fontSize="11" fill="var(--text-muted)"
            >
              {d.label}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      {label2 && (
        <g>
          <rect x={PAD.left} y={H - 10} width={10} height={10} fill={color} rx="2" />
          <text x={PAD.left + 14} y={H - 2} fontSize="11" fill="var(--text-secondary)">{label}</text>
          <rect x={PAD.left + 70} y={H - 10} width={10} height={10} fill={color2} rx="2" />
          <text x={PAD.left + 84} y={H - 2} fontSize="11" fill="var(--text-secondary)">{label2}</text>
        </g>
      )}
    </svg>
  );
};

export default BarChart;
