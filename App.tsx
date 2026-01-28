
import React, { useState } from 'react';
import InputForm from './components/InputForm';
import VerdictCard from './components/VerdictCard';
import { CandidateInputs, EvaluationResult, GitHubData } from './types';
import { fetchGitHubData } from './services/githubService';
import { evaluateCandidate } from './services/groqService';

type EvalPhase = 'IDLE' | 'GITHUB_SCAN' | 'AI_INFERENCE' | 'FINALIZING';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<EvalPhase>('IDLE');
  const [result, setResult] = useState<EvaluationResult | null>(null);

  const getCacheKey = (inputs: CandidateInputs) => {
    const safeStr = (inputs.githubUrl + inputs.roleContext + inputs.resumeText.substring(0, 30)).replace(/[^a-zA-Z0-9]/g, '');
    return `eval_v2_${safeStr}`;
  };

  const handleEvaluate = async (inputs: CandidateInputs) => {
    setLoading(true);
    setResult(null);

    const cacheKey = getCacheKey(inputs);
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      setResult(JSON.parse(cached));
      setLoading(false);
      return;
    }

    try {
      console.log("Starting evaluation for:", inputs.roleContext);
      setPhase('GITHUB_SCAN');
      const githubData = await fetchGitHubData(inputs.githubUrl);
      console.log("GitHub data fetched:", githubData ? "Success" : "None/Failed");

      setPhase('AI_INFERENCE');
      console.log("Starting Groq inference...");
      const evalResult = await evaluateCandidate(inputs, githubData);
      console.log("Groq inference complete:", evalResult.verdict);

      setPhase('FINALIZING');
      localStorage.setItem(cacheKey, JSON.stringify(evalResult));
      setResult(evalResult);
    } catch (error) {
      console.error("Evaluation error:", error);
      alert("Autonomy Gate encountered a terminal error. Check console for details.");
    } finally {
      setLoading(false);
      setPhase('IDLE');
    }
  };

  const reset = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 selection:bg-white selection:text-black">
      <header className="max-w-6xl mx-auto mb-16 flex flex-col md:flex-row justify-between items-end gap-4 border-b-4 border-white pb-8">
        <div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
            AUTONOMY GATE <span className="text-zinc-500 text-3xl md:text-4xl">v3.7</span>
          </h1>
          <p className="mt-4 text-xs uppercase font-bold tracking-[0.5em] text-zinc-400">
            TESLA-LEVEL CANDIDATE VALIDATION SYSTEM
          </p>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-[10px] font-black tracking-widest uppercase mb-1">Status</div>
          <div className="flex items-center gap-2 justify-end">
            <div className={`h-2 w-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-sm font-bold mono">{loading ? phase : 'SYSTEMS_READY'}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {!result ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-4 space-y-6">
              <div className="p-6 border-l-4 border-white bg-zinc-900/50">
                <h2 className="font-black text-xl uppercase mb-2">Autonomous Context</h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Engine v3.7 <span className="text-white">autonomously discovers target roles</span>. No manual selection required. The engine maps evidence to career intent instantly.
                </p>
              </div>
              <div className="p-6 border-l-4 border-zinc-700 bg-zinc-900/20">
                <h2 className="font-black text-xs uppercase tracking-widest mb-4 opacity-50">Operation Log</h2>
                <ul className="space-y-3 text-xs mono uppercase">
                  <li className={phase === 'GITHUB_SCAN' ? 'text-white font-bold' : 'opacity-30'}>&gt; GitHub Data Ingestion</li>
                  <li className={phase === 'AI_INFERENCE' ? 'text-white font-bold' : 'opacity-30'}>&gt; Signal Weighting</li>
                  <li className={phase === 'FINALIZING' ? 'text-white font-bold' : 'opacity-30'}>&gt; Verdict Mapping</li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-8">
              <InputForm onSubmit={handleEvaluate} isLoading={loading} />
              {loading && (
                <div className="mt-8 p-4 border-2 border-dashed border-white/20 text-center mono text-xs uppercase tracking-widest animate-pulse">
                  Processing signals... [Phase: {phase.replace('_', ' ')}]
                </div>
              )}
            </div>
          </div>
        ) : (
          <VerdictCard result={result} onReset={reset} />
        )}
      </main>

      <footer className="max-w-6xl mx-auto mt-24 py-8 border-t border-white/10 flex flex-col md:flex-row justify-between text-[10px] font-bold tracking-widest text-zinc-600 uppercase">
        <div>Proprietary Evaluation Model 3.7.0 (AUTONOMOUS)</div>
        <div>Minimal Data Retention Policy</div>
        <div>No dashboards. Only winners.</div>
      </footer>
    </div>
  );
};

export default App;
