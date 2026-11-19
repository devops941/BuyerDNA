export type UserRole = 'Super Admin' | 'Admin' | 'Analyst' | 'Viewer';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  status: 'active' | 'suspended';
  lastLogin?: string;
}

export interface Dataset {
  _id: string;
  name: string;
  originalFilename: string;
  rowCount: number;
  columnCount: number;
  fileSize: number;
  qualityScore: number;
  status: 'uploaded' | 'validating' | 'cleaned' | 'ready' | 'failed';
  columns: Array<{
    name: string;
    detectedType: string;
    mappedTo: string;
  }>;
  validationSummary: {
    missingValues: number;
    duplicates: number;
    negativeAmounts: number;
    invalidDates: number;
    correctedRows: number;
    rejectedRows: number;
    totalPassed: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  _id: string;
  customerId: string;
  name?: string;
  email?: string;
  city?: string;
  region?: string;
  gender?: string;
  age?: number;
  recencyDays: number;
  frequency: number;
  monetary: number;
  avgOrderValue: number;
  rScore: number;
  fScore: number;
  mScore: number;
  rfmScoreStr: string;
  rfmCompositeScore: number;
  segment: string;
  clusterId: number;
  clusterName: string;
  pcaX: number;
  pcaY: number;
  clvProjected: number;
  clvHistorical: number;
  churnRiskLevel: 'Low' | 'Medium' | 'High';
  churnProbability: number;
  firstPurchaseDate?: string;
  lastPurchaseDate?: string;
}

export interface Transaction {
  _id: string;
  transactionId: string;
  customerId: string;
  transactionDate: string;
  productId: string;
  productCategory: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod?: string;
  discount?: number;
  channel?: string;
}

export interface AnalysisJob {
  _id: string;
  datasetId: string;
  algorithm: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  durationSeconds: number;
  error?: string;
  logs: string[];
  createdAt: string;
}

export interface AnalysisResult {
  _id: string;
  jobId: string;
  datasetId: string;
  totalCustomers: number;
  totalRevenue: number;
  averageOrderValue: number;
  repeatPurchaseRate: number;
  rfmSegmentsSummary: Array<{
    segment: string;
    customerCount: number;
    percentage: number;
    avgRecency: number;
    avgFrequency: number;
    avgMonetary: number;
    totalRevenue: number;
    revenuePercentage: number;
  }>;
  clusteringSummary: {
    optimalK: number;
    chosenK: number;
    silhouetteScore: number;
    featuresUsed: string[];
  };
  clusters: Array<{
    clusterId: number;
    name: string;
    description: string;
    customerCount: number;
    percentage: number;
    avgRecency: number;
    avgFrequency: number;
    avgMonetary: number;
    avgAov: number;
    totalSpending: number;
    dominantTraits: string[];
  }>;
  elbowCurve: Array<{
    k: number;
    wcss: number;
    silhouette?: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    transactions: number;
    activeCustomers: number;
    aov: number;
  }>;
  categoryInsights: Array<{
    category: string;
    revenue: number;
    unitsSold: number;
    transactionsCount: number;
    avgPrice: number;
    percentageRevenue: number;
  }>;
  dayOfWeekPatterns: Array<{
    day: string;
    transactions: number;
    revenue: number;
  }>;
  priceTierDistribution: Array<{
    tier: string;
    minPrice: number;
    maxPrice: number;
    transactionCount: number;
    revenue: number;
    percentage: number;
  }>;
  clvSummary: {
    averageProjectedClv: number;
    highChurnRiskCount: number;
    mediumChurnRiskCount: number;
    lowChurnRiskCount: number;
  };
  recommendations: Array<{
    id: string;
    targetSegment: string;
    priority: 'High' | 'Medium' | 'Urgent';
    title: string;
    rationale: string;
    supportingMetric: string;
    actionPlan: string;
    expectedImpact: string;
  }>;
}

export interface DashboardOverviewData {
  dataset: Dataset | null;
  kpis: {
    totalCustomers: number;
    totalTransactions: number;
    totalRevenue: number;
    averageOrderValue: number;
    averageRfmScore: number;
    vipCustomers: number;
    atRiskCustomers: number;
    repeatPurchaseRate: number;
  };
  segmentDistribution: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  topCustomers: Customer[];
  analysisResult: AnalysisResult | null;
}
