import React from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { PROVENANCE_AUDIT_TRAIL } from '../data/stationsData';

interface ProvenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProvenanceModal: React.FC<ProvenanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto border-[4px] border-ink bg-paper p-6 sm:p-8 shadow-[12px_12px_0_var(--ink)]">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b-[3px] border-ink pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="brutal-sticker bg-mint text-ink -rotate-1">
                AUDIT REGISTRY
              </span>
              <span className="font-mono text-xs font-black uppercase text-ink-soft">
                ISO / CPCB Compliance
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-ink sm:text-3xl font-display">
              DATA PROVENANCE &amp; VERIFICATION LOG
            </h2>
          </div>

          <button
            onClick={onClose}
            className="border-[2px] border-ink bg-white p-2 hover:bg-danger hover:text-paper transition-colors shadow-[2px_2px_0_var(--ink)] cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 stroke-[3]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="mt-6 space-y-6">
          <p className="text-xs text-ink-soft leading-relaxed">
            In accordance with the AERIS Scientific Charter, all metrics rendered across this application are tagged with an immutable provenance tier. This ensures clear demarcation between physical sensor measurements, synthetic diurnal interpolations, predictive ML horizons, and policy counterfactual estimations.
          </p>

          <div className="space-y-4">
            {PROVENANCE_AUDIT_TRAIL.map((item) => (
              <div
                key={item.id}
                className="border-[3px] border-ink bg-paper-light p-4 shadow-[4px_4px_0_var(--ink)]"
              >
                <div className="flex items-center justify-between border-b border-ink/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black uppercase px-2 py-0.5 border-[2px] border-ink bg-ink text-paper">
                      {item.label}
                    </span>
                    <h3 className="text-sm font-black uppercase text-ink font-display">
                      {item.title}
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-mint bg-ink px-2 py-0.5">
                    {item.confidenceScore}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-ink">
                  <div>
                    <strong className="text-ink-soft font-mono uppercase text-[10px]">Primary Data Source:</strong>{' '}
                    <span>{item.source}</span>
                  </div>
                  <div>
                    <strong className="text-ink-soft font-mono uppercase text-[10px]">Sampling Cadence:</strong>{' '}
                    <span>{item.frequency}</span>
                  </div>
                  <div>
                    <strong className="text-ink-soft font-mono uppercase text-[10px]">Processing Pipeline:</strong>{' '}
                    <span className="text-ink-soft">{item.processingPipeline}</span>
                  </div>
                  <div>
                    <strong className="text-ink-soft font-mono uppercase text-[10px]">Validation Protocol:</strong>{' '}
                    <span className="text-ink-soft">{item.validationMethod}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-[2px] border-ink bg-sun/20 p-4 text-xs leading-relaxed text-ink flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-ink shrink-0 stroke-[2.5] mt-0.5" />
            <span>
              <strong>Scientific Notice:</strong> AERIS does not claim real-time cloud micro-services are active without explicit data binding. When running in offline or simulation mode, all measurements are marked as <code>SIMULATED</code> or <code>ESTIMATED</code> according to the CPCB reference standard.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-8 border-t-[3px] border-ink pt-4 flex items-center justify-between">
          <span className="font-mono text-[11px] text-ink-soft">
            AERIS AUDIT PROTOCOL V1.4.2
          </span>
          <button
            onClick={onClose}
            className="brutal-button bg-ink text-paper px-5 py-2 text-xs shadow-[3px_3px_0_var(--sun)] cursor-pointer"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};
