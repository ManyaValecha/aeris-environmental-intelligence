import type { StationTelemetry } from '@/types';
import { StationCard } from '@/components/stations/StationCard';
import type { StationId } from '@/types';

interface StationGridProps {
  readings: StationTelemetry[];
  selectedStationId: StationId | null;
  onSelect: (id: StationId) => void;
  isLoading: boolean;
}

/**
 * StationGrid
 *
 * Renders a responsive grid of StationCards.
 * Shows skeleton placeholders while data is loading.
 */
export function StationGrid({ readings, selectedStationId, onSelect, isLoading }: StationGridProps) {
  if (isLoading && readings.length === 0) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: '280px', borderRadius: 'var(--radius-lg)' }}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 'var(--space-4)',
      }}
    >
      {readings.map((telemetry) => (
        <StationCard
          key={telemetry.stationId}
          telemetry={telemetry}
          isSelected={telemetry.stationId === selectedStationId}
          onClick={() => onSelect(telemetry.stationId)}
        />
      ))}
    </div>
  );
}
