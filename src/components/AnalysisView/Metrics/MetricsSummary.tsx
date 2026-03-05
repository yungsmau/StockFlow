import "./MetricsSummary.css";
import { formatNumber, formatCurrency, formatPercentage } from "../../../utils/formatNumber";

interface ComputeResponse {
  avg_stock: number;
  actual_avg_stock: number;
  unit_cost: number;
  total_price: number;
  actual_total_price: number;
  deliveries: number;
  actual_deliveries: number;
  efficiency: number;
  efficiency_abs: number;
  avg_delivery_interval_actual: number;
  avg_delivery_interval_model: number;
}

interface MetricsSummaryProps {
  data: ComputeResponse | null;
  isLoading?: boolean;
}

const getEfficiencyColor = (value: number): 'positive' | 'negative' | 'neutral' => {
  if (value < 0) return 'negative';
  if (value > 0) return 'positive';
  return 'neutral';
};

type MetricType = 'actual' | 'simulation' | 'efficiency';

interface MetricItem {
  value: string;
  label: string;
  type: MetricType;
  color?: 'positive' | 'negative' | 'neutral';
}

const createMetricsData = (data: ComputeResponse): Record<string, MetricItem[]> => {
  return {
    actual: [
      { 
        value: formatNumber(parseFloat(data.actual_avg_stock.toFixed(0))), 
        label: "Средний остаток, ед.", 
        type: "actual" 
      },
      { 
        value: `${formatCurrency(data.actual_total_price)} ₽`, 
        label: "Стоимость остатка, руб.", 
        type: "actual" 
      },
      { 
        value: formatNumber(data.actual_deliveries), 
        label: "Поставок", 
        type: "actual" 
      },
      { 
        value: formatNumber(parseFloat(data.avg_delivery_interval_actual.toFixed(0))), 
        label: "Интервал поставок", 
        type: "actual" 
      },
    ],
    simulation: [
      { 
        value: formatNumber(parseFloat(data.avg_stock.toFixed(0))), 
        label: "Средний остаток, ед.", 
        type: "simulation" 
      },
      { 
        value: `${formatCurrency(data.total_price)} ₽`, 
        label: "Стоимость остатка, руб.", 
        type: "simulation" 
      },
      { 
        value: formatNumber(data.deliveries), 
        label: "Поставок", 
        type: "simulation" 
      },
      {
        value: formatNumber(parseFloat(data.avg_delivery_interval_model.toFixed(0))), 
        label: "Интервал поставок", 
        type: "simulation" 
      },
    ],
    efficiency: [
      { 
        value: formatPercentage(data.efficiency), 
        label: "Эффективность, %",
        type: "efficiency",
        color: getEfficiencyColor(data.efficiency)
      },
      { 
        value: `${formatCurrency(data.efficiency_abs)}`, 
        label: "Эффективность, руб",
        type: "efficiency",
        color: getEfficiencyColor(data.efficiency_abs)
      }
    ]
  };
};

const SkeletonMetricCard = () => (
  <div className="metric-card metric-skeleton">
    <div className="metric-value skeleton-line"></div>
    <div className="metric-label skeleton-line short"></div>
  </div>
);

export default function MetricsSummary({ data, isLoading = false }: MetricsSummaryProps) {
  const FIXED_COLUMNS = 5;

  if (isLoading || !data) {
    return (
      <div className="metrics-grid" style={{ gridTemplateColumns: `repeat(${FIXED_COLUMNS}, 1fr)` }}>
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonMetricCard key={index} />
        ))}
      </div>
    );
  }

  const metricsData = createMetricsData(data);
  
  const metricsToDisplay = [
    ...metricsData.actual,
    metricsData.efficiency[0],
    ...metricsData.simulation,
    metricsData.efficiency[1],
  ];

  return (
    <div className="metrics-grid" style={{ gridTemplateColumns: `repeat(${FIXED_COLUMNS}, 1fr)` }}>
      {metricsToDisplay.map((metric, index) => {
        let className = "metric-card ";
        
        if (metric.type === "actual") {
          className += "metric-actual ";
        } else if (metric.type === "simulation") {
          className += "metric-simulation ";
        } else if (metric.type === "efficiency") {
          className += `metric-efficiency metric-efficiency-${metric.color} `;
        }
        
        return (
          <div key={index} className={className.trim()}>
            <div className="metric-value">{metric.value}</div>
            <div className="metric-label">{metric.label}</div>
          </div>
        );
      })}
    </div>
  );
}