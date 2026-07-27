import React, { useState, useRef } from 'react';
import { Settings, Plus, Trash2, Upload, Layers, CheckCircle, Save } from 'lucide-react';
import { FloorplanZone } from '../types';

interface LayoutDesignerContainerProps {
  zones: FloorplanZone[];
  onSaveZones: (updatedZones: FloorplanZone[]) => void;
}

export const LayoutDesignerContainer: React.FC<LayoutDesignerContainerProps> = ({
  zones,
  onSaveZones
}) => {
  const [editableZones, setEditableZones] = useState<FloorplanZone[]>(zones);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(zones[0]?.id || null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [floorplanImage, setFloorplanImage] = useState<string | null>(null);

  const selectedZone = editableZones.find(z => z.id === selectedZoneId);

  const handleAddZone = () => {
    const newZone: FloorplanZone = {
      id: `zone-${Date.now()}`,
      name: `New Zone ${editableZones.length + 1}`,
      color: '#3b82f6',
      x: 10,
      y: 10,
      width: 25,
      height: 25,
      capacityLimit: 20
    };
    setEditableZones([...editableZones, newZone]);
    setSelectedZoneId(newZone.id);
  };

  const handleDeleteZone = (id: string) => {
    setEditableZones(editableZones.filter(z => z.id !== id));
    if (selectedZoneId === id) setSelectedZoneId(null);
  };

  const handleUpdateZone = (id: string, field: keyof FloorplanZone, value: any) => {
    setEditableZones(editableZones.map(z => z.id === id ? { ...z, [field]: value } : z));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFloorplanImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Interactive Store Floor Plan Layout Designer</h2>
            <p className="text-xs text-slate-500">Upload Floor Plan & Click-and-Draw Custom Intelligence Zones</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 font-semibold border border-slate-200 cursor-pointer transition-all shadow-sm">
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Upload Floorplan Image</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>

          <button
            onClick={() => onSaveZones(editableZones)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Layout</span>
          </button>
        </div>
      </div>

      {/* Main Designer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Interactive Canvas (8 Cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
            <span className="font-semibold text-slate-800">Visual Floorplan Canvas (Click zone card to select)</span>
            <span className="text-slate-500 font-mono">Grid Scale: 100m x 60m</span>
          </div>

          <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
            {/* Custom Uploaded Background Image if present */}
            {floorplanImage && (
              <img src={floorplanImage} alt="Floorplan" className="absolute inset-0 w-full h-full object-cover opacity-30" />
            )}

            {/* Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:4%_8%]" />

            {/* Drawn Zones */}
            {editableZones.map(z => {
              const isSelected = z.id === selectedZoneId;
              return (
                <div
                  key={z.id}
                  onClick={() => setSelectedZoneId(z.id)}
                  style={{
                    left: `${z.x}%`,
                    top: `${z.y}%`,
                    width: `${z.width}%`,
                    height: `${z.height}%`,
                    backgroundColor: z.color + '25',
                    borderColor: z.color
                  }}
                  className={`absolute border-2 rounded-lg p-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected ? 'ring-2 ring-blue-600 ring-offset-2 ring-offset-white shadow-lg' : ''
                  }`}
                >
                  <span className="font-bold text-[11px] truncate" style={{ color: z.color }}>
                    {z.name}
                  </span>
                  <span className="text-[9px] text-slate-600 font-mono font-semibold">Limit: {z.capacityLimit}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Editor Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800">Zone Properties</h3>
            <button
              onClick={handleAddZone}
              className="p-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Zone</span>
            </button>
          </div>

          {selectedZone ? (
            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Zone Name:</label>
                <input
                  type="text"
                  value={selectedZone.name}
                  onChange={(e) => handleUpdateZone(selectedZone.id, 'name', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Zone Color Tag:</label>
                <input
                  type="color"
                  value={selectedZone.color}
                  onChange={(e) => handleUpdateZone(selectedZone.id, 'color', e.target.value)}
                  className="w-full h-9 p-1 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Capacity Limit (Shoppers):</label>
                <input
                  type="number"
                  value={selectedZone.capacityLimit}
                  onChange={(e) => handleUpdateZone(selectedZone.id, 'capacityLimit', parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">X Position (%):</label>
                  <input
                    type="number"
                    value={selectedZone.x}
                    onChange={(e) => handleUpdateZone(selectedZone.id, 'x', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Y Position (%):</label>
                  <input
                    type="number"
                    value={selectedZone.y}
                    onChange={(e) => handleUpdateZone(selectedZone.id, 'y', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Width (%):</label>
                  <input
                    type="number"
                    value={selectedZone.width}
                    onChange={(e) => handleUpdateZone(selectedZone.id, 'width', parseInt(e.target.value) || 10)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Height (%):</label>
                  <input
                    type="number"
                    value={selectedZone.height}
                    onChange={(e) => handleUpdateZone(selectedZone.id, 'height', parseInt(e.target.value) || 10)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-mono"
                  />
                </div>
              </div>

              <button
                onClick={() => handleDeleteZone(selectedZone.id)}
                className="w-full py-2 mt-4 rounded-lg bg-red-50 border border-red-200 text-red-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Zone</span>
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">Select a zone on the floorplan to edit parameters.</p>
          )}
        </div>
      </div>
    </div>
  );
};
