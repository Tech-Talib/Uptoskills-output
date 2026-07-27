import React, { useState } from 'react';
import {
  Eye,
  Video,
  BarChart3,
  Flame,
  Route,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  LayoutGrid,
  FileText,
  Bell,
  Settings,
  Activity,
  Award
} from 'lucide-react';
import { SmartAlert } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  healthScore: number;
  alerts: SmartAlert[];
  onOpenReports: () => void;
  onOpenSettings: () => void;
  isProcessingVideo: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  healthScore,
  alerts,
  onOpenReports,
  onOpenSettings,
  isProcessingVideo
}) => {
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

  const tabs = [
    { id: 'video', label: 'CCTV Video & Tracking', icon: Video },
    { id: 'zones', label: 'Zone Analytics', icon: LayoutGrid },
    { id: 'heatmap', label: 'Thermal Heatmap', icon: Flame },
    { id: 'journey', label: 'Customer Journey', icon: Route },
    { id: 'dashboard', label: 'Dashboard Charts', icon: BarChart3 },
    { id: 'insights', label: 'AI Insights & Chat', icon: Sparkles, badge: 'AI' },
    { id: 'predictive', label: 'Predictive Models', icon: TrendingUp },
    { id: 'optimization', label: 'Store Optimization', icon: Award },
    { id: 'layout_designer', label: 'Layout Designer', icon: Settings }
  ];

  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-40 shadow-sm">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('video')}>
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-sm flex items-center justify-center">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-slate-800 font-sans">
                RetailVision <span className="text-blue-600">AI</span>
              </span>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                v2.0 Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Retail Intelligence & Customer Behavior Analytics Platform
            </p>
          </div>
        </div>

        {/* Center / Right Control Cluster */}
        <div className="flex items-center gap-3">
          {/* Live Processing Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-xs font-semibold text-green-700 uppercase">
            <span className={`w-2 h-2 rounded-full ${isProcessingVideo ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isProcessingVideo ? 'Live: 4 Cameras Active' : 'Feed Paused'}</span>
          </div>

          {/* Health Score Pill */}
          <div 
            onClick={() => setActiveTab('insights')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 cursor-pointer transition-all"
            title="Click to view Store Health Score breakdown"
          >
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-slate-500 hidden md:inline">Store Health:</span>
            <span className="text-sm font-bold text-slate-800">{healthScore}/100</span>
          </div>

          {/* Smart Alerts Badge */}
          <div className="relative">
            <button
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 relative"
              aria-label="Toggle alerts notification"
            >
              <Bell className="w-5 h-5" />
              {unacknowledgedAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unacknowledgedAlerts.length}
                </span>
              )}
            </button>

            {/* Alerts Dropdown Popup */}
            {showAlertsDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-sm text-slate-800">Smart Store Alerts</span>
                  </div>
                  <button 
                    onClick={() => { setActiveTab('insights'); setShowAlertsDropdown(false); }}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-2 mt-3 max-h-64 overflow-y-auto pr-1">
                  {alerts.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No active store alerts.</p>
                  ) : (
                    alerts.slice(0, 4).map(alert => (
                      <div 
                        key={alert.id}
                        className={`p-2.5 rounded-lg border text-xs ${
                          alert.severity === 'critical'
                            ? 'bg-red-50 border-red-200 text-red-800'
                            : alert.severity === 'warning'
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold mb-1">
                          <span>{alert.zoneName}</span>
                          <span className="text-[10px] opacity-75">{alert.timestamp}</span>
                        </div>
                        <p className="line-clamp-2">{alert.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Export Reports Button */}
          <button
            onClick={onOpenReports}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition-all"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Export Report</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation Row */}
      <div className="border-t border-slate-200 bg-slate-50/80 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 py-1.5">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-blue-600 border border-slate-200 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.2 text-[9px] font-bold bg-blue-600 text-white rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
