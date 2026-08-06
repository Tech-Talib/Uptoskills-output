import React, { useState } from 'react';
import { Route as RouteIcon, ArrowRight, Compass, Clock, MapPin, Footprints, Layers } from 'lucide-react';
import { CustomerRoute } from '../types';

interface JourneyViewProps {
  routes: CustomerRoute[];
}

export const JourneyView: React.FC<JourneyViewProps> = ({ routes }) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || 'route-1');

  const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0];

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex items-center gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg">
          <RouteIcon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Customer Journey & Sequence Mapping</h2>
          <p className="text-xs text-slate-500">Track Sequential Pathways, Transition Friction & Shopping Duration</p>
        </div>
      </div>

      {/* Top 4 Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 mb-1 font-medium">Most Common Route</div>
          <div className="text-lg font-bold text-blue-600 truncate">Groceries → Bakery → Billing</div>
          <span className="text-[11px] text-blue-700 font-semibold">38% of total visitors</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 mb-1 font-medium">Least Visited Route</div>
          <div className="text-lg font-bold text-slate-800 truncate">Electronics → Exit (Browse)</div>
          <span className="text-[11px] text-amber-600 font-semibold">7% bounce rate</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 mb-1 font-medium">Average Path Length</div>
          <div className="text-2xl font-bold font-mono text-slate-900">85 meters</div>
          <span className="text-[11px] text-slate-500">Optimal store circulation</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 mb-1 font-medium">Avg Total Shopping Duration</div>
          <div className="text-2xl font-bold font-mono text-green-600">16.4 mins</div>
          <span className="text-[11px] text-green-600 font-medium">↑ 2.1 mins YoY</span>
        </div>
      </div>

      {/* Main Flow Diagram + Route Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Route Selector List (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-600" />
            <span>Common Journey Archetypes</span>
          </h3>

          <div className="space-y-2.5">
            {routes.map(r => {
              const isSelected = r.id === selectedRouteId;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRouteId(r.id)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-blue-300 text-slate-900 shadow-sm'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-blue-700">{r.pathName}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                      {r.percentage}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Duration: <strong className="text-slate-800">{r.avgDurationMinutes} mins</strong></span>
                    <span>Path: <strong className="text-slate-800">{r.avgPathLengthMeters}m</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Path Visualizer Diagram (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <Footprints className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800">Sequential Flow Node Diagram</h3>
              </div>
              <span className="text-xs text-blue-600 font-bold">{selectedRoute.percentage}% Traffic Share</span>
            </div>

            {/* Sequence Flow Nodes */}
            <div className="flex flex-col gap-4 my-4">
              {selectedRoute.sequence.map((stepName, idx) => (
                <React.Fragment key={idx}>
                  <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-sm text-slate-800">{stepName}</span>
                      <span className="block text-[11px] text-slate-500">
                        {idx === 0 ? 'Entry Gate' : idx === selectedRoute.sequence.length - 1 ? 'Exit Turnstile' : 'Dwell & Browse'}
                      </span>
                    </div>
                  </div>

                  {idx < selectedRoute.sequence.length - 1 && (
                    <div className="flex justify-center my-[-8px]">
                      <ArrowRight className="w-5 h-5 text-blue-500 rotate-90" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between font-medium">
            <span>Average Route Duration: <strong className="text-slate-800 font-mono">{selectedRoute.avgDurationMinutes} mins</strong></span>
            <span>Total Path Length: <strong className="text-slate-800 font-mono">{selectedRoute.avgPathLengthMeters} meters</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
