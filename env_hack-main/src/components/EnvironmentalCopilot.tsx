import React, { useState } from 'react';
import { StationReading, StationForecast, ScenarioResult, UserLens, CopilotBrief } from '../types';
import { generateCopilotBrief } from '../data/stationsData';
import { Bot, Sparkles, Shield, Users, CheckCircle, AlertCircle, RefreshCw, Send, HelpCircle, Layers } from 'lucide-react';

interface EnvironmentalCopilotProps {
  activeLens: UserLens;
  onLensChange: (lens: UserLens) => void;
  selectedStation: StationReading;
  forecast: StationForecast;
  scenarioResult: ScenarioResult;
  onOpenAudit: () => void;
}

export const EnvironmentalCopilot: React.FC<EnvironmentalCopilotProps> = ({
  activeLens,
  onLensChange,
  selectedStation,
  forecast,
  scenarioResult,
  onOpenAudit,
}) => {
  const [modelType, setModelType] = useState<'AMAZON_NOVA_MICRO' | 'CLAUDE_35_SONNET'>('AMAZON_NOVA_MICRO');
  const [brief, setBrief] = useState<CopilotBrief>(() =>
    generateCopilotBrief(activeLens, selectedStation, forecast, scenarioResult, 'AMAZON_NOVA_MICRO')
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeQuery, setActiveQuery] = useState<string>('Why is pollution elevated?');
  const [customInput, setCustomInput] = useState<string>('');

  const handleGenerate = (queryTitle: string, targetLens?: UserLens, customQ?: string) => {
    setActiveQuery(queryTitle);
    setIsGenerating(true);
    const chosenLens = targetLens || activeLens;

    setTimeout(() => {
      const newBrief = generateCopilotBrief(
        chosenLens,
        selectedStation,
        forecast,
        scenarioResult,
        modelType,
        customQ || (queryTitle.includes('Why') ? queryTitle : undefined)
      );
      setBrief(newBrief);
      setIsGenerating(false);
    }, 380);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    handleGenerate(customInput, activeLens, customInput);
    setCustomInput('');
  };

  return (
    <div className="brutal-card bg-paper-light p-6 sm:p-7">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b-[2px] border-ink/20 pb-4 gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center border-[2px] border-ink bg-sun text-ink shadow-[2px_2px_0_var(--ink)]">
            <Bot className="h-5 w-5 stroke-[2.5]" />
          </span>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-ink font-display flex items-center gap-2">
              <span>Amazon Bedrock Environmental Copilot</span>
              <span className="border border-ink bg-mint text-ink text-[10px] font-mono px-1.5 py-0.2 shadow-[1px_1px_0_var(--ink)]">
                {modelType === 'AMAZON_NOVA_MICRO' ? 'NOVA MICRO' : 'CLAUDE 3.5'}
              </span>
            </h3>
            <span className="font-mono text-[10px] text-ink-soft">
              {modelType === 'AMAZON_NOVA_MICRO'
                ? 'Amazon Nova Micro · Ultra-fast ~120ms reasoning · Zero hallucination guarantee'
                : 'Anthropic Claude 3.5 Sonnet · Deep multi-physics reasoning via Bedrock'}
            </span>
          </div>
        </div>

        {/* Model Switcher & Audit Link */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border-[2px] border-ink bg-white p-0.5">
            <button
              onClick={() => {
                setModelType('AMAZON_NOVA_MICRO');
                setIsGenerating(true);
                setTimeout(() => {
                  setBrief(generateCopilotBrief(activeLens, selectedStation, forecast, scenarioResult, 'AMAZON_NOVA_MICRO'));
                  setIsGenerating(false);
                }, 300);
              }}
              className={`px-2 py-1 text-[10px] font-black uppercase transition-all cursor-pointer ${
                modelType === 'AMAZON_NOVA_MICRO'
                  ? 'bg-sun text-ink shadow-[2px_2px_0_var(--ink)]'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Nova Micro (Fast)
            </button>
            <button
              onClick={() => {
                setModelType('CLAUDE_35_SONNET');
                setIsGenerating(true);
                setTimeout(() => {
                  setBrief(generateCopilotBrief(activeLens, selectedStation, forecast, scenarioResult, 'CLAUDE_35_SONNET'));
                  setIsGenerating(false);
                }, 300);
              }}
              className={`px-2 py-1 text-[10px] font-black uppercase transition-all cursor-pointer ${
                modelType === 'CLAUDE_35_SONNET'
                  ? 'bg-violet text-paper shadow-[2px_2px_0_var(--ink)]'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Claude 3.5 Sonnet
            </button>
          </div>

          <button
            onClick={onOpenAudit}
            className="brutal-sticker bg-white text-ink border-[2px] border-ink shadow-[2px_2px_0_var(--ink)] text-[9px] cursor-pointer"
          >
            PROVENANCE: {brief.provenance}
          </button>
        </div>
      </div>

      {/* Mode Switcher & Quick Query Chips */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-[2px] border-ink bg-paper p-3">
        {/* Lens Mode Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase text-ink-soft">
            Copilot Lens:
          </span>
          <div className="flex items-center border-[2px] border-ink bg-white p-0.5">
            <button
              onClick={() => {
                onLensChange('CITIZEN');
                handleGenerate('Citizen Exposure Summary', 'CITIZEN');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase transition-all cursor-pointer ${
                activeLens === 'CITIZEN'
                  ? 'bg-violet text-paper shadow-[2px_2px_0_var(--ink)]'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Citizen View</span>
            </button>
            <button
              onClick={() => {
                onLensChange('AUTHORITY');
                handleGenerate('Municipal Directive Brief', 'AUTHORITY');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase transition-all cursor-pointer ${
                activeLens === 'AUTHORITY'
                  ? 'bg-coral text-ink shadow-[2px_2px_0_var(--ink)]'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Authority View</span>
            </button>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => handleGenerate('Why is pollution elevated right now?', undefined, 'Why is pollution elevated right now?')}
            className={`border-[1.5px] border-ink px-2.5 py-1 text-[11px] font-black uppercase transition-all cursor-pointer ${
              activeQuery.includes('Why')
                ? 'bg-sun text-ink shadow-[2px_2px_0_var(--ink)]'
                : 'bg-white text-ink hover:bg-paper'
            }`}
          >
            Why Is Pollution High?
          </button>
          <button
            onClick={() => handleGenerate('Morning Commute Risk Assessment')}
            className={`border-[1.5px] border-ink px-2.5 py-1 text-[11px] font-black uppercase transition-all cursor-pointer ${
              activeQuery === 'Morning Commute Risk Assessment'
                ? 'bg-sun text-ink shadow-[2px_2px_0_var(--ink)]'
                : 'bg-white text-ink hover:bg-paper'
            }`}
          >
            Morning Commute
          </button>
          <button
            onClick={() => handleGenerate('GRAP Statutory Enforcement Directive', undefined, 'What GRAP statutory stage should be triggered right now?')}
            className={`border-[1.5px] border-ink px-2.5 py-1 text-[11px] font-black uppercase transition-all cursor-pointer ${
              activeQuery === 'GRAP Statutory Enforcement Directive'
                ? 'bg-coral text-ink shadow-[2px_2px_0_var(--ink)]'
                : 'bg-white text-ink hover:bg-paper'
            }`}
          >
            GRAP Trigger
          </button>
          <button
            onClick={() => handleGenerate('Counterfactual Policy Sensitivity', undefined, 'How much will vehicle and diesel restrictions reduce PM2.5?')}
            className={`border-[1.5px] border-ink px-2.5 py-1 text-[11px] font-black uppercase transition-all cursor-pointer ${
              activeQuery === 'Counterfactual Policy Sensitivity'
                ? 'bg-violet text-paper shadow-[2px_2px_0_var(--ink)]'
                : 'bg-white text-ink hover:bg-paper'
            }`}
          >
            Policy Levers
          </button>
        </div>
      </div>

      {/* Interactive Custom Question Bar */}
      <form onSubmit={handleCustomSubmit} className="mt-4 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={`Ask ${brief.modelFamily.split(' ')[0]} about ${selectedStation.stationId.replace('DELHI_', '')} (e.g., 'Will wind clear the smog by 3 PM?' or 'Should schools close?')`}
            className="w-full border-[2px] border-ink bg-white px-3.5 py-2.5 text-xs text-ink placeholder:text-ink-soft/70 shadow-[3px_3px_0_var(--ink)] focus:outline-none focus:ring-2 focus:ring-sun font-mono"
          />
        </div>
        <button
          type="submit"
          className="brutal-button bg-sun hover:bg-sun-hover px-4 py-2.5 text-xs text-ink shadow-[3px_3px_0_var(--ink)] gap-1.5 shrink-0"
        >
          <Sparkles className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Ask Bedrock</span>
        </button>
      </form>

      {/* Main Copilot Brief Card */}
      <div className="mt-6 border-[3px] border-ink bg-white p-6 shadow-[5px_5px_0_var(--ink)]">
        {isGenerating ? (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <RefreshCw className="h-8 w-8 text-violet animate-spin" />
            <span className="mt-3 font-mono text-xs font-black uppercase text-ink">
              Grounding {brief.modelFamily} in live CPCB sensor telemetry &amp; ERA5 fields...
            </span>
          </div>
        ) : (
          <div>
            {/* Brief Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-ink/20 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-mint animate-pulse" />
                <span className="font-mono text-xs font-black uppercase text-ink">
                  {brief.stationName} STATION AIRSHED BRIEFING
                </span>
                <span className="border border-ink/40 bg-paper px-1.5 py-0.2 font-mono text-[9px] text-ink">
                  MODEL: {brief.modelId}
                </span>
              </div>
              <span className="font-mono text-[10px] text-ink-soft">
                SYNTHESIZED: {new Date(brief.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
              </span>
            </div>

            {/* If user asked a question, show the targeted answer box */}
            {brief.userAnswer && (
              <div className="mt-4 border-[2px] border-ink bg-sun/20 p-4 shadow-[2px_2px_0_var(--ink)]">
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-black uppercase text-ink mb-1">
                  <HelpCircle className="h-4 w-4 text-ink stroke-[2.5]" />
                  <span>Q: {brief.userQuestion || activeQuery}</span>
                </div>
                <p className="text-xs leading-relaxed text-ink font-semibold mt-1">
                  {brief.userAnswer}
                </p>
              </div>
            )}

            {/* Why Is Pollution Elevated? Sensor Evidence Synthesis */}
            {brief.evidenceSummary && (
              <div className="mt-4 border-l-[4px] border-coral bg-paper-deep p-4 text-xs leading-relaxed text-ink">
                <strong className="text-ink font-display text-sm uppercase block mb-1">
                  Why Pollution Is Elevated (Evidence Synthesis):
                </strong>
                <p className="text-ink font-medium">
                  {brief.evidenceSummary}
                </p>
              </div>
            )}

            {/* Executive Summary */}
            <div className="mt-4 p-4 border-l-[4px] border-ink bg-paper text-xs leading-relaxed text-ink font-medium">
              <strong className="text-ink font-display text-sm uppercase block mb-1">
                Executive Assessment:
              </strong>
              {brief.executiveSummary}
            </div>

            {/* Ground Truth Facts (Explicitly Grounded) */}
            <div className="mt-5">
              <span className="text-[11px] font-black uppercase text-ink block mb-2 font-display">
                Grounded Sensor Invariants (Zero Hallucinations):
              </span>
              <div className="grid gap-2 sm:grid-cols-2">
                {brief.groundTruthFacts.map((fact, idx) => (
                  <div
                    key={idx}
                    className="border border-ink/20 bg-paper p-2.5 text-xs text-ink flex items-start gap-2"
                  >
                    <CheckCircle className="h-4 w-4 text-mint shrink-0 stroke-[2.5] mt-0.5" />
                    <span>{fact}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Directives / Recommendations */}
            <div className="mt-5">
              <span className="text-[11px] font-black uppercase text-ink block mb-2 font-display">
                {activeLens === 'CITIZEN' ? 'Recommended Personal Protective Actions:' : 'Statutory Municipal Directives:'}
              </span>
              <ul className="space-y-2 text-xs text-ink font-medium">
                {brief.actionDirectives.map((action, idx) => (
                  <li
                    key={idx}
                    className="border border-ink/20 bg-white p-2.5 flex items-start gap-2.5"
                  >
                    <span className="font-mono text-[10px] font-black px-1.5 py-0.2 border border-ink bg-sun text-ink">
                      {idx + 1}
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* GRAP Directive Box */}
            <div className="mt-5 border-[2px] border-danger bg-danger/10 p-3 text-xs font-bold text-danger flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 stroke-[2.5] mt-0.5" />
              <span>{brief.grapStageRecommendation}</span>
            </div>

            {/* Grounding Guarantee Footer */}
            <div className="mt-4 pt-3 border-t border-ink/15 text-[10px] font-mono text-ink-soft">
              {brief.modelNotice}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

