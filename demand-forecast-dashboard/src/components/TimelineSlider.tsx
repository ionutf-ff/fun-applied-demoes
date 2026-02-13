import { useCallback, useMemo, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { formatDate } from '@/lib/formatters';

interface TimelineSliderProps {
  startDate: string;
  endDate: string;
  selectedDate: string;
  onChange: (date: string) => void;
  playing: boolean;
  onPlayToggle: () => void;
}

function getAllDates(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (current <= last) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function TimelineSlider({ startDate, endDate, selectedDate, onChange, playing, onPlayToggle }: TimelineSliderProps) {
  const dates = useMemo(() => getAllDates(startDate, endDate), [startDate, endDate]);
  const sliderRef = useRef<HTMLInputElement>(null);

  const currentIndex = dates.indexOf(selectedDate);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const idx = parseInt(e.target.value, 10);
      if (dates[idx]) {
        onChange(dates[idx]);
      }
    },
    [dates, onChange]
  );

  const handleStepBack = useCallback(() => {
    if (safeIndex > 0) {
      onChange(dates[safeIndex - 1]);
    }
  }, [safeIndex, dates, onChange]);

  const handleStepForward = useCallback(() => {
    if (safeIndex < dates.length - 1) {
      onChange(dates[safeIndex + 1]);
    }
  }, [safeIndex, dates, onChange]);

  // Compute tick marks - show every ~5 days
  const tickInterval = Math.max(1, Math.floor(dates.length / 7));
  const ticks = dates.filter((_, i) => i % tickInterval === 0 || i === dates.length - 1);

  return (
    <div className="flex items-center gap-4">
      {/* Playback controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleStepBack}
          disabled={safeIndex === 0}
          className="p-1.5 rounded-md hover:bg-dashboard-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <SkipBack className="w-4 h-4 text-dashboard-muted" />
        </button>
        <button
          onClick={onPlayToggle}
          className="p-2 rounded-lg hover:bg-dashboard-surface transition-colors"
          style={{
            backgroundColor: playing ? 'rgba(251, 146, 60, 0.15)' : undefined,
          }}
        >
          {playing ? (
            <Pause className="w-4 h-4" style={{ color: '#FB923C' }} />
          ) : (
            <Play className="w-4 h-4 text-dashboard-muted" />
          )}
        </button>
        <button
          onClick={handleStepForward}
          disabled={safeIndex === dates.length - 1}
          className="p-1.5 rounded-md hover:bg-dashboard-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <SkipForward className="w-4 h-4 text-dashboard-muted" />
        </button>
      </div>

      {/* Date label */}
      <div className="min-w-[90px] text-center">
        <span className="text-sm font-medium" style={{ color: '#FB923C' }}>{formatDate(selectedDate)}</span>
      </div>

      {/* Slider track */}
      <div className="flex-1 flex flex-col">
        <input
          ref={sliderRef}
          type="range"
          min={0}
          max={dates.length - 1}
          value={safeIndex}
          onChange={handleSliderChange}
          className="comparison-slider w-full"
        />
        {/* Tick labels */}
        <div className="flex justify-between" style={{ marginTop: '0.25rem', padding: '0 2px' }}>
          {ticks.map((date) => (
            <span key={date} className="text-[10px] text-dashboard-muted">
              {formatDate(date)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
