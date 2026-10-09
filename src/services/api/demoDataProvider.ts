import type { DataProvider, TelemetryIngestPayload, IngestResponse } from './dataProvider';
import type { Station, StationId, StationTelemetry, DataMode } from '@/types/telemetry';
import type { HistoricalPoint } from '@/services/historicalService';
import { DELHI_NCR_STATIONS } from '@/data/stations';
import { fetchCurrentReadings } from '@/services/apiClient';
import { getStationHistoricalSeries } from '@/services/historicalService';

export class DemoDataProvider implements DataProvider {
  public readonly mode: DataMode = 'DEMO';

  async getStations(): Promise<Station[]> {
    return DELHI_NCR_STATIONS;
  }

  async getLatestStationData(stationId: StationId): Promise<StationTelemetry> {
    const res = await fetchCurrentReadings();
    const stationData = res.data.find((s) => s.stationId === stationId);
    if (!stationData) {
      throw new Error(`[DemoDataProvider] Station ${stationId} not found in readings`);
    }
    return stationData;
  }

  async getHistory(stationId: StationId, hours: number = 24): Promise<HistoricalPoint[]> {
    return getStationHistoricalSeries(stationId, hours);
  }

  async submitTelemetry(payload: TelemetryIngestPayload): Promise<IngestResponse> {
    return {
      ok: true,
      message: '[DemoDataProvider] Telemetry accepted into simulated local pipeline',
      provenance: payload.provenance,
    };
  }
}
