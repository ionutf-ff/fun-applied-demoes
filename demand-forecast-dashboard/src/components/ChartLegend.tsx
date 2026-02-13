import { CHART_COLORS } from '@/constants';

interface ChartLegendProps {
  showTemp?: boolean;
  showHumidity?: boolean;
  showWind?: boolean;
}

export function ChartLegend({ showTemp, showHumidity, showWind }: ChartLegendProps) {
  return (
    <div className="flex items-center justify-center gap-6 mt-4">
      <LegendItem color={CHART_COLORS.actual} label="Actual Demand" />
      <LegendItem color={CHART_COLORS.predicted} label="Predicted Demand" dot />
      <LegendItem color={CHART_COLORS.confidenceBand} label="±10% Band" dashed />
      <LegendItem color={CHART_COLORS.outlier} label="Outlier (>10%)" dot />
      <LegendItem color={CHART_COLORS.todayLine} label="Today" dashed />
      {showTemp && <LegendItem color="#F97316" label="Temperature" dashed />}
      {showHumidity && <LegendItem color="#38BDF8" label="Humidity" dashed />}
      {showWind && <LegendItem color="#A78BFA" label="Wind Speed" dashed />}
    </div>
  );
}

function LegendItem({
  color,
  label,
  dashed,
  dot,
}: {
  color: string;
  label: string;
  dashed?: boolean;
  dot?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {dot ? (
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      ) : (
        <div
          className="w-6 h-0.5"
          style={{
            backgroundColor: color,
            borderTop: dashed ? `2px dashed ${color}` : undefined,
            height: dashed ? 0 : 2,
          }}
        />
      )}
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}
