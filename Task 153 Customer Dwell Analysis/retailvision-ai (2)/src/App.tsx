/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StoreHealthScoreCard } from './components/StoreHealthScoreCard';
import { VideoAnalyticsView } from './components/VideoAnalyticsView';
import { ZoneAnalyticsView } from './components/ZoneAnalyticsView';
import { HeatmapView } from './components/HeatmapView';
import { JourneyView } from './components/JourneyView';
import { DashboardAnalyticsView } from './components/DashboardAnalyticsView';
import { AiInsightsView } from './components/AiInsightsView';
import { PredictiveAnalyticsView } from './components/PredictiveAnalyticsView';
import { StoreOptimizationView } from './components/StoreOptimizationView';
import { SmartAlertsView } from './components/SmartAlertsView';
import { LayoutDesignerContainer } from './components/LayoutDesignerContainer';
import { ReportsModal } from './components/ReportsModal';

import {
  INITIAL_ZONES,
  MOCK_CUSTOMERS,
  MOCK_HEATMAP_POINTS,
  MOCK_JOURNEY_ROUTES,
  MOCK_AI_INSIGHTS,
  MOCK_OPTIMIZATION_SUGGESTIONS,
  MOCK_SMART_ALERTS,
  MOCK_PREDICTIVE_DATA,
  MOCK_STORE_HEALTH,
  DEFAULT_FLOORPLAN_ZONES
} from './mockData';

import { ZoneMetric, SmartAlert, AiInsightItem, FloorplanZone, CustomerTrack, HeatmapPoint, CustomerRoute } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('video');
  const [zones, setZones] = useState<ZoneMetric[]>(INITIAL_ZONES);
  const [customers, setCustomers] = useState<CustomerTrack[]>(MOCK_CUSTOMERS);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>(MOCK_HEATMAP_POINTS);
  const [routes, setRoutes] = useState<CustomerRoute[]>(MOCK_JOURNEY_ROUTES);
  const [insights, setInsights] = useState<AiInsightItem[]>(MOCK_AI_INSIGHTS);
  const [suggestions, setSuggestions] = useState(MOCK_OPTIMIZATION_SUGGESTIONS);
  const [alerts, setAlerts] = useState<SmartAlert[]>(MOCK_SMART_ALERTS);
  const [predictiveData, setPredictiveData] = useState(MOCK_PREDICTIVE_DATA);
  const [healthScore, setHealthScore] = useState(MOCK_STORE_HEALTH);
  const [floorplanZones, setFloorplanZones] = useState<FloorplanZone[]>(DEFAULT_FLOORPLAN_ZONES);

  const [isProcessingVideo, setIsProcessingVideo] = useState(true);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Sync video or synthetic tracks to Zone Analytics, Thermal Heatmap, Journey & Dashboard
  const handleTracksUpdated = useCallback((activeTracks: CustomerTrack[]) => {
    setCustomers(activeTracks);

    // 1. Calculate Zone Metrics
    setZones(prevZones => {
      const updatedZones = prevZones.map(zone => {
        const tracksInZone = activeTracks.filter(t =>
          t.currentZone.toLowerCase() === zone.name.toLowerCase() ||
          t.currentZone.toLowerCase() === zone.id.toLowerCase()
        );
        const currentOccupancy = tracksInZone.length;
        const peakOccupancy = Math.max(zone.peakOccupancy, currentOccupancy);

        const visitorsInZone = activeTracks.filter(t =>
          t.zoneHistory?.some(zh =>
            zh.zoneId.toLowerCase() === zone.name.toLowerCase() ||
            zh.zoneId.toLowerCase() === zone.id.toLowerCase()
          )
        ).length;

        const totalVisitors = Math.max(zone.visitors, visitorsInZone);

        const totalDwellSeconds = tracksInZone.reduce((acc, t) => acc + t.dwellSeconds, 0);
        const avgDwellMinutes = tracksInZone.length > 0
          ? parseFloat(((totalDwellSeconds / tracksInZone.length) / 60).toFixed(1))
          : zone.avgDwellMinutes;

        const engagementScore = Math.min(100, Math.max(10, Math.round((avgDwellMinutes / 4) * 100)));

        return {
          ...zone,
          currentOccupancy,
          peakOccupancy,
          visitors: totalVisitors,
          avgDwellMinutes: Math.max(0.5, avgDwellMinutes),
          engagementScore
        };
      });

      // 2. Calculate Store Health Score from updated zones
      const totalOccupancy = updatedZones.reduce((acc, z) => acc + z.currentOccupancy, 0);
      const totalLimit = updatedZones.reduce((acc, z) => acc + z.capacityLimit, 0);
      const billingZone = updatedZones.find(z => z.id === 'billing' || z.name.toLowerCase().includes('billing'));
      const billingOccupancy = billingZone ? billingZone.currentOccupancy : 0;
      const billingLimit = billingZone ? billingZone.capacityLimit : 10;

      const queueScore = Math.max(20, Math.min(100, Math.round(100 - (billingOccupancy / billingLimit) * 50)));
      const flowScore = Math.max(30, Math.min(100, Math.round(95 - (totalOccupancy / Math.max(1, totalLimit)) * 35)));
      const dwellScore = Math.min(100, Math.max(40, Math.round(updatedZones.reduce((acc, z) => acc + z.engagementScore, 0) / updatedZones.length)));

      const overallScore = Math.round((queueScore * 0.35) + (flowScore * 0.35) + (dwellScore * 0.3));

      let ratingLabel: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention' = 'Excellent';
      if (overallScore < 60) ratingLabel = 'Needs Attention';
      else if (overallScore < 75) ratingLabel = 'Fair';
      else if (overallScore < 85) ratingLabel = 'Good';

      setHealthScore({
        overallScore,
        ratingLabel,
        factors: [
          {
            name: 'Customer Flow Efficiency',
            score: flowScore,
            weight: 35,
            status: flowScore >= 70 ? 'good' : 'warning',
            details: `Active store occupancy: ${totalOccupancy} detected targets`
          },
          {
            name: 'Queue & Billing Time',
            score: queueScore,
            weight: 35,
            status: queueScore >= 75 ? 'good' : queueScore >= 50 ? 'warning' : 'critical',
            details: billingOccupancy > 4 ? `Active queue at Billing (${billingOccupancy} people detected)` : 'Smooth queue throughput at checkout'
          },
          {
            name: 'Dwell & Engagement Depth',
            score: dwellScore,
            weight: 30,
            status: dwellScore >= 70 ? 'good' : 'warning',
            details: `Average dwell duration across zones is ${(updatedZones.reduce((a, z) => a + z.avgDwellMinutes, 0) / updatedZones.length).toFixed(1)} mins`
          }
        ]
      });

      return updatedZones;
    });

    // 3. Compute Thermal Heatmap Points
    if (activeTracks.length > 0) {
      const newHeatmapPoints: HeatmapPoint[] = [];

      activeTracks.forEach((t, i) => {
        const intensity = Math.min(1.0, Math.max(0.35, 0.4 + (t.dwellSeconds / 60)));
        newHeatmapPoints.push({
          x: t.x,
          y: t.y,
          intensity,
          zoneId: t.currentZone
        });

        t.trail?.slice(-6).forEach((tr, tri) => {
          newHeatmapPoints.push({
            x: tr.x,
            y: tr.y,
            intensity: Math.max(0.15, intensity * (tri / 6)),
            zoneId: t.currentZone
          });
        });
      });

      setHeatmapPoints(newHeatmapPoints);
    }

    // 4. Compute Customer Journey Routes
    if (activeTracks.length > 0) {
      const routeGroupMap = new Map<string, { count: number; totalSecs: number; seq: string[] }>();

      activeTracks.forEach(t => {
        const seq = t.zoneHistory?.map(zh => zh.zoneId) || [t.currentZone];
        const pathName = seq.join(' → ');
        const existing = routeGroupMap.get(pathName);

        if (existing) {
          existing.count += 1;
          existing.totalSecs += t.dwellSeconds;
        } else {
          routeGroupMap.set(pathName, { count: 1, totalSecs: t.dwellSeconds, seq });
        }
      });

      const totalTracksCount = activeTracks.length;
      const updatedRoutes: CustomerRoute[] = [];
      let routeIdx = 1;

      routeGroupMap.forEach((val, pathName) => {
        const percentage = Math.round((val.count / totalTracksCount) * 100);
        const avgDurationMinutes = parseFloat(((val.totalSecs / val.count) / 60).toFixed(1));

        updatedRoutes.push({
          id: `route-live-${routeIdx++}`,
          pathName,
          percentage,
          sequence: val.seq,
          avgDurationMinutes: Math.max(0.5, avgDurationMinutes),
          avgPathLengthMeters: Math.round(25 + val.seq.length * 18)
        });
      });

      if (updatedRoutes.length > 0) {
        setRoutes(updatedRoutes);
      }
    }
  }, []);

  // Acknowledge smart alert
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
  };

  // Update capacity threshold for a zone
  const handleUpdateCapacity = (zoneId: string, limit: number) => {
    setZones(prev => prev.map(z => z.id === zoneId ? { ...z, capacityLimit: limit } : z));
  };

  // Refresh AI insights via Express backend API
  const handleRefreshInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zonesData: zones, alertsData: alerts })
      });
      const data = await response.json();
      if (data.insights && Array.isArray(data.insights)) {
        setInsights(data.insights);
      }
    } catch (err) {
      console.error("Failed to refresh AI insights:", err);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Save floorplan zones from Layout Designer
  const handleSaveFloorplanZones = (updatedZones: FloorplanZone[]) => {
    setFloorplanZones(updatedZones);

    // Sync zone metric names and limits
    setZones(prev => updatedZones.map(fz => {
      const existing = prev.find(p => p.id === fz.id);
      if (existing) {
        return { ...existing, name: fz.name, capacityLimit: fz.capacityLimit };
      }
      return {
        id: fz.id,
        name: fz.name,
        color: fz.color,
        visitors: 50,
        avgDwellMinutes: 4.0,
        maxDwellMinutes: 10.0,
        minDwellMinutes: 1.0,
        currentOccupancy: 3,
        peakOccupancy: 8,
        capacityLimit: fz.capacityLimit,
        engagementScore: 70,
        historyOccupancy: [2, 3, 5, 4, 6]
      };
    }));

    alert("Store Floorplan Layout successfully updated!");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        healthScore={healthScore.overallScore}
        alerts={alerts}
        onOpenReports={() => setIsReportsOpen(true)}
        onOpenSettings={() => setActiveTab('layout_designer')}
        isProcessingVideo={isProcessingVideo}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Store Health Score Overview Card - Visible across primary operational tabs */}
        {(activeTab === 'video' || activeTab === 'zones' || activeTab === 'dashboard') && (
          <StoreHealthScoreCard
            health={healthScore}
            onExploreInsights={() => setActiveTab('insights')}
          />
        )}

        {/* Tab Views */}
        {activeTab === 'video' && (
          <VideoAnalyticsView
            customers={customers}
            zones={zones}
            isProcessing={isProcessingVideo}
            setIsProcessing={setIsProcessingVideo}
            onTracksUpdated={handleTracksUpdated}
          />
        )}

        {activeTab === 'zones' && (
          <ZoneAnalyticsView
            zones={zones}
            onUpdateZoneDwellLimit={(zoneId, limitMinutes) => {
              setZones(prev => prev.map(z => z.id === zoneId ? { ...z, dwellTimeLimitMinutes: limitMinutes } : z));
            }}
          />
        )}

        {activeTab === 'heatmap' && (
          <HeatmapView heatmapPoints={heatmapPoints} zones={zones} />
        )}

        {activeTab === 'journey' && (
          <JourneyView routes={routes} />
        )}

        {activeTab === 'dashboard' && (
          <DashboardAnalyticsView zones={zones} />
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            <AiInsightsView
              insights={insights}
              zones={zones}
              alerts={alerts}
              onRefreshInsights={handleRefreshInsights}
              isLoadingInsights={isLoadingInsights}
            />
            <SmartAlertsView
              alerts={alerts}
              zones={zones}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onUpdateCapacity={handleUpdateCapacity}
            />
          </div>
        )}

        {activeTab === 'predictive' && (
          <PredictiveAnalyticsView predictiveData={predictiveData} />
        )}

        {activeTab === 'optimization' && (
          <StoreOptimizationView suggestions={suggestions} />
        )}

        {activeTab === 'layout_designer' && (
          <LayoutDesignerContainer
            zones={floorplanZones}
            onSaveZones={handleSaveFloorplanZones}
          />
        )}
      </main>

      {/* Export Reports Modal */}
      <ReportsModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        zones={zones}
        healthScore={healthScore.overallScore}
      />
    </div>
  );
}
