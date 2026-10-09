import type { DataProvider, TelemetryIngestPayload, IngestResponse } from './dataProvider';
import type { Station, StationId, StationTelemetry, DataMode } from '@/types/telemetry';
import type { HistoricalPoint } from '@/services/historicalService';
import { DemoDataProvider } from './demoDataProvider';

export class AWSDataProvider implements DataProvider {
  public readonly mode: DataMode = 'REAL';
  private readonly baseUrl: string;
  private readonly fallbackProvider: DemoDataProvider;
  private isDegraded: boolean = false;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || (import.meta.env.VITE_AERIS_API_URL as string) || 'https://api.aeris.internal/prod';
    this.fallbackProvider = new DemoDataProvider();
  }

  public get degraded(): boolean {
    return this.isDegraded;
  }

  async getStations(): Promise<Station[]> {
    try {
      const res = await fetch(`${this.baseUrl}/stations`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.ok || !Array.isArray(json.stations)) throw new Error(json.error || 'Invalid API payload');
      return json.stations;
    } catch (err) {
      console.warn('[AWSDataProvider] Failed to fetch stations from AWS API Gateway, falling back to DemoDataProvider:', err);
      this.isDegraded = true;
      return this.fallbackProvider.getStations();
    }
  }

  async getLatestStationData(stationId: StationId): Promise<StationTelemetry> {
    try {
      const res = await fetch(`${this.baseUrl}/stations/${stationId}/latest`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.ok || !json.telemetry) throw new Error(json.error || 'Invalid telemetry payload');
      return json.telemetry;
    } catch (err) {
      console.warn(`[AWSDataProvider] Failed to fetch latest data for ${stationId}, falling back to DemoDataProvider:`, err);
      this.isDegraded = true;
      return this.fallbackProvider.getLatestStationData(stationId);
    }
  }

  async getHistory(stationId: StationId, hours: number = 24): Promise<HistoricalPoint[]> {
    try {
      const res = await fetch(`${this.baseUrl}/stations/${stationId}/history?hours=${hours}`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.ok || !Array.isArray(json.history)) throw new Error(json.error || 'Invalid history payload');
      return json.history;
    } catch (err) {
      console.warn(`[AWSDataProvider] Failed to fetch history for ${stationId}, falling back to DemoDataProvider:`, err);
      this.isDegraded = true;
      return this.fallbackProvider.getHistory(stationId, hours);
    }
  }

  async submitTelemetry(payload: TelemetryIngestPayload): Promise<IngestResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return {
        ok: json.ok ?? true,
        message: json.message || 'Telemetry ingested to AWS DynamoDB',
        provenance: payload.provenance, // EXPLICIT PROVENANCE PRESERVATION
      };
    } catch (err) {
      console.warn('[AWSDataProvider] Telemetry submission to AWS API Gateway failed, falling back to DemoDataProvider:', err);
      this.isDegraded = true;
      return this.fallbackProvider.submitTelemetry(payload);
    }
  }
}
