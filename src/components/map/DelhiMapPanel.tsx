import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import type { StationTelemetry } from '@/types';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';
import { DELHI_NCR_STATIONS } from '@/data/stations';
import type { StationId } from '@/types';
import 'leaflet/dist/leaflet.css';

// Delhi NCR map centre
const DELHI_NCR_CENTRE: [number, number] = [28.62, 77.20];
const DEFAULT_ZOOM = 10;

interface DelhiMapProps {
  readings: StationTelemetry[];
  selectedStationId: StationId | null;
  onStationSelect: (id: StationId) => void;
}

/**
 * DelhiMapPanel
 *
 * Interactive Leaflet + OpenStreetMap component showing all 8 Delhi NCR
 * monitoring stations as circle markers coloured by AQI category.
 *
 * Map provider: OpenStreetMap — no API key required.
 * Tile filter: dark-desaturated via CSS (defined in index.css).
 *
 * Each marker popup shows station name, AQI, and provenance badge.
 */
export function DelhiMapPanel({ readings, selectedStationId, onStationSelect }: DelhiMapProps) {
  // Build a lookup from stationId → telemetry for O(1) access
  const telemetryMap = new Map<string, StationTelemetry>(
    readings.map((r) => [r.stationId, r])
  );

  return (
    <div
      style={{
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        height: '100%',
        minHeight: '380px',
        position: 'relative',
      }}
    >
      {/* Panel header overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          background: 'linear-gradient(to bottom, rgba(8,12,20,0.85) 0%, transparent 100%)',
          padding: 'var(--space-4) var(--space-5)',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--color-text-secondary)',
          }}
        >
          Delhi NCR — Spatial Pollution Map
        </div>
        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
          OpenStreetMap © contributors · No API key required
        </div>
      </div>

      <MapContainer
        center={DELHI_NCR_CENTRE}
        zoom={DEFAULT_ZOOM}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        attributionControl={true}
        aria-label="Delhi NCR air quality monitoring station map"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={18}
        />

        {DELHI_NCR_STATIONS.map((station) => {
          const telemetry = telemetryMap.get(station.id);
          const isSelected = selectedStationId === station.id;

          // Default marker style when data not yet loaded
          const color = telemetry?.aqi.categoryColor ?? '#64748b';
          const aqi = telemetry?.aqi.value ?? '—';
          const category = telemetry?.aqi.category.replace('_', ' ') ?? 'No data';

          return (
            <CircleMarker
              key={station.id}
              center={[station.coordinates.lat, station.coordinates.lng]}
              radius={isSelected ? 20 : 14}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: isSelected ? 0.85 : 0.6,
                weight: isSelected ? 3 : 1.5,
                opacity: 1,
              }}
              eventHandlers={{
                click: () => onStationSelect(station.id),
              }}
              aria-label={`${station.name}: AQI ${aqi}`}
            >
              <Popup>
                <div
                  style={{
                    padding: 'var(--space-4)',
                    minWidth: '200px',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 'var(--text-md)',
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    {station.name}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    {station.locality}
                  </div>

                  {telemetry ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 'var(--text-2xl)',
                            fontWeight: 500,
                            color,
                          }}
                        >
                          {aqi}
                        </span>
                        <span
                          style={{
                            fontSize: 'var(--text-xs)',
                            color,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                          }}
                        >
                          {category}
                        </span>
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                        PM2.5: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
                          {Math.round(telemetry.pollutants.pm25)} µg/m³
                        </span>
                        &ensp;|&ensp;
                        Wind: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
                          {telemetry.weather.windSpeedKmH.toFixed(1)} km/h {telemetry.weather.windDirectionLabel}
                        </span>
                      </div>
                      <ProvenanceBadge provenance={telemetry.provenance} />
                    </>
                  ) : (
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                      Loading data…
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Bottom Spatial Field Disclaimer Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          right: 12,
          zIndex: 20,
          background: 'rgba(8, 12, 20, 0.88)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
          Spatial field visualization — derived from station & reanalysis signals
        </span>
        <ProvenanceBadge provenance="REANALYSIS" />
      </div>
    </div>
  );
}
