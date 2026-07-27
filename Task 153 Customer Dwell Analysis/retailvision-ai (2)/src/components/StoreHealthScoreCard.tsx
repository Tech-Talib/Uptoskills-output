import React from 'react';
import { Activity, CheckCircle2, AlertCircle, TrendingUp, ShieldCheck } from 'lucide-react';
import { StoreHealthBreakdown } from '../types';

interface StoreHealthScoreCardProps {
  health: StoreHealthBreakdown;
  onExploreInsights?: () => void;
}

export const StoreHealthScoreCard: React.FC<StoreHealthScoreCardProps> = ({
  health,
  onExploreInsights
}) => {
  return (
    <div className="bg-white border border-slate-200 border-l-4 border-l-blue-600 rounded-xl p-6 text-slate-800 shadow-sm">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        {/* Score Gauge Block */}
        <div className="flex items-center gap-5">
          <div className="relative w-24 h-24 flex items-center justify-center rounded-xl bg-blue-50 border border-blue-200 shadow-sm">
            <div className="text-center">
              <span className="text-3xl font-extrabold text-blue-600 block tracking-tight font-mono">
                {health.overallScore}
              </span>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                / 100
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-800">Today's Store Health Score</h3>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200">
                {health.ratingLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-md">
              Calculated using weighted metrics across customer flow, queue times, dwell balance, and congestion risk.
            </p>
          </div>
        </div>

        {/* Action button */}
        {onExploreInsights && (
          <button
            onClick={onExploreInsights}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-blue-600 border border-slate-200 text-xs font-semibold transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            <span>AI Executive Analysis</span>
          </button>
        )}
      </div>

      {/* Factor Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
        {health.factors.map((factor, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                {factor.status === 'good' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <span className="text-xs font-semibold text-slate-800">{factor.name}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{factor.details}</p>
            </div>
            <div className="text-right shrink-0">
              <span className={`text-sm font-bold font-mono ${factor.score >= 85 ? 'text-green-600' : 'text-amber-600'}`}>
                {factor.score}%
              </span>
              <span className="block text-[9px] text-slate-400">w: {factor.weight}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
