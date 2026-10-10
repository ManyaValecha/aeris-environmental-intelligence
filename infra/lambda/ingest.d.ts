/**
 * AERIS Lambda Ingestion & Validation Function
 *
 * Validates incoming telemetry payload against strict schemas and domain bounds.
 * Preserves data provenance exactly as provided — NEVER converts SIMULATED to MEASURED.
 */
export interface TelemetryPayload {
    stationId: string;
    timestamp: string;
    provenance: 'MEASURED' | 'REANALYSIS' | 'SIMULATED' | 'PREDICTED' | 'ESTIMATED' | 'AI-GENERATED';
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
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
/**
 * Validates a telemetry payload for boundary, domain, and type integrity.
 */
export declare function validateTelemetryPayload(payload: any): ValidationResult;
/**
 * AWS Lambda Handler for Telemetry Ingestion.
 */
export declare function handler(event: any): Promise<any>;
