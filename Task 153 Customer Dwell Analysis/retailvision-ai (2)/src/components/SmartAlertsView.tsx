import React, { useState } from 'react';
import { AlertTriangle, Bell, Check, Sliders, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { SmartAlert, ZoneMetric } from '../types';

interface SmartAlertsViewProps {
  alerts: SmartAlert[];
  zones: ZoneMetric[];
  onAcknowledgeAlert: (id: string) => void;
  onUpdateCapacity: (zoneId: string, limit: number) => void;
}

export const SmartAlertsView: React.FC<SmartAlertsViewProps> = ({
  alerts,
  zones,
  onAcknowledgeAlert,
  onUpdateCapacity
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const filteredAlerts = alerts.filter(a => filterSeverity === 'all' || a.severity === filterSeverity);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Smart Store Alerts & Threshold Manager</h2>
            <p className="text-xs text-slate-500">Automated Notification System for Overcrowding, Queue Spillover & Traffic Drops</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {(['all', 'critical', 'warning', 'info'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                filterSeverity === sev ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Alerts Feed (7 Cols) + Threshold Adjuster (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Alerts List (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-red-600" />
            <span>Active Store Telemetry Alerts ({filteredAlerts.length})</span>
          </h3>

          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No active alerts matching filter.</p>
            ) : (
              filteredAlerts.map(alt => (
                <div
                  key={alt.id}
                  className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                    alt.severity === 'critical'
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : alt.severity === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase text-slate-800">{alt.zoneName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{alt.timestamp}</span>
                    </div>
                    <p className="text-xs font-medium">{alt.message}</p>
                    <div className="text-[11px] opacity-80 pt-1 font-mono">
                      Current: <strong>{alt.currentValue}</strong> | Threshold: <strong>{alt.thresholdLimit}</strong>
                    </div>
                  </div>

                  {!alt.acknowledged ? (
                    <button
                      onClick={() => onAcknowledgeAlert(alt.id)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold border border-slate-300 text-slate-800 flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span>Acknowledge</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-green-800 bg-green-100 px-2.5 py-1 rounded-full border border-green-200 shrink-0">
                      RESOLVED
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Threshold Limits Adjuster Panel (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Zone Occupancy Alert Thresholds</span>
          </h3>

          <div className="space-y-4">
            {zones.map(z => (
              <div key={z.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800">{z.name}</span>
                  <span className="text-blue-600 font-mono">{z.capacityLimit} max occupancy</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={z.capacityLimit}
                  onChange={(e) => onUpdateCapacity(z.id, parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
