import {
  ZoneMetric,
  CustomerTrack,
  HeatmapPoint,
  CustomerRoute,
  AiInsightItem,
  OptimizationSuggestion,
  SmartAlert,
  PredictiveDataPoint,
  StoreHealthBreakdown,
  FloorplanZone
} from './types';

export interface INITIAL_ZONES_TYPE {
  // placeholder
}

export const INITIAL_ZONES: ZoneMetric[] = [
  {
    id: 'groceries',
    name: 'Groceries & Fresh',
    color: '#10b981', // green
    visitors: 420,
    avgDwellMinutes: 6.4,
    maxDwellMinutes: 18.2,
    minDwellMinutes: 1.1,
    currentOccupancy: 18,
    peakOccupancy: 32,
    capacityLimit: 25,
    dwellTimeLimitMinutes: 5.0,
    engagementScore: 88,
    historyOccupancy: [8, 12, 19, 24, 28, 32, 29, 22, 18]
  },
  {
    id: 'electronics',
    name: 'Electronics & Tech',
    color: '#3b82f6', // blue
    visitors: 190,
    avgDwellMinutes: 8.5,
    maxDwellMinutes: 24.0,
    minDwellMinutes: 2.0,
    currentOccupancy: 7,
    peakOccupancy: 16,
    capacityLimit: 20,
    dwellTimeLimitMinutes: 6.0,
    engagementScore: 74,
    historyOccupancy: [3, 5, 8, 12, 15, 16, 11, 9, 7]
  },
  {
    id: 'beverages',
    name: 'Beverages & Dairy',
    color: '#8b5cf6', // purple
    visitors: 250,
    avgDwellMinutes: 2.1,
    maxDwellMinutes: 5.8,
    minDwellMinutes: 0.5,
    currentOccupancy: 4,
    peakOccupancy: 12,
    capacityLimit: 15,
    dwellTimeLimitMinutes: 3.0,
    engagementScore: 62,
    historyOccupancy: [2, 4, 7, 9, 12, 10, 8, 5, 4]
  },
  {
    id: 'apparel',
    name: 'Apparel & Fashion',
    color: '#ec4899', // pink
    visitors: 165,
    avgDwellMinutes: 9.8,
    maxDwellMinutes: 31.5,
    minDwellMinutes: 1.8,
    currentOccupancy: 9,
    peakOccupancy: 18,
    capacityLimit: 20,
    dwellTimeLimitMinutes: 8.0,
    engagementScore: 82,
    historyOccupancy: [4, 6, 9, 14, 18, 15, 12, 10, 9]
  },
  {
    id: 'bakery',
    name: 'Bakery & Snacks',
    color: '#f59e0b', // amber
    visitors: 310,
    avgDwellMinutes: 3.5,
    maxDwellMinutes: 9.2,
    minDwellMinutes: 0.8,
    currentOccupancy: 11,
    peakOccupancy: 22,
    capacityLimit: 18,
    dwellTimeLimitMinutes: 4.0,
    engagementScore: 79,
    historyOccupancy: [5, 9, 14, 18, 22, 19, 15, 12, 11]
  },
  {
    id: 'billing',
    name: 'Billing & Checkout Queue',
    color: '#ef4444', // red
    visitors: 510,
    avgDwellMinutes: 4.8,
    maxDwellMinutes: 12.5,
    minDwellMinutes: 1.5,
    currentOccupancy: 14,
    peakOccupancy: 28,
    capacityLimit: 15,
    dwellTimeLimitMinutes: 3.0,
    engagementScore: 45,
    historyOccupancy: [4, 8, 15, 22, 28, 25, 20, 16, 14]
  }
];

export const MOCK_CUSTOMERS: CustomerTrack[] = [
  {
    id: 'CUST-101',
    entryTime: '10:05 AM',
    currentZone: 'groceries',
    dwellSeconds: 245,
    totalTimeSeconds: 420,
    x: 25,
    y: 35,
    vx: 0.2,
    vy: -0.1,
    trail: [
      { x: 10, y: 85 },
      { x: 15, y: 60 },
      { x: 22, y: 40 },
      { x: 25, y: 35 }
    ],
    status: 'active',
    isRepeatCustomer: true,
    confidence: 0.94,
    zoneHistory: [
      { zoneId: 'entrance', enterTime: '10:05 AM', dwellSeconds: 15 },
      { zoneId: 'groceries', enterTime: '10:06 AM', dwellSeconds: 245 }
    ]
  },
  {
    id: 'CUST-102',
    entryTime: '10:12 AM',
    currentZone: 'electronics',
    dwellSeconds: 520,
    totalTimeSeconds: 610,
    x: 72,
    y: 30,
    vx: -0.1,
    vy: 0.15,
    trail: [
      { x: 10, y: 85 },
      { x: 35, y: 70 },
      { x: 65, y: 40 },
      { x: 72, y: 30 }
    ],
    status: 'active',
    isRepeatCustomer: false,
    confidence: 0.98,
    zoneHistory: [
      { zoneId: 'entrance', enterTime: '10:12 AM', dwellSeconds: 10 },
      { zoneId: 'bakery', enterTime: '10:13 AM', dwellSeconds: 80 },
      { zoneId: 'electronics', enterTime: '10:15 AM', dwellSeconds: 520 }
    ]
  },
  {
    id: 'CUST-103',
    entryTime: '10:14 AM',
    currentZone: 'billing',
    dwellSeconds: 310,
    totalTimeSeconds: 490,
    x: 82,
    y: 82,
    vx: 0.05,
    vy: 0.05,
    trail: [
      { x: 10, y: 85 },
      { x: 25, y: 35 },
      { x: 50, y: 65 },
      { x: 82, y: 82 }
    ],
    status: 'active',
    isRepeatCustomer: false,
    confidence: 0.91,
    zoneHistory: [
      { zoneId: 'entrance', enterTime: '10:14 AM', dwellSeconds: 12 },
      { zoneId: 'groceries', enterTime: '10:15 AM', dwellSeconds: 168 },
      { zoneId: 'beverages', enterTime: '10:18 AM', dwellSeconds: 100 },
      { zoneId: 'billing', enterTime: '10:20 AM', dwellSeconds: 310 }
    ]
  },
  {
    id: 'CUST-104',
    entryTime: '10:08 AM',
    currentZone: 'apparel',
    dwellSeconds: 680,
    totalTimeSeconds: 780,
    x: 20,
    y: 70,
    vx: -0.1,
    vy: -0.05,
    trail: [
      { x: 10, y: 85 },
      { x: 18, y: 75 },
      { x: 20, y: 70 }
    ],
    status: 'active',
    isRepeatCustomer: true,
    confidence: 0.96,
    zoneHistory: [
      { zoneId: 'entrance', enterTime: '10:08 AM', dwellSeconds: 20 },
      { zoneId: 'apparel', enterTime: '10:09 AM', dwellSeconds: 680 }
    ]
  },
  {
    id: 'CUST-105',
    entryTime: '09:58 AM',
    currentZone: 'beverages',
    dwellSeconds: 110,
    totalTimeSeconds: 840,
    x: 55,
    y: 65,
    vx: 0.3,
    vy: 0.1,
    trail: [
      { x: 10, y: 85 },
      { x: 70, y: 30 },
      { x: 55, y: 65 }
    ],
    status: 'lost_reidentified',
    isRepeatCustomer: false,
    confidence: 0.89,
    zoneHistory: [
      { zoneId: 'entrance', enterTime: '09:58 AM', dwellSeconds: 10 },
      { zoneId: 'electronics', enterTime: '10:00 AM', dwellSeconds: 720 },
      { zoneId: 'beverages', enterTime: '10:12 AM', dwellSeconds: 110 }
    ]
  }
];

export const MOCK_HEATMAP_POINTS: HeatmapPoint[] = [
  // Groceries section high density
  { x: 20, y: 30, intensity: 0.9, zoneId: 'groceries' },
  { x: 22, y: 32, intensity: 0.95, zoneId: 'groceries' },
  { x: 28, y: 35, intensity: 0.8, zoneId: 'groceries' },
  { x: 24, y: 25, intensity: 0.85, zoneId: 'groceries' },

  // Billing queue bottleneck red zone
  { x: 80, y: 80, intensity: 1.0, zoneId: 'billing' },
  { x: 82, y: 83, intensity: 0.98, zoneId: 'billing' },
  { x: 78, y: 78, intensity: 0.92, zoneId: 'billing' },

  // Bakery popular shelf
  { x: 50, y: 25, intensity: 0.75, zoneId: 'bakery' },
  { x: 52, y: 28, intensity: 0.82, zoneId: 'bakery' },

  // Electronics interactive displays
  { x: 72, y: 28, intensity: 0.7, zoneId: 'electronics' },
  { x: 75, y: 32, intensity: 0.65, zoneId: 'electronics' },

  // Apparel quiet section (dead zone)
  { x: 18, y: 72, intensity: 0.3, zoneId: 'apparel' },
  { x: 22, y: 68, intensity: 0.35, zoneId: 'apparel' },

  // Entrance corridor flow
  { x: 12, y: 85, intensity: 0.6, zoneId: 'entrance' },
  { x: 15, y: 80, intensity: 0.55, zoneId: 'entrance' }
];

export const MOCK_JOURNEY_ROUTES: CustomerRoute[] = [
  {
    id: 'route-1',
    pathName: 'Entrance → Groceries → Bakery → Billing → Exit',
    sequence: ['Entrance', 'Groceries & Fresh', 'Bakery & Snacks', 'Billing', 'Exit'],
    percentage: 38,
    avgDurationMinutes: 14.2,
    avgPathLengthMeters: 85
  },
  {
    id: 'route-2',
    pathName: 'Entrance → Electronics → Beverages → Billing → Exit',
    sequence: ['Entrance', 'Electronics & Tech', 'Beverages & Dairy', 'Billing', 'Exit'],
    percentage: 24,
    avgDurationMinutes: 18.5,
    avgPathLengthMeters: 110
  },
  {
    id: 'route-3',
    pathName: 'Entrance → Apparel → Groceries → Billing → Exit',
    sequence: ['Entrance', 'Apparel & Fashion', 'Groceries & Fresh', 'Billing', 'Exit'],
    percentage: 19,
    avgDurationMinutes: 22.1,
    avgPathLengthMeters: 125
  },
  {
    id: 'route-4',
    pathName: 'Entrance → Bakery → Exit (Express Grab)',
    sequence: ['Entrance', 'Bakery & Snacks', 'Billing', 'Exit'],
    percentage: 12,
    avgDurationMinutes: 5.8,
    avgPathLengthMeters: 45
  },
  {
    id: 'route-5',
    pathName: 'Entrance → Electronics → Exit (No purchase / Browse)',
    sequence: ['Entrance', 'Electronics & Tech', 'Exit'],
    percentage: 7,
    avgDurationMinutes: 9.4,
    avgPathLengthMeters: 60
  }
];

export const MOCK_AI_INSIGHTS: AiInsightItem[] = [
  {
    id: 'ins-1',
    category: 'bottleneck',
    title: 'Peak Hour Billing Bottleneck Detected',
    observation: 'Billing queue length exceeds 8 customers between 6:00 PM and 8:00 PM, causing average wait times to spike to 8.4 minutes.',
    recommendation: 'Deploy at least 2 additional cashiers or open self-checkout express lanes during evening peak windows (5:30 PM - 8:30 PM).',
    impact: 'high',
    timestamp: '10:15 AM Today'
  },
  {
    id: 'ins-2',
    category: 'behavior',
    title: 'High Dwell, Low Conversion in Electronics',
    observation: 'Electronics section attracts lower total visitors (190) but exhibits highest dwell time per customer (8.5 mins average).',
    recommendation: 'Place promotional QR banners or product assistants near flagship smartphone and laptop displays to convert high engagement into immediate sales.',
    impact: 'medium',
    timestamp: '09:40 AM Today'
  },
  {
    id: 'ins-3',
    category: 'efficiency',
    title: 'Beverage Impulse Buy Opportunity',
    observation: 'Over 62% of shoppers heading from Groceries to Billing pass directly adjacent to the Beverage aisle, but dwell time is under 2 minutes.',
    recommendation: 'Move refrigerated grab-and-go beverages and energy drinks closer to the main Grocery exit aisle to trigger high-margin impulse purchases.',
    impact: 'high',
    timestamp: '09:10 AM Today'
  },
  {
    id: 'ins-4',
    category: 'queue',
    title: 'Apparel Rear Display Dead Zone',
    observation: 'The south-west corner of Apparel receives 40% less foot traffic compared to the main aisle display.',
    recommendation: 'Relocate seasonal discount racks or high-contrast mannequin displays to draw shoppers deeper into the apparel aisle.',
    impact: 'low',
    timestamp: '08:30 AM Today'
  }
];

export const MOCK_OPTIMIZATION_SUGGESTIONS: OptimizationSuggestion[] = [
  {
    id: 'opt-1',
    title: 'Relocate Cold Drinks Near Snack Aisle',
    description: 'Data reveals 74% co-purchasing behavior between savory snacks and cold beverages, but sections are currently separated by 40 meters.',
    currentPlacement: 'Beverages in Section C-3 (Far East)',
    proposedPlacement: 'End-cap refrigeration unit in Section A-2 (Bakery & Snacks)',
    projectedImpact: '+18% beverage impulse sales',
    confidenceScore: 0.92,
    category: 'product_relocation'
  },
  {
    id: 'opt-2',
    title: 'Reposition Promotional Display Shelf to Main Entrance Corridor',
    description: 'Current promotional island is obscured behind Apparel rack #2, missing 55% of incoming shopper traffic.',
    currentPlacement: 'Apparel Secondary Walkway',
    proposedPlacement: 'Entrance Hub Feature Island (3 meters from main turnstile)',
    projectedImpact: '+28% promotional campaign reach',
    confidenceScore: 0.88,
    category: 'promotional_placement'
  },
  {
    id: 'opt-3',
    title: 'Implement Express Self-Checkout Lanes in High Traffic Corridor',
    description: 'Basket size analysis indicates 35% of shoppers hold under 4 items but wait in full billing lines.',
    currentPlacement: 'Standard Cashier Desk 5 & 6',
    proposedPlacement: '4 Kiosk Express Self-Checkout Station',
    projectedImpact: '-42% queue wait time during peak hours',
    confidenceScore: 0.95,
    category: 'queue_management'
  }
];

export const MOCK_SMART_ALERTS: SmartAlert[] = [
  {
    id: 'alt-1',
    type: 'overcrowded',
    severity: 'critical',
    zoneId: 'groceries',
    zoneName: 'Groceries & Fresh',
    message: 'Groceries section occupancy (32 people) has exceeded safety threshold limit (25 people).',
    currentValue: 32,
    thresholdLimit: 25,
    timestamp: '10:20:15 AM',
    acknowledged: false
  },
  {
    id: 'alt-2',
    type: 'queue_overflow',
    severity: 'warning',
    zoneId: 'billing',
    zoneName: 'Billing & Checkout Queue',
    message: 'Billing line queue length reached 14 shoppers. Average queue wait duration exceeds 5 minutes.',
    currentValue: 14,
    thresholdLimit: 10,
    timestamp: '10:18:40 AM',
    acknowledged: false
  },
  {
    id: 'alt-3',
    type: 'traffic_drop',
    severity: 'info',
    zoneId: 'electronics',
    zoneName: 'Electronics & Tech',
    message: 'Electronics section received 35% lower footfall than yesterday average at this time.',
    currentValue: 7,
    thresholdLimit: 12,
    timestamp: '10:05:00 AM',
    acknowledged: true
  }
];

export const MOCK_PREDICTIVE_DATA: PredictiveDataPoint[] = [
  { timeLabel: '09:00 AM', actualTraffic: 45, predictedTraffic: 42, congestionProbability: 15, expectedQueueLength: 2, recommendedStaff: 3 },
  { timeLabel: '10:00 AM', actualTraffic: 98, predictedTraffic: 95, congestionProbability: 35, expectedQueueLength: 4, recommendedStaff: 4 },
  { timeLabel: '11:00 AM', actualTraffic: 142, predictedTraffic: 140, congestionProbability: 55, expectedQueueLength: 6, recommendedStaff: 5 },
  { timeLabel: '12:00 PM', actualTraffic: 185, predictedTraffic: 180, congestionProbability: 72, expectedQueueLength: 9, recommendedStaff: 6 },
  { timeLabel: '01:00 PM', actualTraffic: 160, predictedTraffic: 165, congestionProbability: 60, expectedQueueLength: 7, recommendedStaff: 5 },
  { timeLabel: '02:00 PM', predictedTraffic: 130, congestionProbability: 40, expectedQueueLength: 5, recommendedStaff: 4 },
  { timeLabel: '03:00 PM', predictedTraffic: 155, congestionProbability: 50, expectedQueueLength: 6, recommendedStaff: 5 },
  { timeLabel: '04:00 PM', predictedTraffic: 210, congestionProbability: 82, expectedQueueLength: 11, recommendedStaff: 7 },
  { timeLabel: '05:00 PM', predictedTraffic: 265, congestionProbability: 95, expectedQueueLength: 15, recommendedStaff: 8 },
  { timeLabel: '06:00 PM', predictedTraffic: 290, congestionProbability: 98, expectedQueueLength: 18, recommendedStaff: 9 },
  { timeLabel: '07:00 PM', predictedTraffic: 240, congestionProbability: 88, expectedQueueLength: 12, recommendedStaff: 7 },
  { timeLabel: '08:00 PM', predictedTraffic: 150, congestionProbability: 45, expectedQueueLength: 5, recommendedStaff: 4 }
];

export const MOCK_STORE_HEALTH: StoreHealthBreakdown = {
  overallScore: 88,
  ratingLabel: 'Excellent',
  factors: [
    { name: 'Customer Flow Efficiency', score: 92, weight: 25, status: 'good', details: 'Unobstructed main pathways with fluid transitions between zones.' },
    { name: 'Queue & Billing Time', score: 74, weight: 25, status: 'warning', details: 'Slight queue buildup observed during peak midday & evening hours.' },
    { name: 'Zone Utilization Balance', score: 89, weight: 20, status: 'good', details: 'High engagement across Groceries, Bakery, and Electronics.' },
    { name: 'Dwell & Engagement Depth', score: 94, weight: 15, status: 'good', details: 'Shoppers spend sufficient time discovering product displays.' },
    { name: 'Safety & Congestion Control', score: 85, weight: 15, status: 'good', details: 'Groceries section reached capacity briefly; resolved swiftly.' }
  ]
};

export const DEFAULT_FLOORPLAN_ZONES: FloorplanZone[] = [
  { id: 'groceries', name: 'Groceries & Fresh', color: '#10b981', x: 5, y: 5, width: 40, height: 45, capacityLimit: 25 },
  { id: 'bakery', name: 'Bakery & Snacks', color: '#f59e0b', x: 48, y: 5, width: 22, height: 45, capacityLimit: 18 },
  { id: 'electronics', name: 'Electronics & Tech', color: '#3b82f6', x: 73, y: 5, width: 22, height: 45, capacityLimit: 20 },
  { id: 'apparel', name: 'Apparel & Fashion', color: '#ec4899', x: 5, y: 55, width: 35, height: 35, capacityLimit: 20 },
  { id: 'beverages', name: 'Beverages & Dairy', color: '#8b5cf6', x: 43, y: 55, width: 25, height: 35, capacityLimit: 15 },
  { id: 'billing', name: 'Billing & Checkout', color: '#ef4444', x: 71, y: 55, width: 24, height: 35, capacityLimit: 15 }
];
