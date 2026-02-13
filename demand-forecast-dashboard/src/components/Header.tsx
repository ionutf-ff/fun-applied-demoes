import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Calendar, Database, Zap } from 'lucide-react';
import { US_STATES, REGION_SOURCES, ENERGY_SOURCES } from '@/constants';
import type { FilterState } from '@/types';

interface HeaderProps {
  filters: FilterState;
  onUpdate: (filters: FilterState) => void;
  loading: boolean;
}

export function Header({ filters, onUpdate, loading }: HeaderProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [stateOpen, setStateOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [energyOpen, setEnergyOpen] = useState(false);
  const stateRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const energyRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (stateRef.current && !stateRef.current.contains(e.target as Node)) setStateOpen(false);
      if (sourceRef.current && !sourceRef.current.contains(e.target as Node)) setSourceOpen(false);
      if (energyRef.current && !energyRef.current.contains(e.target as Node)) setEnergyOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleRegionChange = (value: string) => {
    const sources = REGION_SOURCES[value] || [];
    const newSource = sources[0] || '';
    const newFilters = { ...localFilters, state: value, source: newSource };
    setLocalFilters(newFilters);
    setStateOpen(false);
    onUpdate(newFilters);
  };

  const handleSourceChange = (value: string) => {
    const newFilters = { ...localFilters, source: value };
    setLocalFilters(newFilters);
    setSourceOpen(false);
    onUpdate(newFilters);
  };

  const handleEnergyToggle = (source: string) => {
    const current = localFilters.energySources;
    const updated = current.includes(source)
      ? current.filter((s) => s !== source)
      : [...current, source];
    const newFilters = { ...localFilters, energySources: updated };
    setLocalFilters(newFilters);
    onUpdate(newFilters);
  };

  const handleStartDateChange = (value: string) => {
    const newFilters = { ...localFilters, startDate: value };
    setLocalFilters(newFilters);
    onUpdate(newFilters);
  };

  const handleEndDateChange = (value: string) => {
    const newFilters = { ...localFilters, endDate: value };
    setLocalFilters(newFilters);
    onUpdate(newFilters);
  };

  const availableSources = REGION_SOURCES[localFilters.state] || [];

  const energyLabel =
    localFilters.energySources.length === 0
      ? 'All Sources'
      : localFilters.energySources.length === ENERGY_SOURCES.length
        ? 'All Sources'
        : localFilters.energySources.join(', ');

  return (
    <header className="flex items-center justify-center gap-6 px-10 bg-dashboard-card border-b border-dashboard-border min-h-[72px]">

      {/* Region */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-dashboard-muted uppercase tracking-wider font-medium">Region</span>
        <div className="relative" ref={stateRef}>
          <button
            onClick={() => setStateOpen(!stateOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-dashboard-surface border border-dashboard-border rounded-lg text-sm font-medium text-white hover:border-dashboard-accent transition-colors min-w-[160px]"
          >
            <span>{US_STATES.find((s) => s.value === localFilters.state)?.label || localFilters.state}</span>
            <ChevronDown className="w-4 h-4 ml-auto text-dashboard-muted" />
          </button>
          {stateOpen && (
            <div className="absolute top-full left-0 mt-1 w-full bg-dashboard-surface border border-dashboard-border rounded-lg shadow-xl z-50 overflow-hidden">
              {US_STATES.map((s) => (
                <button
                  key={s.value}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-dashboard-border transition-colors ${
                    localFilters.state === s.value ? 'text-dashboard-accent bg-dashboard-border/50' : 'text-gray-300'
                  }`}
                  onClick={() => handleRegionChange(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Source */}
      <div className="flex items-center gap-3">
        <Database className="w-4 h-4 text-dashboard-muted" />
        <span className="text-xs text-dashboard-muted uppercase tracking-wider font-medium">Source</span>
        <div className="relative" ref={sourceRef}>
          <button
            onClick={() => setSourceOpen(!sourceOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-dashboard-surface border border-dashboard-border rounded-lg text-sm font-medium text-white hover:border-dashboard-accent transition-colors min-w-[130px]"
          >
            <span>{localFilters.source}</span>
            <ChevronDown className="w-4 h-4 ml-auto text-dashboard-muted" />
          </button>
          {sourceOpen && availableSources.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-full bg-dashboard-surface border border-dashboard-border rounded-lg shadow-xl z-50 overflow-hidden">
              {availableSources.map((src) => (
                <button
                  key={src}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-dashboard-border transition-colors ${
                    localFilters.source === src ? 'text-dashboard-accent bg-dashboard-border/50' : 'text-gray-300'
                  }`}
                  onClick={() => handleSourceChange(src)}
                >
                  {src}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Energy Source (multi-select) */}
      <div className="flex items-center gap-3">
        <Zap className="w-4 h-4 text-dashboard-muted" />
        <span className="text-xs text-dashboard-muted uppercase tracking-wider font-medium">Energy</span>
        <div className="relative" ref={energyRef}>
          <button
            onClick={() => setEnergyOpen(!energyOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-dashboard-surface border border-dashboard-border rounded-lg text-sm font-medium text-white hover:border-dashboard-accent transition-colors min-w-[150px]"
          >
            <span className={localFilters.energySources.length === 0 ? 'text-dashboard-muted' : ''}>
              {energyLabel}
            </span>
            <ChevronDown className="w-4 h-4 ml-auto text-dashboard-muted" />
          </button>
          {energyOpen && (
            <div className="absolute top-full left-0 mt-1 w-full bg-dashboard-surface border border-dashboard-border rounded-lg shadow-xl z-50 overflow-hidden">
              {ENERGY_SOURCES.map((src) => {
                const isSelected = localFilters.energySources.includes(src);
                return (
                  <button
                    key={src}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-dashboard-border transition-colors flex items-center gap-2.5 ${
                      isSelected ? 'text-dashboard-accent' : 'text-gray-300'
                    }`}
                    onClick={() => handleEnergyToggle(src)}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0"
                      style={{
                        borderColor: isSelected ? '#10B981' : '#6B7280',
                        backgroundColor: isSelected ? '#10B981' : 'transparent',
                      }}
                    >
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {src}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Start Date */}
      <div className="flex items-center gap-3">
        <Calendar className="w-4 h-4 text-dashboard-muted" />
        <span className="text-xs text-dashboard-muted uppercase tracking-wider font-medium">Start Date</span>
        <input
          type="date"
          value={localFilters.startDate}
          onChange={(e) => handleStartDateChange(e.target.value)}
          className="px-3 py-2.5 bg-dashboard-surface border border-dashboard-border rounded-lg text-sm text-white focus:outline-none focus:border-dashboard-accent transition-colors"
        />
      </div>

      {/* End Date */}
      <div className="flex items-center gap-3">
        <Calendar className="w-4 h-4 text-dashboard-muted" />
        <span className="text-xs text-dashboard-muted uppercase tracking-wider font-medium">End Date</span>
        <input
          type="date"
          value={localFilters.endDate}
          onChange={(e) => handleEndDateChange(e.target.value)}
          className="px-3 py-2.5 bg-dashboard-surface border border-dashboard-border rounded-lg text-sm text-white focus:outline-none focus:border-dashboard-accent transition-colors"
        />
      </div>
    </header>
  );
}
