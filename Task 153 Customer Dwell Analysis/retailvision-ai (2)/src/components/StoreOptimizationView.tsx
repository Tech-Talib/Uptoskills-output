import React, { useState } from 'react';
import { Award, ArrowRight, ArrowUpRight, ShoppingCart, Sparkles, CheckCircle2 } from 'lucide-react';
import { OptimizationSuggestion } from '../types';

interface StoreOptimizationViewProps {
  suggestions: OptimizationSuggestion[];
}

export const StoreOptimizationView: React.FC<StoreOptimizationViewProps> = ({ suggestions }) => {
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string>(suggestions[0]?.id || 'opt-1');

  const selectedOpt = suggestions.find(s => s.id === selectedSuggestionId) || suggestions[0];

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex items-center gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">AI Store Optimization & Merchandise Placement</h2>
          <p className="text-xs text-slate-500">Maximize Shopper Conversion, Impulse Engagement & Cross-Selling Revenue</p>
        </div>
      </div>

      {/* Main Grid: Suggestions Cards List + Before vs Proposed Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Optimization Suggestions Cards (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>AI Layout Recommendations</span>
          </h3>

          <div className="space-y-3">
            {suggestions.map(opt => {
              const isSelected = opt.id === selectedSuggestionId;
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedSuggestionId(opt.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? 'bg-blue-50 border-blue-300 text-slate-900 shadow-sm'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-blue-700">{opt.title}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-800 border border-green-200 rounded">
                      {opt.projectedImpact}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">{opt.description}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-mono">
                    <span>Confidence: <strong className="text-slate-800">{Math.round(opt.confidenceScore * 100)}%</strong></span>
                    <span className="text-blue-600 font-medium hover:underline flex items-center gap-1 font-sans">
                      View Proposed Layout <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Before vs Proposed After Map (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800">Layout Modification Simulation</h3>
              </div>
              <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                Projected Lift: {selectedOpt.projectedImpact}
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200">
              {selectedOpt.description}
            </p>

            {/* Before vs After Visual Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Current Layout */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Current Location</span>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-800">
                  📍 {selectedOpt.currentPlacement}
                </div>
                <p className="text-[11px] text-slate-500">Low visibility or sub-optimal shopper pathway alignment.</p>
              </div>

              {/* Proposed Layout */}
              <div className="p-4 rounded-lg bg-slate-50 border border-green-200 space-y-2">
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider block">Proposed AI Location</span>
                <div className="p-3 bg-green-50 border border-green-300 rounded-lg text-xs font-semibold text-green-900">
                  ✨ {selectedOpt.proposedPlacement}
                </div>
                <p className="text-[11px] text-green-700 font-medium">Positioned directly inside peak shopper transition zone.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">AI Confidence Score: <strong className="text-slate-800 font-mono">{Math.round(selectedOpt.confidenceScore * 100)}%</strong></span>
            <button
              onClick={() => alert(`Layout modification task #${selectedOpt.id} dispatched to Store Operations Team!`)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              Approve & Deploy Layout Change
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
