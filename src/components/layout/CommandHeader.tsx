import { useEffect, useState } from 'react';
import { ModePill } from '@/components/common/ModePill';
import { useAerisStore } from '@/store/aerisStore';
import { AwsArchitectureModal } from '@/components/analytics/AwsArchitectureModal';

export function CommandHeader() {
  const { dataMode, lastUpdated, isLoading, fetchError, refreshReadings } = useAerisStore();
  const [now, setNow] = useState<Date>(new Date());
  const [isAwsModalOpen, setIsAwsModalOpen] = useState(false);

  // Live clock — IST
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const istTime = now.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const istDate = now.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-6)',
          height: '64px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg-surface)',
          flexShrink: 0,
          gap: 'var(--space-4)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* ─── Wordmark ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {/* Logo icon */}
          <div
            aria-hidden="true"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: '700',
              fontFamily: 'var(--font-mono)',
              color: '#fff',
              boxShadow: '0 0 14px rgba(59,130,246,0.4)',
              flexShrink: 0,
            }}
          >
            Æ
          </div>
          <div>
            <div
              style={{
                fontSize: 'var(--text-md)',
                fontWeight: '700',
                letterSpacing: '-0.02em',
                color: 'var(--color-text-primary)',
                lineHeight: 1.1,
              }}
            >
              AERIS
            </div>
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-secondary)',
                letterSpacing: '0.04em',
                lineHeight: 1.2,
              }}
            >
              AI Environmental Response & Intelligence System
            </div>
          </div>
        </div>

        {/* ─── Centre: Region label + AWS Architecture Button ─── */}
        <div
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.04em',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>DELHI NCR</span>
            <span style={{ fontSize: 'var(--text-xs)' }}>8 MONITORING STATIONS</span>
          </div>

          <button
            onClick={() => setIsAwsModalOpen(true)}
            style={{
              padding: '4px 10px',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--prov-reanalysis)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              transition: 'background-color 150ms ease',
            }}
            title="View AWS CDK Infrastructure Topology"
          >
            ☁ AWS STACK
          </button>
        </div>

        {/* ─── Right: Clock + Mode ─── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-6)',
          }}
        >
          {/* IST Clock */}
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-lg)',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                lineHeight: 1.1,
                letterSpacing: '0.04em',
              }}
              aria-label={`Current time in IST: ${istTime}`}
            >
              {istTime}
            </div>
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
                letterSpacing: '0.04em',
              }}
            >
              {istDate} IST
            </div>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => void refreshReadings()}
            disabled={isLoading}
            title={lastUpdated ? `Last updated: ${new Date(lastUpdated).toLocaleTimeString()}` : 'Refresh data'}
            aria-label="Refresh station data"
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 10px',
              color: isLoading ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.06em',
              transition: 'border-color var(--transition-fast), color var(--transition-fast)',
            }}
          >
            {isLoading ? '↻ LOADING' : '↻ REFRESH'}
          </button>

          {/* Data mode */}
          <ModePill mode={dataMode} fetchError={fetchError} />
        </div>
      </header>

      {/* AWS Architecture Modal */}
      <AwsArchitectureModal isOpen={isAwsModalOpen} onClose={() => setIsAwsModalOpen(false)} />
    </>
  );
}
