import React, { useState } from 'react';
import { X, FileText, Download, CheckCircle, FileSpreadsheet, Printer } from 'lucide-react';
import { ZoneMetric } from '../types';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: ZoneMetric[];
  healthScore: number;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
  zones,
  healthScore
}) => {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [reportFormat, setReportFormat] = useState<'csv' | 'json' | 'summary'>('csv');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleDownloadReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          format: reportFormat,
          data: {
            totalVisitors: zones.reduce((acc, z) => acc + z.visitors, 0),
            healthScore,
            zones
          }
        })
      });

      if (reportFormat === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RetailVision_${reportType}_Report.csv`;
        a.click();
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RetailVision_${reportType}_Executive_Report.json`;
        a.click();
      }
    } catch (err) {
      console.error("Report generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 text-slate-800 shadow-xl relative space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-800">Export Store Analytics Report</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Scope Selector */}
        <div className="space-y-2">
          <label className="text-xs text-slate-500 font-semibold block">Report Frequency Scope:</label>
          <div className="grid grid-cols-3 gap-2">
            {(['daily', 'weekly', 'monthly'] as const).map(type => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`py-2 rounded-lg text-xs font-bold capitalize border transition-all ${
                  reportType === type ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {type} Summary
              </button>
            ))}
          </div>
        </div>

        {/* Format Selector */}
        <div className="space-y-2">
          <label className="text-xs text-slate-500 font-semibold block">Export Format:</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setReportFormat('csv')}
              className={`p-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                reportFormat === 'csv' ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <span>CSV Spreadsheet</span>
            </button>

            <button
              onClick={() => setReportFormat('json')}
              className={`p-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                reportFormat === 'json' ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-5 h-5 text-blue-600" />
              <span>JSON Dataset</span>
            </button>

            <button
              onClick={() => setReportFormat('summary')}
              className={`p-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                reportFormat === 'summary' ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Printer className="w-5 h-5 text-amber-500" />
              <span>Executive Brief</span>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900">
            Cancel
          </button>
          <button
            onClick={handleDownloadReport}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Generating File...' : 'Download Report File'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
