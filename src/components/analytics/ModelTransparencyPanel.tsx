export function ModelTransparencyPanel() {
  const modelRows = [
    {
      horizon: '1 Hour',
      model: 'XGBoost Regressor',
      version: 'xgboost-v1',
      mae: '4.38 µg/m³',
      rmse: '6.25',
      r2: '0.9527',
      reason: 'Outperformed persistence by 5.2% on validation MAE.',
    },
    {
      horizon: '6 Hours',
      model: 'LightGBM Regressor',
      version: 'lightgbm-v1',
      mae: '15.47 µg/m³',
      rmse: '19.60',
      r2: '0.5385',
      reason: 'Outperformed persistence by 19.3% on validation MAE.',
    },
    {
      horizon: '24 Hours',
      model: 'Persistence Baseline',
      version: 'persistence-v1',
      mae: '15.72 µg/m³',
      rmse: '19.70',
      r2: '0.5356',
      reason: 'Empirically selected; ML models overfit 24h validation noise.',
    },
  ];

  return (
    <div className="panel" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div>
        <div className="panel-title" style={{ fontSize: 'var(--text-xs)' }}>
          Forecast Method & Empirical Model Selection
        </div>
        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
          Evaluated on held-out test split (2,616 observations, Sept 25 – Oct 7, 2026)
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {modelRows.map((row) => (
          <div
            key={row.horizon}
            style={{
              background: 'var(--color-bg-base)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 'var(--text-xs)',
            }}
          >
            <div>
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{row.horizon}: </span>
              <span style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>{row.model} </span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>({row.reason})</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Test MAE: {row.mae}</span>
              &ensp;|&ensp;
              <span style={{ color: 'var(--color-text-muted)' }}>RMSE: {row.rmse}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
        Note: Models are selected independently per horizon using validation set MAE. No single overall accuracy metric is claimed.
      </div>
    </div>
  );
}
