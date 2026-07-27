import React, { useState } from 'react';
import { LayoutGrid, Clock, Users, ShieldAlert, AlertTriangle, Sliders } from 'lucide-react';
import { ZoneMetric } from '../types';

interface ZoneAnalyticsViewProps {
  zones: ZoneMetric[];
  onUpdateZoneDwellLimit?: (zoneId: string, limitMinutes: number) => void;
}

export const ZoneAnalyticsView: React.FC<ZoneAnalyticsViewProps> = ({ zones, onUpdateZoneDwellLimit }) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [globalDwellLimit, setGlobalDwellLimit] = useState<number>(5);

  const totalStoreVisitors = zones.reduce((acc, z) => acc + z.visitors, 0);
  const totalOccupancy = zones.reduce((acc, z) => acc + z.currentOccupancy, 0);
  const avgStoreDwell = (zones.reduce((acc, z) => acc + z.avgDwellMinutes, 0) / zones.length).toFixed(1);
  const zonesExceedingDwellLimit = zones.filter(z => z.avgDwellMinutes > z.dwellTimeLimitMinutes);

  const handleApplyGlobalLimit = (limit: number) => {
    setGlobalDwellLimit(limit);
    if (onUpdateZoneDwellLimit) {
      zones.forEach(z => onUpdateZoneDwellLimit(z.id, limit));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Total Zone Footfall</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{totalStoreVisitors.toLocaleString()}</div>
          <span className="text-[11px] text-green-600 font-medium">↑ 12% vs yesterday</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Current In-Store People</span>
            <Users className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{totalOccupancy}</div>
          <span className="text-[11px] text-slate-500 font-medium">Across {zones.length} store zones</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Average Dwell Time</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{avgStoreDwell} min</div>
          <span className="text-[11px] text-slate-500 font-medium">High engagement</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Dwell Limit Status</span>
            <AlertTriangle className={`w-4 h-4 ${zonesExceedingDwellLimit.length > 0 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`} />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {zonesExceedingDwellLimit.length} <span className="text-sm font-normal text-slate-500">zones exceeded</span>
          </div>
          <span className={`text-[11px] font-medium ${zonesExceedingDwellLimit.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {zonesExceedingDwellLimit.length > 0 ? `${zonesExceedingDwellLimit.map(z => z.name.split(' ')[0]).join(', ')} over limit` : 'All zones within limits'}
          </span>
        </div>
      </div>

      {/* Dwell Limit Controls Bar */}
      <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100">Global Zone Dwell Time Threshold Limit</h4>
            <p className="text-xs text-slate-400">Trigger warnings & smart alerts when zone dwell time exceeds limit</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-800/80 p-2 rounded-lg border border-slate-700">
          <span className="text-xs text-slate-300 font-medium">Global Limit:</span>
          <div className="flex gap-1.5">
            {[3, 5, 8, 10, 15].map(limit => (
              <button
                key={limit}
                onClick={() => handleApplyGlobalLimit(limit)}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  globalDwellLimit === limit
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {limit}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Zone Metrics Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-800">Zone Breakdown & Dwell Limit Telemetry</h3>
          </div>
          <span className="text-xs text-slate-500">Real-time Telemetry</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Zone Name</th>
                <th className="py-3 px-4">Visitors</th>
                <th className="py-3 px-4">Avg Dwell</th>
                <th className="py-3 px-4">Dwell Limit Config</th>
                <th className="py-3 px-4">Dwell Limit Status</th>
                <th className="py-3 px-4">Current People</th>
                <th className="py-3 px-4">Capacity Gauge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {zones.map(zone => {
                const isOverCapacity = zone.currentOccupancy >= zone.capacityLimit;
                const capacityPct = Math.min(100, Math.round((zone.currentOccupancy / zone.capacityLimit) * 100));
                const isDwellExceeded = zone.avgDwellMinutes > zone.dwellTimeLimitMinutes;
                const dwellPct = Math.min(100, Math.round((zone.avgDwellMinutes / Math.max(0.1, zone.dwellTimeLimitMinutes)) * 100));

                return (
                  <tr
                    key={zone.id}
                    onClick={() => setSelectedZoneId(selectedZoneId === zone.id ? null : zone.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors text-slate-800"
                  >
                    <td className="py-3.5 px-4 font-bold flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: zone.color }} />
                      <span className="text-slate-800 font-semibold text-sm">{zone.name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">{zone.visitors}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">{zone.avgDwellMinutes} min</td>
                    
                    {/* Dwell Limit Config Cell */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={30}
                          step={0.5}
                          value={zone.dwellTimeLimitMinutes}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 1;
                            onUpdateZoneDwellLimit?.(zone.id, val);
                          }}
                          className="w-16 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 font-mono font-bold text-slate-800"
                        />
                        <span className="text-slate-500 text-[11px]">min limit</span>
                      </div>
                    </td>

                    {/* Dwell Limit Status Cell */}
                    <td className="py-3.5 px-4">
                      <div className="w-36 space-y-1">
                        <div className="flex justify-between text-[10px] font-medium">
                          <span className={isDwellExceeded ? 'text-red-600 font-bold' : 'text-slate-600'}>
                            {zone.avgDwellMinutes}m / {zone.dwellTimeLimitMinutes}m
                          </span>
                          {isDwellExceeded ? (
                            <span className="text-[9px] font-bold bg-red-100 text-red-700 border border-red-200 px-1 rounded flex items-center gap-0.5">
                              ⚠️ EXCEEDED
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 rounded">
                              OK
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isDwellExceeded ? 'bg-red-500' : dwellPct > 80 ? 'bg-amber-400' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${dwellPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold font-mono text-green-600">{zone.currentOccupancy}</td>
                    
                    <td className="py-3.5 px-4">
                      <div className="w-32 space-y-1">
                        <div className="flex justify-between text-[10px] font-medium">
                          <span className={isOverCapacity ? 'text-red-600 font-bold' : 'text-slate-500'}>
                            {capacityPct}% ({zone.currentOccupancy}/{zone.capacityLimit})
                          </span>
                          {isOverCapacity && (
                            <span className="text-[9px] font-bold bg-red-50 text-red-700 border border-red-200 px-1 rounded">
                              CAPACITY EXCEEDED
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isOverCapacity ? 'bg-red-500' : capacityPct > 80 ? 'bg-amber-400' : 'bg-green-500'
                            }`}
                            style={{ width: `${capacityPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
