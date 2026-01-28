
import React from 'react';
import { EvaluationResult, Verdict } from '../types';

interface VerdictCardProps {
  result: EvaluationResult;
  onReset: () => void;
}

const VerdictCard: React.FC<VerdictCardProps> = ({ result, onReset }) => {
  // Defensive logic: Normalize score if it's > 1 (e.g., 85 instead of 0.85)
  const normalizedExecutionScore = result.execution_score > 1 
    ? result.execution_score / 100 
    : result.execution_score;

  const isPass = result.verdict === Verdict.PASS;
  const isFail = result.verdict === Verdict.FAIL;
  
  const getVerdictStyles = () => {
    switch(result.verdict) {
      case Verdict.PASS: return 'text-green-500 pass-glow border-green-500';
      case Verdict.FAIL: return 'text-red-500 fail-glow border-red-500';
      case Verdict.CONDITIONAL: return 'text-yellow-500 conditional-glow border-yellow-500';
      default: return 'text-white border-white';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className={`border-4 p-8 bg-zinc-900 ${getVerdictStyles().split(' ').pop()} transition-all shadow-[12px_12px_0px_0px_currentColor]`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xs uppercase font-black tracking-widest mb-2 opacity-60">System Verdict</h2>
            <h1 className={`text-7xl md:text-9xl font-black tracking-tighter ${getVerdictStyles().split(' ').shift()}`}>
              {result.verdict}
            </h1>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-xs uppercase font-bold tracking-widest opacity-60">Autonomy Score</span>
            <span className="text-5xl font-black mono">{(normalizedExecutionScore * 100).toFixed(1)}%</span>
          </div>
        </div>

        <div className="mt-8 border-t border-white/20 pt-6 space-y-4">
          <p className="text-lg leading-relaxed font-medium">
            {result.rationale}
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {Object.entries(result.signals).map(([key, val]) => {
              // Normalize individual signals too
              const signalVal = (val as number) > 1 ? (val as number) / 100 : (val as number);
              return (
                <div key={key} className="bg-black/40 p-3 border border-white/10">
                  <div className="text-[10px] uppercase font-bold opacity-50 mb-1">{key.replace('_', ' ')}</div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-white transition-all duration-1000" style={{ width: `${signalVal * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border-2 border-white p-6 bg-zinc-900 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest border-b border-white/20 pb-2">Fail Modes / Risks</h3>
          <ul className="space-y-2">
            {result.fail_modes.length > 0 ? (
              result.fail_modes.map((mode, i) => (
                <li key={i} className="flex items-start gap-2 text-red-400 font-bold mono text-sm">
                  <span className="mt-1">✖</span> {mode}
                </li>
              ))
            ) : (
              <li className="text-green-400 font-bold mono text-sm">NO CRITICAL FAIL MODES DETECTED</li>
            )}
          </ul>
        </div>

        <div className="border-2 border-white p-6 bg-zinc-900 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest border-b border-white/20 pb-2">Calibration Notes</h3>
          <p className="mono text-xs text-zinc-400 leading-loose">
            {result.calibration_notes}
          </p>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button 
          onClick={onReset}
          className="px-12 py-4 border-2 border-white text-white uppercase font-black hover:bg-white hover:text-black transition-all"
        >
          NEW EVALUATION
        </button>
      </div>
    </div>
  );
};

export default VerdictCard;
