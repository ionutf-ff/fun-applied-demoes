interface ErrorMetricsProps {
  rmse: number;
  mae: number;
  maxError: number;
  overallErrorRate: number;
}

export function ErrorMetrics({ rmse, mae, maxError, overallErrorRate }: ErrorMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <MetricBadge label="Error Rate" value={`${overallErrorRate}%`} color="text-amber-400 bg-amber-400/10 border-amber-400/20" />
      <MetricBadge label="RMSE" value={`${rmse.toLocaleString()} MWh`} color="text-blue-400 bg-blue-400/10 border-blue-400/20" />
      <MetricBadge label="MAE" value={`${mae.toLocaleString()} MWh`} color="text-emerald-400 bg-emerald-400/10 border-emerald-400/20" />
      <MetricBadge label="Max Error" value={`${maxError.toLocaleString()} MWh`} color="text-red-400 bg-red-400/10 border-red-400/20" />
    </div>
  );
}

function MetricBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium ${color}`}>
      <span className="opacity-70">{label}:</span>
      <span>{value}</span>
    </div>
  );
}
