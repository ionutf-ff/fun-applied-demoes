import { format, parseISO } from 'date-fns';

export function formatMWh(value: number): string {
  return `${value.toLocaleString()} MWh`;
}

export function formatMWhShort(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d');
}

export function formatDateFull(dateStr: string): string {
  return format(parseISO(dateStr), 'MMMM d, yyyy');
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function formatTemperature(temp: number): string {
  return `${temp}°F`;
}
