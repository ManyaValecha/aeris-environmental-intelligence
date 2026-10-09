import { MapContainer, TileLayer, CircleMarker, Circle, Popup } from 'react-leaflet';
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
 * monitoring stations as circle markers coloured by AQI category with active pulse halos
 * and a 30km spatial coverage boundary ring.
 */
export function DelhiMapPanel({ readings, selectedStationId, onStationSelect }: DelhiMapProps) {
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
        boxShadow: '0 8px 32px rgba(8, 12, 20, 0.4)',
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
          background: 'linear-gradient(to bottom, rgba(8,12,20,0.92) 0%, transparent 100%)',
          padding: 'var(--space-4) var(--space-5)',
          pointerEvents: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#38bdf8',
              fontFamily: 'var(--font-mono)',
            }}
          >
            DELHI NCR SPATIAL MONITORING MATRIX
          </div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            8 CPCB Air Quality Reference Stations · OpenStreetMap Base
          </div>
        </div>

        <div
          style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-secondary)',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--color-border)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            pointerEvents: 'auto',
          }}
        >
          28.61° N, 77.20° E
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

        {/* Delhi NCR 30km Spatial Boundary Ring */}
        <Circle
          center={DELHI_NCR_CENTRE}
          radius={32000}
          pathOptions={{
            color: '#38bdf8',
            fillColor: '#38bdf8',
            fillOpacity: 0.03,
            weight: 1,
            dashArray: '4, 8',
          }}
        />

        {DELHI_NCR_STATIONS.map((station) => {
          const telemetry = telemetryMap.get(station.id);
          const isSelected = selectedStationId === station.id;

          const color = telemetry?.aqi.categoryColor ?? '#64748b';
          const aqi = telemetry?.aqi.value ?? '—';
          const category = telemetry?.aqi.category.replace('_', ' ') ?? 'No data';

          return (
            <div key={station.id}>
              {/* Active selection pulse ring */}
              {isSelected && (
                <CircleMarker
                  center={[station.coordinates.lat, station.coordinates.lng]}
                  radius={28}
                  pathOptions={{
                    color: color,
                    fillColor: 'transparent',
                    weight: 2,
                    opacity: 0.5,
                  }}
                />
              )}

              <CircleMarker
                center={[station.coordinates.lat, station.coordinates.lng]}
                radius={isSelected ? 18 : 13}
                pathOptions={{
                  color: isSelected ? '#ffffff' : color,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.95 : 0.75,
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
                      minWidth: '220px',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 'var(--text-md)',
                        color: 'var(--color-text-primary)',
                        marginBottom: 'var(--space-1)',
                        fontFamily: 'var(--font-display)',
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
                      {station.locality} · {station.coordinates.lat}, {station.coordinates.lng}
                    </div>

                    {telemetry ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 'var(--text-2xl)',
                              fontWeight: 700,
                              color,
                            }}
                          >
                            {aqi}
                          </span>
                          <span
                            style={{
                              fontSize: 'var(--text-xs)',
                              color,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {category}
                          </span>
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)', lineHeight: 1.5 }}>
                          PM2.5: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                            {Math.round(telemetry.pollutants.pm25)} µg/m³
                          </span>
                          &ensp;|&ensp;
                          Wind: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                            {telemetry.weather.windSpeedKmH.toFixed(1)} km/h {telemetry.weather.windDirectionLabel}
                          </span>
                        </div>
                        <ProvenanceBadge provenance={telemetry.provenance} />
                      </>
                    ) : (
                      <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                        Loading station telemetry…
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            </div>
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
          background: 'rgba(8, 12, 20, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
          Spatial boundary field · Illustrative vector streamlines overlaid on 8 CPCB reference nodes
        </span>
        <ProvenanceBadge provenance="REANALYSIS" />
      </div>
    </div>
  );
}
