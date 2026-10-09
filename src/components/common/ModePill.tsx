import type { DataMode } from '@/types';

interface ModePillProps {
  mode: DataMode;
  fetchError: string | null;
}

/**
 * ModePill
 *
 * Displays the current AERIS data mode (REAL or DEMO) with an animated dot.
 * If an error is present, displays the error context alongside the mode.
 * Always visible — users must always know what data source they are viewing.
 */
export function ModePill({ mode, fetchError }: ModePillProps) {
  const isDemo = mode === 'DEMO';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
      <span className={`mode-pill mode-pill--${isDemo ? 'demo' : 'real'}`}>
        <span className="mode-pill--dot" aria-hidden="true" />
        {isDemo ? 'DEMO MODE (OFFLINE)' : 'AWS PRODUCTION API'}
      </span>
      {fetchError && (
        <span
          style={{
            fontSize: '11px',
            color: 'var(--aqi-moderate)',
            fontFamily: 'var(--font-mono)',
            maxWidth: '280px',
            textAlign: 'right',
          }}
          role="status"
          aria-live="polite"
        >
          ⚠ {fetchError}
        </span>
      )}
    </div>
  );
}
