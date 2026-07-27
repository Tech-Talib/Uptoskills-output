import React, { useState } from 'react';
import { BarChart3, TrendingUp, Clock, Calendar, PieChart, Layers, Activity } from 'lucide-react';
import { ZoneMetric } from '../types';

interface DashboardAnalyticsViewProps {
  zones: ZoneMetric[];
}

export const DashboardAnalyticsView: React.FC<DashboardAnalyticsViewProps> = ({ zones }) => {
  const [selectedMetric, setSelectedMetric] = useState<'visitors' | 'dwell' | 'occupancy'>('visitors');

  // Max visitors for chart scaling
  const maxVisitors = Math.max(...zones.map(z => z.visitors), 1);
  const maxDwell = Math.max(...zones.map(z => z.avgDwellMinutes), 1);

  // Peak hourly traffic data
  const hourlyTraffic = [
    { hour: '9 AM', count: 42 },
    { hour: '10 AM', count: 98 },
    { hour: '11 AM', count: 142 },
    { hour: '12 PM', count: 185 },
    { hour: '1 PM', count: 160 },
    { hour: '2 PM', count: 130 },
    { hour: '3 PM', count: 155 },
    { hour: '4 PM', count: 210 },
    { hour: '5 PM', count: 265 },
    { hour: '6 PM', count: 290 },
    { hour: '7 PM', count: 240 },
    { hour: '8 PM', count: 150 }
  ];
  const maxHourlyCount = Math.max(...hourlyTraffic.map(h => h.count));

  // 30-Day Calendar Heatmap Mock Data
  const calendarDays = Array.from({ length: 28 }, (_, i) => ({
    day: i + 1,
    traffic: Math.floor(200 + Math.sin(i * 0.8) * 150 + Math.random() * 80)
  }));

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Interactive Retail Dashboard Analytics</h2>
            <p className="text-xs text-slate-500">Comprehensive Visual Intelligence & Distribution Trends</p>
          </div>
        </div>
      </div>

      {/* Row 1: Visitors by Zone (Bar Chart) + Average Stay Time (Horizontal Bar Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitors by Zone */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-800">Visitors by Zone</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Total Footfall</span>
          </div>

          <div className="space-y-3">
            {zones.map(z => {
              const widthPct = Math.round((z.visitors / maxVisitors) * 100);
              return (
                <div key={z.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{z.name}</span>
                    <span className="font-mono font-bold text-blue-600">{z.visitors} visitors</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${widthPct}%`, backgroundColor: z.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Average Stay Time (Horizontal Bar Chart) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-800">Average Stay Time per Zone</h3>
            </div>
            <span className="text-xs text-blue-600 font-semibold">In Minutes</span>
          </div>

          <div className="space-y-3">
            {zones.map(z => {
              const widthPct = Math.round((z.avgDwellMinutes / maxDwell) * 100);
              return (
                <div key={z.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{z.name}</span>
                    <span className="font-mono font-bold text-blue-600">{z.avgDwellMinutes} mins</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-700"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Peak Hour Traffic (Hourly Bar) + Customer Distribution Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Peak Graph (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-sm text-slate-800">Hourly Peak Traffic Curve</h3>
            </div>
            <span className="text-xs text-green-600 font-semibold">Peak: 6:00 PM (290)</span>
          </div>

          <div className="h-48 flex items-end gap-2 pt-4 px-2 bg-slate-50 rounded-lg border border-slate-200">
            {hourlyTraffic.map((ht, idx) => {
              const heightPct = Math.round((ht.count / maxHourlyCount) * 100);
              const isPeak = ht.count === maxHourlyCount;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                    {ht.count}
                  </span>
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      isPeak ? 'bg-green-500 shadow-sm' : 'bg-slate-300 group-hover:bg-blue-600'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] text-slate-500 font-medium whitespace-nowrap">{ht.hour}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Distribution Donut (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-800">Customer Distribution</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">% Share</span>
          </div>

          <div className="space-y-2.5">
            {zones.map(z => {
              const totalVisitors = zones.reduce((acc, x) => acc + x.visitors, 0);
              const share = Math.round((z.visitors / totalVisitors) * 100);
              return (
                <div key={z.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: z.color }} />
                    <span className="font-medium text-slate-700">{z.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">{share}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: 30-Day Calendar Traffic Heatmap */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-800">Monthly Store Traffic Density Grid</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Past 28 Days</span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((d) => {
            const intensity = d.traffic > 350 ? 'bg-blue-600 text-white' : d.traffic > 250 ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200';
            return (
              <div
                key={d.day}
                className={`p-3 rounded-lg border text-center ${intensity} hover:scale-105 transition-transform cursor-pointer`}
              >
                <span className="text-[10px] opacity-75 block">Day {d.day}</span>
                <span className="text-xs font-bold font-mono">{d.traffic}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
