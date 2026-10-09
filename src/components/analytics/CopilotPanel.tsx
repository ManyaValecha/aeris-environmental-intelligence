import { useState, useCallback, useRef, useEffect } from 'react';
import { useAerisStore } from '@/store/aerisStore';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';
import { generateCopilotResponse } from '@/services/copilot/copilotService';
import { computeScenarioImpact, DEFAULT_CONTROLS } from '@/services/interventionService';
import type { CopilotResponse, CopilotAudience } from '@/services/copilot/copilotTypes';
import type { StationTelemetry } from '@/types/telemetry';
import type { StationForecast } from '@/types/forecast';
import type { AnomalyRecord } from '@/services/anomalyService';
import type { HistoricalPoint } from '@/services/historicalService';
import type { DataMode } from '@/types/telemetry';
import type { DataProvenance } from '@/types/provenance';

// ─── Section Accent Colors ────────────────────────────────────────────────────

const SECTION_CONFIG = {
  WHAT: { label: 'WHAT',   glyph: '◉', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)'  },
  WHY:  { label: 'WHY',    glyph: '⦿', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)'  },
  NEXT: { label: 'NEXT',   glyph: '▶', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)'  },
  ACTION: { label: 'ACTION', glyph: '⚡', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
} as const;

// ─── Skeleton / Loading ───────────────────────────────────────────────────────

function SkeletonBlock({ height = 60 }: { height?: number }) {
  return (
    <div
      className="shimmer"
      style={{
        height,
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-bg-elevated)',
      }}
    />
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  section,
  children,
  provenance,
}: {
  section: keyof typeof SECTION_CONFIG;
  children: React.ReactNode;
  provenance?: DataProvenance;
}) {
  const cfg = SECTION_CONFIG[section];
  return (
    <div
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.color}30`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ color: cfg.color, fontSize: 'var(--text-xs)', fontWeight: 900, letterSpacing: '0.1em' }}>
            {cfg.glyph}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: cfg.color,
          }}>
            {cfg.label}
          </span>
        </div>
        {provenance && <ProvenanceBadge provenance={provenance} compact />}
      </div>
      {children}
    </div>
  );
}

// ─── Evidence Table ───────────────────────────────────────────────────────────

function EvidenceRow({ label, value, unit, provenance }: {
  label: string; value: string; unit?: string; provenance: DataProvenance;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-primary)', fontWeight: 600 }}>
          {value}{unit ? ` ${unit}` : ''}
        </span>
        <ProvenanceBadge provenance={provenance} compact />
      </div>
    </div>
  );
}

// ─── Factor Row ───────────────────────────────────────────────────────────────

function FactorItem({ signal, interpretation, provenance }: {
  signal: string; interpretation: string; provenance: DataProvenance;
}) {
  return (
    <div style={{
      borderLeft: '2px solid var(--color-border)',
      paddingLeft: 'var(--space-3)',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          {signal}
        </span>
        <ProvenanceBadge provenance={provenance} compact />
      </div>
      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
        {interpretation}
      </span>
    </div>
  );
}

// ─── Forecast Horizon Row ─────────────────────────────────────────────────────

const HORIZON_LABELS: Record<string, string> = { '1h': '1h  ', '6h': '6h  ', '24h': '24h ' };

function ForecastRow({ forecast }: { forecast: CopilotResponse['next']['forecasts'][number] }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      paddingBottom: 'var(--space-2)',
      borderBottom: '1px solid var(--color-border-subtle)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#8b5cf6', fontWeight: 700 }}>
          {HORIZON_LABELS[forecast.horizon]}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-primary)', fontWeight: 600 }}>
          {forecast.predictedPm25} µg/m³
        </span>
        <ProvenanceBadge provenance="PREDICTED" compact />
      </div>
      <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>
        {forecast.summary}
      </p>
    </div>
  );
}

// ─── Recommendation Card ──────────────────────────────────────────────────────

function RecommendationCard({ rec, audience }: {
  rec: CopilotResponse['action']['recommendations'][number];
  audience: CopilotAudience;
}) {
  if (rec.audience !== audience) return null;
  const audienceColor = audience === 'CITIZEN' ? '#22c55e' : '#3b82f6';

  return (
    <div style={{
      background: `${audienceColor}08`,
      border: `1px solid ${audienceColor}22`,
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-3)',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}>
      <p style={{ fontSize: '11px', color: 'var(--color-text-primary)', margin: 0 }}>
        {rec.recommendation}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          Basis: {rec.basis}
        </span>
        <ProvenanceBadge provenance={rec.provenance} compact />
      </div>
    </div>
  );
}

// ─── Audience Toggle ──────────────────────────────────────────────────────────

function AudienceToggle({ audience, onChange }: {
  audience: CopilotAudience;
  onChange: (a: CopilotAudience) => void;
}) {
  const btnStyle = (active: boolean, color: string) => ({
    padding: '3px 10px',
    fontSize: '10px',
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    letterSpacing: '0.08em',
    border: `1px solid ${active ? color : 'var(--color-border)'}`,
    borderRadius: '4px',
    background: active ? `${color}18` : 'transparent',
    color: active ? color : 'var(--color-text-muted)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  return (
    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
      <button style={btnStyle(audience === 'CITIZEN', '#22c55e')} onClick={() => onChange('CITIZEN')} id="copilot-audience-citizen">
        CITIZEN
      </button>
      <button style={btnStyle(audience === 'AUTHORITY', '#3b82f6')} onClick={() => onChange('AUTHORITY')} id="copilot-audience-authority">
        AUTHORITY
      </button>
    </div>
  );
}

// ─── Main Copilot Panel ───────────────────────────────────────────────────────

interface CopilotPanelProps {
  telemetry: StationTelemetry | null;
  forecast: StationForecast | null;
  historical: HistoricalPoint[];
  anomalies: AnomalyRecord[];
  dataMode: DataMode;
}

export function CopilotPanel({
  telemetry,
  forecast,
  historical,
  anomalies,
  dataMode,
}: CopilotPanelProps) {
  const { activeScenarioImpact } = useAerisStore();
  const [response, setResponse] = useState<CopilotResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audience, setAudience] = useState<CopilotAudience>('CITIZEN');
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async () => {
    if (!telemetry || !forecast) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const scenario = activeScenarioImpact ?? computeScenarioImpact(forecast, DEFAULT_CONTROLS);
      const result = await generateCopilotResponse(
        telemetry,
        forecast,
        historical,
        anomalies,
        dataMode,
        scenario
      );
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate intelligence brief.');
    } finally {
      setLoading(false);
    }
  }, [telemetry, forecast, historical, anomalies, dataMode, activeScenarioImpact]);

  // Auto-generate when station or active scenario impact changes
  useEffect(() => {
    if (telemetry && forecast) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telemetry?.stationId, forecast?.stationId, activeScenarioImpact?.generatedAt]);

  if (!telemetry || !forecast) {
    return (
      <div className="panel" style={{ padding: 'var(--space-5)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
        Select a station to generate the environmental intelligence brief.
      </div>
    );
  }

  return (
    <div
      id="aeris-copilot-panel"
      className="panel"
      style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
    >
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: '#3b82f6',
            marginBottom: '2px',
          }}>
            ◈ AERIS ENVIRONMENTAL COPILOT
          </div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            {response
              ? `Generated by ${response.generatedBy} · ${new Date(response.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST`
              : 'Intelligence brief not yet generated'}
            {response?.isDemoMode && (
              <span style={{ marginLeft: '8px', color: '#f59e0b', fontWeight: 700 }}>[DEMO MODE]</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-2)' }}>
          <AudienceToggle audience={audience} onChange={setAudience} />
          <button
            id="copilot-generate-btn"
            onClick={generate}
            disabled={loading}
            style={{
              padding: '4px 12px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              letterSpacing: '0.06em',
              background: loading ? 'transparent' : 'rgba(59,130,246,0.15)',
              color: loading ? 'var(--color-text-muted)' : '#3b82f6',
              border: '1px solid rgba(59,130,246,0.35)',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {loading ? '⟳ GENERATING…' : '↺ REFRESH BRIEF'}
          </button>
        </div>
      </div>

      {/* ─── Loading Skeleton ─── */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <SkeletonBlock height={90} />
          <SkeletonBlock height={110} />
          <SkeletonBlock height={100} />
          <SkeletonBlock height={80} />
        </div>
      )}

      {/* ─── Error State ─── */}
      {!loading && error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          fontSize: 'var(--text-xs)',
          color: '#ef4444',
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* ─── Response Sections ─── */}
      {!loading && response && (
        <>
          {/* WHAT */}
          <SectionCard section="WHAT" provenance={telemetry.provenance}>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
              {response.what.summary}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {response.what.evidence.slice(0, 6).map((ev) => (
                <EvidenceRow key={ev.label} {...ev} />
              ))}
            </div>
          </SectionCard>

          {/* WHY */}
          <SectionCard section="WHY" provenance={telemetry.provenance}>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>
              {response.why.summary}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {response.why.factors.slice(0, 4).map((f, i) => (
                <FactorItem key={i} {...f} />
              ))}
            </div>
          </SectionCard>

          {/* NEXT */}
          <SectionCard section="NEXT" provenance="PREDICTED">
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              {response.next.summary}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {response.next.forecasts.map((f) => (
                <ForecastRow key={f.horizon} forecast={f} />
              ))}
            </div>
          </SectionCard>

          {/* ACTION */}
          <SectionCard section="ACTION" provenance="ESTIMATED">
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              {response.action.summary}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {response.action.recommendations
                .filter((r) => r.audience === audience)
                .map((rec, i) => (
                  <RecommendationCard key={i} rec={rec} audience={audience} />
                ))}
              {response.action.recommendations.filter((r) => r.audience === audience).length === 0 && (
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No recommendations available for the selected audience mode.
                </span>
              )}
            </div>
          </SectionCard>

          {/* ─── AI-Generated Label + Disclaimers ─── */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            borderTop: '1px solid var(--color-border-subtle)',
            paddingTop: 'var(--space-3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <ProvenanceBadge
                provenance={response.generatedBy === 'BEDROCK' ? 'AI_GENERATED' : 'SIMULATED'}
                compact={false}
              />
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                {response.generatedBy === 'BEDROCK'
                  ? 'AI-generated explanation — underlying numeric values retain their original provenance.'
                  : 'Rule-based intelligence brief — deterministic, no LLM involved.'}
              </span>
            </div>
            {response.disclaimers.slice(0, 2).map((d, i) => (
              <p key={i} style={{ margin: 0, fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                ⚠ {d}
              </p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
