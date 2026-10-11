import React, { useState } from 'react';
import {
  Trees,
  Leaf,
  Sprout,
  Wind,
  ExternalLink,
  Github,
  Globe,
  CheckCircle2,
  Terminal,
  Copy,
  Check,
  Maximize2,
  RefreshCw,
  Cpu,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  TreePine,
  TreeDeciduous,
  Activity,
  Gauge
} from 'lucide-react';

export const LiveVercelDeploymentSection: React.FC = () => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(true);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'vercel' | 'github' | 'aws'>('vercel');

  const liveUrl = 'https://aeris-environmental-intelligence.vercel.app/';
  const githubProfileUrl = 'https://github.com/ManyaValecha';
  const githubRepoUrl = 'https://github.com/ManyaValecha/aeris-environmental-intelligence';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const commands = {
    vercel: `npm run build\nvercel --prod --yes`,
    github: `git add .\ngit commit -m "feat(aeris): production atmospheric digital twin with LightGBM & Bedrock"\ngit push origin main`,
    aws: `cd cdk\nnpm run build\nnpx cdk deploy AerisProductionStack --require-approval never`,
  };

  return (
    <section id="live-cloud" className="border-b-[3px] border-ink bg-paper-light py-12 lg:py-16">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        {/* Top Header Badge & Section Headline */}
        <div className="flex flex-col items-start gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="brutal-sticker bg-mint text-ink font-black flex items-center gap-1.5 -rotate-1 shadow-[2px_2px_0_var(--ink)]">
              <Trees className="h-4 w-4 stroke-[2.5]" />
              FOREST BIOSPHERE &amp; CLEAN AIR SANCTUARY
            </span>
            <span className="brutal-sticker bg-sun text-ink font-black flex items-center gap-1.5 rotate-1 shadow-[2px_2px_0_var(--ink)]">
              <Globe className="h-4 w-4 stroke-[2.5]" />
              VERCEL GLOBAL EDGE DEPLOYMENT
            </span>
            <span className="border-[2px] border-ink bg-night px-2.5 py-1 text-[11px] font-black uppercase text-paper flex items-center gap-1.5 shadow-[2px_2px_0_var(--ink)]">
              <Github className="h-3.5 w-3.5" />
              MANYA VALECHA REPOSITORY
            </span>
          </div>

          <h2 className="text-3xl font-black uppercase tracking-tight text-ink sm:text-5xl font-display leading-[1.1]">
            LIVE CLOUD PRODUCTION PORTAL
            <span className="block text-coral mt-1 text-2xl sm:text-3xl font-mono">
              aeris-environmental-intelligence.vercel.app
            </span>
          </h2>

          <p className="max-w-3xl text-sm leading-relaxed text-ink-soft">
            Experience the fully synchronized live AERIS digital twin deployed globally on <strong>Vercel Edge</strong> and powered by <strong>AWS CDK serverless infrastructure</strong>. Delhi NCR&apos;s urban forest canopies, continuous CPCB telemetry, LightGBM multi-horizon forecasts, and Amazon Bedrock AI synthesis are live in real-time.
          </p>
        </div>

        {/* Forest & Biosphere Air Quality Impact Strip */}
        <div className="mt-8 border-[3px] border-ink bg-paper p-5 sm:p-6 shadow-[4px_4px_0_var(--ink)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-[2px] border-ink/20 pb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center border-[2px] border-ink bg-mint text-ink shadow-[2px_2px_0_var(--ink)]">
                <Leaf className="h-5 w-5 stroke-[2.5]" />
              </span>
              <div>
                <h3 className="text-sm font-black uppercase text-ink font-display">
                  Delhi NCR Forest Canopy Air Filtration Matrix
                </h3>
                <p className="text-[11px] font-mono text-ink-soft">
                  Vegetative boundary layer absorption · Aravalli Ridge &amp; Asola Bhatti Biosphere
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 border border-ink bg-mint/20 px-2.5 py-1 text-[11px] font-black uppercase text-ink">
                <Sprout className="h-3.5 w-3.5 text-mint" />
                CANOPY FILTERING: ACTIVE
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1 */}
            <div className="border-[2px] border-ink bg-paper-light p-3.5 shadow-[2px_2px_0_var(--ink)]">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-ink-soft">
                <span>RIDGE FOREST SINK</span>
                <Trees className="h-3.5 w-3.5 text-mint" />
              </div>
              <div className="mt-2 text-2xl font-black text-ink font-display">
                32.7 km²
              </div>
              <p className="mt-1 text-[11px] text-ink-soft">
                Protected urban forest cover across Southern Ridge &amp; Asola Bhatti Sanctuary.
              </p>
              <div className="mt-2 text-[10px] font-bold text-mint uppercase">
                +18.4 kg PM/hectare/day filtered
              </div>
            </div>

            {/* Card 2 */}
            <div className="border-[2px] border-ink bg-paper-light p-3.5 shadow-[2px_2px_0_var(--ink)]">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-ink-soft">
                <span>FOLIAGE PARTICULATE TRAP</span>
                <Leaf className="h-3.5 w-3.5 text-mint" />
              </div>
              <div className="mt-2 text-2xl font-black text-ink font-display">
                -34.2%
              </div>
              <p className="mt-1 text-[11px] text-ink-soft">
                Peepal &amp; Banyan leaf trichomes trap fine aerosols before ground-level inhalation.
              </p>
              <div className="mt-2 text-[10px] font-bold text-coral uppercase">
                Critical particulate interception
              </div>
            </div>

            {/* Card 3 */}
            <div className="border-[2px] border-ink bg-paper-light p-3.5 shadow-[2px_2px_0_var(--ink)]">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-ink-soft">
                <span>INVERSION BREAK BUFFER</span>
                <Wind className="h-3.5 w-3.5 text-sun" />
              </div>
              <div className="mt-2 text-2xl font-black text-ink font-display">
                -2.8°C
              </div>
              <p className="mt-1 text-[11px] text-ink-soft">
                Canopy evapotranspiration breaks stagnant thermal caps, assisting vertical dispersion.
              </p>
              <div className="mt-2 text-[10px] font-bold text-sun uppercase">
                Thermal inversion attenuation
              </div>
            </div>

            {/* Card 4 */}
            <div className="border-[2px] border-ink bg-paper-light p-3.5 shadow-[2px_2px_0_var(--ink)]">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-ink-soft">
                <span>FOREST AQI VS URBAN CORE</span>
                <Gauge className="h-3.5 w-3.5 text-coral" />
              </div>
              <div className="mt-2 text-2xl font-black text-mint font-display">
                142 <span className="text-xs text-ink-soft font-normal">vs 384 AQI</span>
              </div>
              <p className="mt-1 text-[11px] text-ink-soft">
                Asola Forest recorded Moderate (142) vs Anand Vihar industrial hub Severe (384).
              </p>
              <div className="mt-2 text-[10px] font-bold text-ink uppercase">
                242-point biological buffer
              </div>
            </div>
          </div>
        </div>

        {/* Action Command Row: Open Live App, GitHub & Toggle Preview */}
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {/* Action 1: Launch Vercel App */}
          <div className="border-[3px] border-ink bg-night p-6 text-paper shadow-[5px_5px_0_var(--coral)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-black uppercase text-mint font-mono">
                  <span className="h-2 w-2 rounded-full bg-mint animate-ping" />
                  STATUS: 200 OK · ONLINE
                </span>
                <span className="border border-paper/30 bg-paper/10 px-2 py-0.5 text-[10px] font-mono text-paper">
                  VERCEL EDGE
                </span>
              </div>

              <h3 className="mt-4 text-2xl font-black uppercase text-white font-display">
                OPEN LIVE PRODUCTION APP
              </h3>
              <p className="mt-2 text-xs text-white leading-relaxed font-mono font-medium">
                Directly access the live Vercel deployment with SSL TLS 1.3, continuous CPCB telemetry, and interactive ML controls.
              </p>
            </div>

            <div className="mt-6">
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="brutal-btn w-full bg-coral text-ink font-black text-sm uppercase py-3.5 flex items-center justify-center gap-2 hover:bg-coral-hover shadow-[3px_3px_0_var(--paper)] transition-all cursor-pointer"
              >
                <span>LAUNCH VERCEL APP</span>
                <ExternalLink className="h-4 w-4 stroke-[2.5]" />
              </a>
              <div className="mt-2 text-center text-[11px] font-mono text-sun font-bold truncate">
                {liveUrl}
              </div>
            </div>
          </div>

          {/* Action 2: GitHub Repository */}
          <div className="border-[3px] border-ink bg-paper p-6 shadow-[5px_5px_0_var(--ink)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-black uppercase text-ink font-mono">
                  <Github className="h-4 w-4" />
                  GITHUB REPOSITORY
                </span>
                <span className="border border-ink bg-sun px-2 py-0.5 text-[10px] font-black text-ink uppercase">
                  117/117 TESTS PASSING
                </span>
              </div>

              <h3 className="mt-4 text-2xl font-black uppercase text-ink font-display">
                VIEW GITHUB / ManyaValecha
              </h3>
              <p className="mt-2 text-xs text-ink-soft leading-relaxed font-mono">
                Inspect complete source code, TypeScript 5.4 modules, AWS CDK stack definitions, and Vitest test suites.
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <a
                href={githubRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="brutal-btn w-full bg-night text-paper font-black text-sm uppercase py-3.5 flex items-center justify-center gap-2 hover:bg-ink shadow-[3px_3px_0_var(--ink)] transition-all cursor-pointer"
              >
                <span>OPEN REPOSITORY</span>
                <Github className="h-4 w-4 stroke-[2.5]" />
              </a>
              <a
                href={githubProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border-[2px] border-ink bg-paper-light px-3 py-1.5 text-[11px] font-bold text-ink uppercase flex items-center justify-center gap-1.5 hover:bg-paper transition-colors"
              >
                <span>VISIT DEVELOPER PROFILE: ManyaValecha</span>
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Action 3: Interactive Live Preview Toggle & Controls */}
          <div className="border-[3px] border-ink bg-paper-deep p-6 shadow-[5px_5px_0_var(--violet)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-black uppercase text-violet font-mono">
                  <Sparkles className="h-4 w-4" />
                  INTERACTIVE VIEWPORT
                </span>
                <span className="border border-ink bg-mint px-2 py-0.5 text-[10px] font-black text-ink uppercase">
                  EMBEDDED PREVIEW
                </span>
              </div>

              <h3 className="mt-4 text-2xl font-black uppercase text-ink font-display">
                EMBEDDED BROWSER PREVIEW
              </h3>
              <p className="mt-2 text-xs text-ink-soft leading-relaxed font-mono">
                Inspect the production Vercel application directly within this workspace, with device toggles and live reloading.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                className={`brutal-btn w-full font-black text-sm uppercase py-3.5 flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0_var(--ink)] ${
                  isPreviewOpen ? 'bg-sun text-ink' : 'bg-paper text-ink'
                }`}
              >
                <span>{isPreviewOpen ? 'COLLAPSE LIVE PREVIEW' : 'EXPAND LIVE PREVIEW'}</span>
                <Maximize2 className="h-4 w-4" />
              </button>
              <div className="flex items-center justify-between text-[11px] font-mono text-ink-soft pt-1">
                <span>SSL TLS 1.3 · HTTPS</span>
                <span>GLOBAL EDGE CACHE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Embedded Live Preview Window Frame (if expanded) */}
        {isPreviewOpen && (
          <div className="mt-8 border-[3px] border-ink bg-night shadow-[6px_6px_0_var(--ink)] overflow-hidden">
            {/* Browser Window Header Chrome */}
            <div className="flex flex-wrap items-center justify-between border-b-[3px] border-ink bg-paper px-4 py-3 gap-3">
              {/* Window Dots & Title */}
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border border-ink bg-coral" />
                <span className="h-3 w-3 rounded-full border border-ink bg-sun" />
                <span className="h-3 w-3 rounded-full border border-ink bg-mint" />
                <span className="ml-2 text-xs font-black uppercase tracking-wider text-ink font-display hidden sm:inline">
                  AERIS PRODUCTION WEB APPLICATION
                </span>
              </div>

              {/* URL Bar */}
              <div className="flex flex-1 max-w-md items-center border-[2px] border-ink bg-paper-light px-3 py-1 shadow-[2px_2px_0_var(--ink)] mx-2">
                <Globe className="h-3.5 w-3.5 text-mint mr-2 shrink-0" />
                <span className="text-xs font-mono font-bold text-ink truncate select-all">
                  {liveUrl}
                </span>
              </div>

              {/* Browser Actions */}
              <div className="flex items-center gap-2">
                {/* Viewport Width Switchers */}
                <div className="hidden md:flex items-center border-[2px] border-ink bg-paper-light p-0.5 text-[10px] font-bold">
                  <button
                    onClick={() => setPreviewViewport('desktop')}
                    className={`px-2 py-0.5 uppercase ${previewViewport === 'desktop' ? 'bg-ink text-paper' : 'text-ink'}`}
                  >
                    Desktop
                  </button>
                  <button
                    onClick={() => setPreviewViewport('tablet')}
                    className={`px-2 py-0.5 uppercase ${previewViewport === 'tablet' ? 'bg-ink text-paper' : 'text-ink'}`}
                  >
                    Tablet
                  </button>
                  <button
                    onClick={() => setPreviewViewport('mobile')}
                    className={`px-2 py-0.5 uppercase ${previewViewport === 'mobile' ? 'bg-ink text-paper' : 'text-ink'}`}
                  >
                    Mobile
                  </button>
                </div>

                <button
                  onClick={() => setIframeKey(k => k + 1)}
                  title="Reload Iframe"
                  className="p-1.5 border-[2px] border-ink bg-paper-light hover:bg-sun text-ink transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>

                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in new window"
                  className="p-1.5 border-[2px] border-ink bg-sun hover:bg-coral text-ink transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Iframe Viewport Container */}
            <div className="bg-[#121820] p-4 flex justify-center items-center min-h-[520px]">
              <div
                className={`transition-all duration-300 w-full overflow-hidden border-[2px] border-white/20 bg-paper ${
                  previewViewport === 'desktop'
                    ? 'max-w-full'
                    : previewViewport === 'tablet'
                    ? 'max-w-[768px]'
                    : 'max-w-[390px]'
                }`}
                style={{ height: '620px' }}
              >
                <iframe
                  key={iframeKey}
                  src={liveUrl}
                  title="AERIS Live Production App"
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Iframe Footer Info Bar */}
            <div className="border-t-[2px] border-white/20 bg-night px-4 py-2.5 flex flex-wrap items-center justify-between text-xs font-mono text-white gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-mint font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  LIVE DEPLOYMENT ACTIVE
                </span>
                <span className="hidden sm:inline text-white/90">Vercel Edge Network · Global Anycast DNS</span>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sun hover:underline font-bold flex items-center gap-1"
                >
                  <span>Open Fullscreen in New Window</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Deploy to GitHub & Vercel Command Center */}
        <div className="mt-8 border-[3px] border-ink bg-paper p-6 shadow-[5px_5px_0_var(--ink)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-[2px] border-ink/20 pb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center border-[2px] border-ink bg-sun text-ink shadow-[2px_2px_0_var(--ink)]">
                <Terminal className="h-4 w-4 stroke-[2.5]" />
              </span>
              <div>
                <h3 className="text-sm font-black uppercase text-ink font-display">
                  Full Application Deployment Pipeline (GitHub &amp; Vercel)
                </h3>
                <p className="text-[11px] font-mono text-ink-soft">
                  Automated CI/CD build scripts, vercel.json configurations &amp; git repository workflows
                </p>
              </div>
            </div>

            {/* Pipeline Tabs */}
            <div className="flex items-center border-[2px] border-ink bg-paper-light p-0.5">
              <button
                onClick={() => setActiveTab('vercel')}
                className={`px-3 py-1 text-xs font-black uppercase transition-all ${
                  activeTab === 'vercel' ? 'bg-coral text-ink shadow-[2px_2px_0_var(--ink)]' : 'text-ink-soft hover:text-ink'
                }`}
              >
                1. Vercel Deploy
              </button>
              <button
                onClick={() => setActiveTab('github')}
                className={`px-3 py-1 text-xs font-black uppercase transition-all ${
                  activeTab === 'github' ? 'bg-coral text-ink shadow-[2px_2px_0_var(--ink)]' : 'text-ink-soft hover:text-ink'
                }`}
              >
                2. GitHub Push
              </button>
              <button
                onClick={() => setActiveTab('aws')}
                className={`px-3 py-1 text-xs font-black uppercase transition-all ${
                  activeTab === 'aws' ? 'bg-coral text-ink shadow-[2px_2px_0_var(--ink)]' : 'text-ink-soft hover:text-ink'
                }`}
              >
                3. AWS CDK Stack
              </button>
            </div>
          </div>

          {/* Code Execution Strip */}
          <div className="mt-4 relative border-[2px] border-ink bg-night p-5 font-mono text-xs text-white shadow-[3px_3px_0_var(--ink)]">
            <button
              onClick={() => copyToClipboard(commands[activeTab], activeTab)}
              className="absolute top-3.5 right-3.5 flex items-center gap-1.5 border-[2px] border-white bg-white/20 px-3 py-1.5 text-xs font-black text-white hover:bg-white/30 transition-colors shadow-[2px_2px_0_rgba(255,255,255,0.4)] cursor-pointer"
            >
              {copiedCmd === activeTab ? (
                <>
                  <Check className="h-4 w-4 text-sun stroke-[3]" />
                  <span className="text-sun font-black">COPIED!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-white stroke-[2.5]" />
                  <span className="text-white font-black">COPY SCRIPT</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block h-2 w-2 rounded-full bg-sun animate-pulse" />
              <span className="text-xs uppercase text-sun font-black tracking-wider">
                BASH TERMINAL COMMAND · {activeTab.toUpperCase()} PIPELINE
              </span>
            </div>

            <pre className="whitespace-pre-wrap text-white font-bold text-sm sm:text-[15px] leading-relaxed overflow-x-auto bg-black/40 p-3.5 rounded border border-white/20 font-mono tracking-wide selection:bg-sun selection:text-ink">
              {commands[activeTab]}
            </pre>
          </div>

          {/* Verification Checklist */}
          <div className="mt-4 grid gap-3 sm:grid-cols-3 text-xs font-mono text-ink">
            <div className="flex items-center gap-2 border border-ink/20 bg-paper-light p-2.5">
              <CheckCircle2 className="h-4 w-4 text-mint shrink-0" />
              <span>
                <strong>vercel.json</strong> configured with SPA rewrites
              </span>
            </div>
            <div className="flex items-center gap-2 border border-ink/20 bg-paper-light p-2.5">
              <CheckCircle2 className="h-4 w-4 text-mint shrink-0" />
              <span>
                <strong>117/117</strong> Vitest unit &amp; regression tests passing
              </span>
            </div>
            <div className="flex items-center gap-2 border border-ink/20 bg-paper-light p-2.5">
              <CheckCircle2 className="h-4 w-4 text-mint shrink-0" />
              <span>
                <strong>GitHub</strong> synced to ManyaValecha/aeris
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
