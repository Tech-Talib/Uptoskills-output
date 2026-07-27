import React, { useState, useEffect, useRef } from 'react';
import { Flame, Play, Pause, AlertOctagon, HelpCircle, Layers, Calendar, Clock } from 'lucide-react';
import { HeatmapPoint, ZoneMetric } from '../types';

interface HeatmapViewProps {
  heatmapPoints: HeatmapPoint[];
  zones: ZoneMetric[];
}

export const HeatmapView: React.FC<HeatmapViewProps> = ({ heatmapPoints, zones }) => {
  const [timeMode, setTimeMode] = useState<'hourly' | 'daily' | 'weekly'>('daily');
  const [hourIndex, setHourIndex] = useState(10); // 10 AM
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDeadZones, setShowDeadZones] = useState(true);
  const [showBottlenecks, setShowBottlenecks] = useState(true);
  const [showHotShelves, setShowHotShelves] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Time scrubber auto-play
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setHourIndex(prev => (prev >= 21 ? 9 : prev + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Render Canvas Thermal Heatmap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Store Floorplan Background Grid
    ctx.fillStyle = '#090d16'; // deep dark navy
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Floorplan Zones Outlines
    zones.forEach(z => {
      let xRatio = 0, yRatio = 0, wRatio = 0, hRatio = 0;
      if (z.id === 'groceries') { xRatio = 0.05; yRatio = 0.05; wRatio = 0.40; hRatio = 0.42; }
      else if (z.id === 'bakery') { xRatio = 0.48; yRatio = 0.05; wRatio = 0.22; hRatio = 0.42; }
      else if (z.id === 'electronics') { xRatio = 0.73; yRatio = 0.05; wRatio = 0.22; hRatio = 0.42; }
      else if (z.id === 'apparel') { xRatio = 0.05; yRatio = 0.55; wRatio = 0.35; hRatio = 0.38; }
      else if (z.id === 'beverages') { xRatio = 0.43; yRatio = 0.55; wRatio = 0.25; hRatio = 0.38; }
      else if (z.id === 'billing') { xRatio = 0.71; yRatio = 0.55; wRatio = 0.24; hRatio = 0.38; }

      const zX = xRatio * canvas.width;
      const zY = yRatio * canvas.height;
      const zW = wRatio * canvas.width;
      const zH = hRatio * canvas.height;

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.strokeRect(zX, zY, zW, zH);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(z.name, zX + 10, zY + 20);
    });

    // 2. Draw Thermal Heat Circles with Radial Gradients
    const timeMultiplier = (hourIndex >= 17 && hourIndex <= 20) ? 1.3 : 1.0; // peak evening multiplier

    heatmapPoints.forEach(pt => {
      const cx = (pt.x / 100) * canvas.width;
      const cy = (pt.y / 100) * canvas.height;
      const intensity = Math.min(1.0, pt.intensity * timeMultiplier);
      const radius = 60 * intensity;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);

      if (intensity > 0.8) {
        // Red - Hotspot / Bottleneck
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
        grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.5)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      } else if (intensity > 0.5) {
        // Yellow/Green - Busy
        grad.addColorStop(0, 'rgba(234, 179, 8, 0.7)');
        grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.4)');
        grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
      } else {
        // Blue - Low Traffic / Dead zone
        grad.addColorStop(0, 'rgba(59, 130, 246, 0.6)');
        grad.addColorStop(0.6, 'rgba(147, 51, 234, 0.3)');
        grad.addColorStop(1, 'rgba(59, 130, 246, 0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Manager Annotations (Bottlenecks & Dead Zones)
    if (showBottlenecks) {
      // Billing Queue Bottleneck
      const bx = (80 / 100) * canvas.width;
      const by = (80 / 100) * canvas.height;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(bx, by, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('⚠️ BOTTLENECK: Billing Queue', bx - 70, by - 16);
    }

    if (showHotShelves) {
      // Grocery Fresh Shelf
      const gx = (22 / 100) * canvas.width;
      const gy = (30 / 100) * canvas.height;
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('🔥 BUSY SHELF: Fresh Organic', gx - 50, gy - 16);
    }

    if (showDeadZones) {
      // Apparel Back Shelf
      const ax = (18 / 100) * canvas.width;
      const ay = (75 / 100) * canvas.height;
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('❄️ DEAD ZONE: Low Traffic Aisle', ax - 50, ay + 20);
    }

  }, [heatmapPoints, hourIndex, timeMode, showBottlenecks, showDeadZones, showHotShelves, zones]);

  return (
    <div className="space-y-6">
      {/* Header & Mode Selectors */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Spatial Traffic & Dwell Thermal Heatmap</h2>
            <p className="text-xs text-slate-500">Identify High-Density Hotspots, Friction Bottlenecks & Dead Zones</p>
          </div>
        </div>

        {/* Time Mode Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {(['hourly', 'daily', 'weekly'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setTimeMode(mode)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                timeMode === mode ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {mode} Heatmap
            </button>
          ))}
        </div>
      </div>

      {/* Main Heatmap Canvas Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        {/* Canvas & Legend Overlay */}
        <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
          <canvas
            ref={canvasRef}
            width={800}
            height={450}
            className="w-full h-full object-contain"
          />

          {/* Color Spectrum Legend */}
          <div className="absolute bottom-4 left-4 p-3 bg-black/75 backdrop-blur border border-white/20 rounded-lg text-xs space-y-2 text-white">
            <span className="text-[11px] font-semibold text-slate-200 block">Density Spectrum:</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-300">Low (Dead)</span>
              <div className="w-24 h-2.5 rounded-full bg-gradient-to-r from-blue-500 via-yellow-400 to-red-500" />
              <span className="text-[10px] text-slate-300">High (Hotspot)</span>
            </div>
          </div>
        </div>

        {/* Interactive Temporal Slider Bar */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shrink-0 shadow-sm"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <div className="text-xs">
              <span className="text-slate-500 block font-medium">Scrubber Time:</span>
              <strong className="text-slate-800 font-mono text-sm">
                {hourIndex > 12 ? `${hourIndex - 12}:00 PM` : `${hourIndex}:00 AM`}
              </strong>
            </div>
          </div>

          <input
            type="range"
            min={9}
            max={21}
            value={hourIndex}
            onChange={(e) => setHourIndex(parseInt(e.target.value))}
            className="w-full max-w-md h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          {/* Manager Overlay Checkboxes */}
          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={showBottlenecks}
                onChange={(e) => setShowBottlenecks(e.target.checked)}
                className="accent-blue-600 rounded"
              />
              <span>Bottlenecks</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={showDeadZones}
                onChange={(e) => setShowDeadZones(e.target.checked)}
                className="accent-blue-600 rounded"
              />
              <span>Dead Zones</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
