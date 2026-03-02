import { useState, useEffect, useRef } from "react";
import "./MetricsSummary.css";

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
}

interface MetricsSummaryProps {
  data: ComputeResponse | null;
  isLoading?: boolean;
}

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const formatCurrency = (num: number): string => {
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const formatPercentage = (num: number): string => {
  if (isNaN(num) || !isFinite(num)) return "0%";
  return `${num.toFixed(1)}%`;
};

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
      }
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
      }
    ],
    efficiency: [
      { 
        value: formatPercentage(data.efficiency), 
        label: "Эффективность модели",
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

const getLargeScreenOrder = (metrics: Record<string, MetricItem[]>): MetricItem[] => {
  return [
    ...metrics.actual,
    metrics.efficiency[0],
    metrics.efficiency[1],
    ...metrics.simulation
  ];
};

const getAdaptiveOrder = (metrics: Record<string, MetricItem[]>): MetricItem[] => {
  return [
    ...metrics.actual,
    metrics.efficiency[0],
    ...metrics.simulation,
    metrics.efficiency[1]
  ];
};

const SkeletonMetricCard = () => (
  <div className="metric-card metric-skeleton">
    <div className="metric-value skeleton-line"></div>
    <div className="metric-label skeleton-line short"></div>
  </div>
);

export default function MetricsSummary({ data, isLoading = false }: MetricsSummaryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(8);
  const [useAdaptiveOrder, setUseAdaptiveOrder] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateLayout = () => {
      const container = containerRef.current!;
      const containerWidth = container.clientWidth;
      
      const shouldUseAdaptive = containerWidth < 1200;
      setUseAdaptiveOrder(shouldUseAdaptive);
      
      let cols;
      if (containerWidth >= 1200) {
        cols = 8;
      } else if (containerWidth >= 768) {
        cols = 4;
      } else if (containerWidth >= 480) {
        cols = 4;
      } else {
        cols = 2;
      }
      
      setColumns(cols);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  if (isLoading || !data) {
    return (
      <div ref={containerRef} className="metrics-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonMetricCard key={index} />
        ))}
      </div>
    );
  }

  const metricsData = createMetricsData(data);
  
  const metricsToDisplay = useAdaptiveOrder 
    ? getAdaptiveOrder(metricsData) 
    : getLargeScreenOrder(metricsData);

  return (
    <div ref={containerRef} className="metrics-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
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