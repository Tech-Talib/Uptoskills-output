import React, { useState } from 'react';
import { TrendingUp, Cpu, Users, ShieldAlert, UserCheck, Activity } from 'lucide-react';
import { PredictiveDataPoint, PredictiveModelType } from '../types';

interface PredictiveAnalyticsViewProps {
  predictiveData: PredictiveDataPoint[];
}

export const PredictiveAnalyticsView: React.FC<PredictiveAnalyticsViewProps> = ({ predictiveData }) => {
  const [selectedModel, setSelectedModel] = useState<PredictiveModelType>('Prophet');

  const models: { id: PredictiveModelType; name: string; accuracy: string; desc: string }[] = [
    { id: 'Prophet', name: 'Facebook Prophet', accuracy: '94.2%', desc: 'Ideal for daily/weekly seasonal footfall forecasting' },
    { id: 'LSTM', name: 'Deep Learning LSTM', accuracy: '96.5%', desc: 'Recurrent Neural Net for non-linear temporal sequence modeling' },
    { id: 'XGBoost', name: 'XGBoost Regressor', accuracy: '95.8%', desc: 'Gradient boosted decision trees for multi-feature store telemetry' },
    { id: 'LightGBM', name: 'LightGBM Engine', accuracy: '95.1%', desc: 'High-speed leaf-wise tree growth model for edge deployment' }
  ];

  const maxTraffic = Math.max(...predictiveData.map(p => Math.max(p.actualTraffic || 0, p.predictedTraffic)));

  return (
    <div className="space-y-6">
      {/* Header & Model Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Predictive Machine Learning & Footfall Forecasting</h2>
            <p className="text-xs text-slate-500">Forecast Tomorrow's Traffic, Peak Hours, Congestion Risk & Staff Shift Requirements</p>
          </div>
        </div>

        {/* Model Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-lg border border-slate-200 overflow-x-auto max-w-full">
          {models.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedModel(m.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                selectedModel === m.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m.id} ({m.accuracy})
            </button>
          ))}
        </div>
      </div>

      {/* Model Specs Pill */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700 font-medium">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-600" />
          <span>Active Predictive Architecture: <strong>{models.find(m => m.id === selectedModel)?.name}</strong></span>
        </div>
        <span className="text-slate-500 text-[11px] hidden sm:inline">{models.find(m => m.id === selectedModel)?.desc}</span>
      </div>

      {/* Predictive Traffic Curve Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-800">Tomorrow's Forecasted Hourly Traffic Curve</h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Actual (Today)
            </span>
            <span className="flex items-center gap-1 text-blue-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Predicted (Tomorrow)
            </span>
          </div>
        </div>

        <div className="h-56 flex items-end gap-2 pt-6 px-2 bg-slate-50 rounded-lg border border-slate-200">
          {predictiveData.map((pt, idx) => {
            const heightPct = Math.round((pt.predictedTraffic / maxTraffic) * 100);
            const actualPct = pt.actualTraffic ? Math.round((pt.actualTraffic / maxTraffic) * 100) : 0;
            const isCongested = pt.congestionProbability > 80;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="text-[9px] font-mono text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  {pt.predictedTraffic}
                </span>

                <div className="w-full flex items-end justify-center gap-1 h-full">
                  {/* Actual bar if available */}
                  {pt.actualTraffic && (
                    <div
                      className="w-1/2 bg-slate-300 rounded-t-sm"
                      style={{ height: `${actualPct}%` }}
                      title={`Actual: ${pt.actualTraffic}`}
                    />
                  )}
                  {/* Predicted bar */}
                  <div
                    className={`w-1/2 rounded-t-sm transition-all duration-500 ${
                      isCongested ? 'bg-red-500' : 'bg-blue-600'
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={`Predicted: ${pt.predictedTraffic}, Congestion: ${pt.congestionProbability}%`}
                  />
                </div>

                <span className="text-[9px] text-slate-500 font-medium whitespace-nowrap">{pt.timeLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Staff Allocation & Congestion Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-800">Recommended Staffing & Queue Risk Schedule</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">AI Shift Optimization</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <th className="py-2.5 px-3">Time Window</th>
                <th className="py-2.5 px-3">Forecasted Footfall</th>
                <th className="py-2.5 px-3">Congestion Risk</th>
                <th className="py-2.5 px-3">Expected Queue Line</th>
                <th className="py-2.5 px-3">Recommended Staffing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {predictiveData.map((pt, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{pt.timeLabel}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{pt.predictedTraffic} shoppers</td>
                  <td className="py-2.5 px-3 font-bold">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      pt.congestionProbability > 80
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : pt.congestionProbability > 50
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      {pt.congestionProbability}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">{pt.expectedQueueLength} shoppers in line</td>
                  <td className="py-2.5 px-3 font-bold text-green-600">{pt.recommendedStaff} active cashiers/assistants</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
