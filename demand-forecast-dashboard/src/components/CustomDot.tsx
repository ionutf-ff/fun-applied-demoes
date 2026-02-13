import { CHART_COLORS } from '@/constants';

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: {
    actual: number | null;
    isOutlier: boolean;
    isFuture: boolean;
  };
  onClick?: (payload: any) => void;
}

export function CustomDot({ cx, cy, payload, onClick }: CustomDotProps) {
  if (!cx || !cy || !payload || payload.actual === null || payload.isFuture) {
    return null;
  }

  const fill = payload.isOutlier ? CHART_COLORS.outlier : CHART_COLORS.actual;

  return (
    <g
      onClick={() => onClick?.(payload)}
      style={{ cursor: 'pointer' }}
    >
      {/* Larger invisible hit area */}
      <circle cx={cx} cy={cy} r={12} fill="transparent" />
      {/* Outer glow for outliers */}
      {payload.isOutlier && (
        <circle cx={cx} cy={cy} r={8} fill={CHART_COLORS.outlier} opacity={0.2} />
      )}
      {/* Visible dot */}
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={fill}
        stroke="#0F1117"
        strokeWidth={2}
      />
    </g>
  );
}
