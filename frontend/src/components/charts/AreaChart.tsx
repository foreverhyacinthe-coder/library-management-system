interface AreaChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

const AreaChart = ({ data, height = 200, color = '#2563eb' }: AreaChartProps) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const W = 500;
  const H = height;
  const PAD = { top: 16, right: 16, bottom: 36, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const pts = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * chartW,
    y: PAD.top + chartH - (d.value / maxVal) * chartH,
    value: d.value,
    label: d.label,
  }));

  // Smooth cubic bezier path
  const path = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = pts[i - 1];
    const cpx = (prev.x + pt.x) / 2;
    return `${acc} C ${cpx},${prev.y} ${cpx},${pt.y} ${pt.x},${pt.y}`;
  }, '');

  const areaPath = `${path} L ${pts[pts.length - 1].x},${PAD.top + chartH} L ${pts[0].x},${PAD.top + chartH} Z`;

  const yTicks = [0, 0.5, 1].map(t => Math.round(t * maxVal));
  const gradId = `area-grad-${color.replace('#', '')}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {yTicks.map((tick, i) => {
        const y = PAD.top + chartH - (tick / maxVal) * chartH;
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y}
              stroke="var(--border)" strokeWidth="1" strokeDasharray={tick === 0 ? 'none' : '4,4'} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">{tick}</text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* Line */}
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots + labels */}
      {pts.map((pt, i) => (
        <g key={i}>
          <circle cx={pt.x} cy={pt.y} r="4" fill="white" stroke={color} strokeWidth="2.5" />
          <text x={pt.x} y={PAD.top + chartH + 18} textAnchor="middle" fontSize="11" fill="var(--text-muted)">
            {pt.label}
          </text>
        </g>
      ))}
    </svg>
  );
};

export default AreaChart;
