export type ReportTimeframe = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export type ReportType = 'sales' | 'expenses' | 'purchases' | 'inventory' | 'profit_loss';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ReportFilter {
  timeframe: ReportTimeframe;
  dateRange?: DateRange;
  categories?: string[];
  status?: string;
}

export interface ReportSummary {
  totalAmount: number;
  count: number;
  averageAmount: number;
  previousPeriodChange: number;
  formattedTotal: string;
  formattedAverage: string;
}

export interface ReportDataPoint {
  date: Date;
  value: number;
  formattedValue: string;
  label: string;
  details?: {
    customer?: string;
    supplier?: string;
    category?: string;
    initialStock?: number;
    currentStock?: number;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      formattedPrice: string;
    }>;
    status: string;
  };
}

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  description: string;
  filter: ReportFilter;
  summary: ReportSummary;
  data: ReportDataPoint[];
  createdAt: Date;
  updatedAt: Date;
} 