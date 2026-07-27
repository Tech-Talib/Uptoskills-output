export interface ZoneMetric {
  id: string;
  name: string;
  color: string;
  visitors: number;
  avgDwellMinutes: number;
  maxDwellMinutes: number;
  minDwellMinutes: number;
  currentOccupancy: number;
  peakOccupancy: number;
  capacityLimit: number;
  dwellTimeLimitMinutes: number; // Configured max dwell threshold
  engagementScore: number; // 0-100
  historyOccupancy: number[]; // hourly or 10-min ticks
}

export interface CustomerTrack {
  id: string; // e.g. "CUST-102"
  entryTime: string;
  zoneHistory: { zoneId: string; enterTime: string; dwellSeconds: number }[];
  currentZone: string;
  dwellSeconds: number;
  totalTimeSeconds: number;
  x: number; // normalized 0-100 on floorplan
  y: number; // normalized 0-100 on floorplan
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
  status: 'active' | 'exited' | 'lost_reidentified';
  isRepeatCustomer: boolean;
  confidence: number;
}

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number; // 0 to 1
  zoneId?: string;
}

export interface CustomerRoute {
  id: string;
  pathName: string;
  sequence: string[];
  percentage: number;
  avgDurationMinutes: number;
  avgPathLengthMeters: number;
}

export interface AiInsightItem {
  id: string;
  category: 'efficiency' | 'bottleneck' | 'behavior' | 'queue';
  title: string;
  observation: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
  timestamp: string;
}

export interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  currentPlacement: string;
  proposedPlacement: string;
  projectedImpact: string; // e.g. "+18% engagement"
  confidenceScore: number;
  category: 'product_relocation' | 'queue_management' | 'promotional_placement';
}

export interface SmartAlert {
  id: string;
  type: 'overcrowded' | 'queue_overflow' | 'traffic_drop' | 'dwell_anomaly';
  severity: 'critical' | 'warning' | 'info';
  zoneId: string;
  zoneName: string;
  message: string;
  currentValue: number;
  thresholdLimit: number;
  timestamp: string;
  acknowledged: boolean;
}

export interface PredictiveDataPoint {
  timeLabel: string;
  actualTraffic?: number;
  predictedTraffic: number;
  congestionProbability: number; // 0-100%
  expectedQueueLength: number;
  recommendedStaff: number;
}

export type PredictiveModelType = 'Prophet' | 'LSTM' | 'XGBoost' | 'LightGBM';

export interface StoreHealthBreakdown {
  overallScore: number; // 0-100
  ratingLabel: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention';
  factors: {
    name: string;
    score: number;
    weight: number;
    status: 'good' | 'warning' | 'critical';
    details: string;
  }[];
}

export interface FloorplanZone {
  id: string;
  name: string;
  color: string;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  capacityLimit: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  dataPoints?: { label: string; value: string | number }[];
}
