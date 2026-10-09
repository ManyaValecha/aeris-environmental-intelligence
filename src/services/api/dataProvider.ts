import type { Station, StationId, StationTelemetry, DataMode } from '@/types/telemetry';
import type { HistoricalPoint } from '@/services/historicalService';
import type { DataProvenance } from '@/types/provenance';

export interface TelemetryIngestPayload {
  stationId: StationId;
  timestamp: string;
  provenance: DataProvenance;
  pollutants: {
    pm25: number;
    pm10: number;
    no2: number;
    so2: number;
    co: number;
    o3: number;
  };
  weather?: {
    temperatureCelsius: number;
    relativeHumidityPct: number;
    windSpeedKmH: number;
    windDirectionDeg: number;
    windDirectionLabel: string;
  };
}

export interface IngestResponse {
  ok: boolean;
  message: string;
  provenance: DataProvenance;
}

export interface DataProvider {
  readonly mode: DataMode;
  getStations(): Promise<Station[]>;
  getLatestStationData(stationId: StationId): Promise<StationTelemetry>;
  getHistory(stationId: StationId, hours?: number): Promise<HistoricalPoint[]>;
  submitTelemetry(payload: TelemetryIngestPayload): Promise<IngestResponse>;
}
