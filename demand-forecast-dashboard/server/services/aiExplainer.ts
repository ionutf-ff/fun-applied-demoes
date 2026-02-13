interface ExplainParams {
  date: string;
  actual: number;
  predicted: number;
  state: string;
  temperature: number | null;
  isComparisonPoint?: boolean;
  comparisonPredicted?: number | null;
  daysDifference?: number | null;
}

export function generateMockExplanation(params: ExplainParams): string[] {
  const { date, actual, predicted, state, temperature, isComparisonPoint, comparisonPredicted, daysDifference } = params;

  const stateNames: Record<string, string> = {
    TX: 'Texas',
    CA: 'California',
    NY: 'New York',
    FL: 'Florida',
    IL: 'Illinois',
  };

  const stateName = stateNames[state] || state;

  // Comparison point explanation
  if (isComparisonPoint && comparisonPredicted !== null && comparisonPredicted !== undefined) {
    return generateComparisonExplanation(date, predicted, comparisonPredicted, stateName, daysDifference ?? 0, temperature);
  }

  // Standard explanation
  const deviation = ((actual - predicted) / predicted) * 100;
  const absDeviation = Math.abs(deviation);
  const isHigher = deviation > 0;
  const dayOfWeek = new Date(date).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const chunks: string[] = [];

  if (isHigher && temperature !== null && temperature < 32) {
    chunks.push(
      `On ${date}, electricity demand in ${stateName} exceeded the forecast by ${absDeviation.toFixed(1)}%. `,
      `The primary driver was an unexpected cold front that dropped temperatures to ${temperature}°F, `,
      `significantly below the forecasted range. `,
      `This led to a sharp increase in heating load across residential and commercial sectors. `,
      `The forecast model did not account for this sudden temperature drop, `,
      `resulting in an underestimation of ${(actual - predicted).toLocaleString()} MWh. `,
      `Similar cold-snap events in ${stateName} have historically caused demand spikes of 15-25% above baseline.`
    );
  } else if (isHigher && isWeekend) {
    chunks.push(
      `Demand on ${date} was ${absDeviation.toFixed(1)}% higher than predicted. `,
      `This is notable as it occurred on a weekend, when demand is typically lower. `,
      `The deviation suggests an unusual event — possibly a major sporting event, `,
      `a holiday weekend with increased residential usage, `,
      `or an industrial facility running extended operations. `,
      `Weekend forecast models in ${stateName} may need recalibration to better capture these periodic anomalies.`
    );
  } else if (isHigher) {
    chunks.push(
      `Actual demand on ${date} exceeded the forecast by ${absDeviation.toFixed(1)}% in ${stateName}. `,
      `This could be attributed to a combination of factors: `,
      temperature !== null
        ? `The recorded temperature of ${temperature}°F was ${temperature < 45 ? 'colder' : 'warmer'} than expected, `
        : `Temperature conditions differed from predictions, `,
      `leading to ${temperature !== null && temperature < 45 ? 'increased heating' : 'increased cooling'} demand. `,
      `Additionally, economic activity indicators suggest higher-than-normal industrial consumption during this period.`
    );
  } else if (!isHigher && temperature !== null && temperature > 60) {
    chunks.push(
      `Demand on ${date} was ${absDeviation.toFixed(1)}% lower than the forecast. `,
      `Milder-than-expected temperatures of ${temperature}°F reduced heating requirements across ${stateName}. `,
      `The forecast model had predicted cooler conditions, leading to an overestimation of heating load. `,
      `This pattern is consistent with the seasonal transition period where temperature forecast errors `,
      `have an amplified effect on demand predictions.`
    );
  } else {
    chunks.push(
      `On ${date}, demand in ${stateName} was ${absDeviation.toFixed(1)}% ${isHigher ? 'above' : 'below'} forecast. `,
      `The deviation of ${Math.abs(actual - predicted).toLocaleString()} MWh falls outside the model's 10% confidence band. `,
      temperature !== null
        ? `With a recorded temperature of ${temperature}°F, `
        : `Given the weather conditions, `,
      `the primary factors likely include changes in industrial load patterns, `,
      `distributed energy resource generation variability, `,
      `and potential shifts in consumer behavior. `,
      `Ongoing model tuning should improve accuracy for similar conditions.`
    );
  }

  return chunks;
}

function generateComparisonExplanation(
  date: string,
  primaryPredicted: number,
  comparisonPredicted: number,
  stateName: string,
  daysDifference: number,
  temperature: number | null
): string[] {
  const diff = comparisonPredicted - primaryPredicted;
  const percentDiff = ((diff) / primaryPredicted) * 100;
  const absDiff = Math.abs(percentDiff);
  const isHigher = diff > 0;
  const chunks: string[] = [];

  chunks.push(
    `Comparing two forecasts for ${date} in ${stateName}, separated by ${daysDifference} day${daysDifference !== 1 ? 's' : ''}: `
  );

  if (absDiff > 10) {
    chunks.push(
      `The comparison forecast diverges significantly from the primary forecast by ${absDiff.toFixed(1)}% `,
      `(${isHigher ? 'higher' : 'lower'} by ${Math.abs(diff).toLocaleString()} MWh). `,
      `This large discrepancy over ${daysDifference} days suggests a fundamental shift in the model's input data — `,
      `likely driven by updated weather forecasts, revised demand baselines, or changes in generation capacity assumptions. `
    );
  } else if (absDiff > 5) {
    chunks.push(
      `The comparison forecast is ${absDiff.toFixed(1)}% ${isHigher ? 'higher' : 'lower'} than the primary forecast `,
      `(a difference of ${Math.abs(diff).toLocaleString()} MWh). `,
      `With ${daysDifference} days between forecast runs, this moderate divergence is typically caused by `,
      `evolving weather predictions, updated industrial load schedules, or revised renewable generation estimates. `
    );
  } else {
    chunks.push(
      `The two forecasts differ by ${absDiff.toFixed(1)}% `,
      `(${Math.abs(diff).toLocaleString()} MWh ${isHigher ? 'higher' : 'lower'} in the comparison). `,
      `This is within normal forecast variation for a ${daysDifference}-day gap between model runs. `
    );
  }

  if (temperature !== null) {
    chunks.push(
      `The recorded temperature of ${temperature}°F on this date `,
      temperature < 35
        ? `indicates cold weather conditions that amplify forecast sensitivity to heating load estimates. `
        : temperature > 85
        ? `indicates hot weather conditions where cooling demand creates additional forecast uncertainty. `
        : `is within moderate ranges, suggesting temperature was not the primary driver of divergence. `
    );
  }

  chunks.push(
    `As forecast lead time increases, prediction uncertainty grows — the ${daysDifference}-day gap means the earlier forecast `,
    `had less accurate input data, which naturally leads to this level of divergence.`
  );

  return chunks;
}
