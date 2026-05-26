import { useState, useEffect } from "react";
import Select, { SingleValue } from "react-select";
import "./AnalysisView.css";

import FiltersPanel from "./FilterPanel/FilterPanel";
import MetricsSummary from "./Metrics/MetricsSummary";
import StockSimulationPlot from "./Plots/StockSimulationPlot";
import ActualDataPlot from "./Plots/ActualDataPlot";
import ValueFrequencyPlot from "./Plots/ValueFrequencyPlot";
import PlanPlot from "./Plots/PlanPlot";
import ErrorDisplay from "./ErrorDisplay/ErrorDisplay";

import { saveHistoryItem } from "../../utils/historyService";
import { useAnalysis } from "../../context/AnalysisContext";
import { invoke } from "@tauri-apps/api/core";
import Plotly from 'plotly.js-dist-min';

import { 
  type PlanItem, 
  type DailyPlanItem 
} from "../../utils/fileParsers";

const DESKTOP_BREAKPOINT = 1400;
const SIDEBAR_STORAGE_KEY = 'app_sidebar_open';

interface ValueFrequencyResult {
  bins: Array<{ value: number; count: number; percentage: number }>;
  total_windows: number;
  window_size: number;
  value_type: 'stock' | 'expense';
  min_value: number;
  max_value: number;
  avg_value: number;
}

interface AnalysisViewProps {
  uploadedFiles: any[];
  externalPlan: PlanItem[];
}

const CHART_MODE_OPTIONS = [
  { value: "comparison", label: "Сравнение" },
  { value: "simulation", label: "Моделирование" },
  { value: "actual", label: "Фактические данные" },
  { value: "frequency", label: "Анализ расходов" },
  { value: "plan", label: "План" },
];

export default function AnalysisView({ uploadedFiles, externalPlan }: AnalysisViewProps) {
  const { state, retry, setChartMode } = useAnalysis(); 
  const chartMode = state.chartMode; 
  
  const [isFilterOpen, setIsFilterOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(SIDEBAR_STORAGE_KEY);
      return saved === 'true';
    }
    return false;
  });
  const [isDesktop, setIsDesktop] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth >= DESKTOP_BREAKPOINT : true
  );

  const [frequencyData, setFrequencyData] = useState<ValueFrequencyResult | null>(null);
  const [frequencyLoading, setFrequencyLoading] = useState(false);
  
  const [planData, setPlanData] = useState<DailyPlanItem[] | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    sessionStorage.setItem(SIDEBAR_STORAGE_KEY, String(isFilterOpen));
  }, [isFilterOpen]);

  // Слушаем изменение ширины экрана
  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    
    const handleResize = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
      if (!e.matches && isFilterOpen) {
        setIsFilterOpen(false);
      }
    };
    
    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleResize);
    
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, [isFilterOpen]);

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFilterOpen) {
        setIsFilterOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFilterOpen]);

  // === Частота расходов ===
  const needsFrequencyData = chartMode === "frequency";
  const frequencyParamsKey = `${state.selectedProduct}|${state.deliveryDays}|${uploadedFiles.length}`;

  useEffect(() => {
    if (needsFrequencyData && state.selectedProduct && uploadedFiles.length > 0) {
      setFrequencyData(null);
      calculateFrequency();
    }
  }, [needsFrequencyData, frequencyParamsKey]);

  const calculateFrequency = async () => {
    if (!state.selectedProduct || !state.result) return;
    
    setFrequencyLoading(true);
    try {
      const result = await invoke<ValueFrequencyResult>("calculate_value_frequency", {
        req: {
          uploaded_files: uploadedFiles,
          product: state.selectedProduct,
          value_type: "expense",
          window_size: state.deliveryDays,
        },
      });
      setFrequencyData(result);
    } catch (error) {
      console.error("Failed to calculate frequency:", error);
    } finally {
      setFrequencyLoading(false);
    }
  };

  const needsPlanData = chartMode === "plan";
  const planParamsKey = `${state.selectedProduct}|${uploadedFiles.length}`;

  useEffect(() => {
    if (needsPlanData && state.selectedProduct && uploadedFiles.length > 0) {
      setPlanData(null);
      loadPlanData();
    }
  }, [needsPlanData, planParamsKey, state.selectedProduct]);

  const loadPlanData = async () => {
    setPlanLoading(true);
    try {
      const allPlanItems = externalPlan || [];
      
      if (allPlanItems.length === 0) {
        setPlanData([]);
        return;
      }
      
      const filteredPlanItems = allPlanItems.filter(
        item => item.nomenclature === state.selectedProduct
      );
      
      if (filteredPlanItems.length === 0) {
        setPlanData([]);
        return;
      }
      
      const rustRequest = {
        items: filteredPlanItems.map((i: PlanItem) => ({
          nomenclature: i.nomenclature,
          month: i.month,
          month_date: i.monthDate.toISOString().split('T')[0],
          planned_expense: i.plannedExpense,
        })),
        working_days_only: false,
      };
      
      const response = await invoke<{ items: DailyPlanItem[] }>('distribute_plan', { request: rustRequest });
      setPlanData(response.items);
      
    } catch (error) {
      console.error('Failed to load plan ', error);
      setPlanData(null);
    } finally {
      setPlanLoading(false);
    }
  };
  
  // Ресайз графиков при изменении сайдбара
  useEffect(() => {
    if (isDesktop) {
      const timer = setTimeout(() => {
        const plotContainers = document.querySelectorAll('.js-plotly-plot');
        plotContainers.forEach((container) => {
          if (container instanceof HTMLElement) {
            Plotly.Plots.resize(container);
          }
        });
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isFilterOpen, isDesktop]);

  const handleSaveToHistory = async () => {
    if (state.result && state.selectedProduct) {
      try {
        await saveHistoryItem(
          state.selectedProduct,
          state.initialStock,
          state.threshold,
          state.deliveryDays,
          state.unitCost,
          state.result.efficiency,
          state.result.avg_stock,
          state.result.actual_avg_stock,
          undefined,
          undefined,
          state.result.total_price,
          state.result.efficiency_abs,
          state.enableOverlapping,
          state.overlapCount
        );
        console.log("Результат сохранен в историю");
      } catch (error) {
        console.error("Failed to save to history:", error);
      }
    }
  };

  if (uploadedFiles.flatMap((f) => f.data).length === 0) {
    return <div className="analysis-empty">Нет доступных данных</div>;
  }

  const selectedOption = CHART_MODE_OPTIONS.find((opt) => opt.value === chartMode) || null;

  const handleChartModeChange = (
    newValue: SingleValue<{ value: string; label: string }>,
  ) => {
    if (newValue) {
      setChartMode(newValue.value as typeof chartMode);
    }
  };

  return (
    <div className={`analysis-view ${isDesktop && isFilterOpen ? 'analysis-view--sidebar-open' : ''}`}>
      
      {state.errorMessage && (
        <ErrorDisplay
          error={state.errorMessage}
          product={state.selectedProduct}
          initialStock={state.initialStock}
          threshold={state.threshold}
          deliveryDays={state.deliveryDays}
          unitCost={state.unitCost}
          onRetry={retry}
        />
      )}

      {/* Десктоп: сайдбар слева от всего контента */}
      {isDesktop && isFilterOpen && (
        <aside className="filter-sidebar">
          <div className="filter-sidebar__header">
            <h3>Параметры</h3>
            <button
              className="filter-close-btn"
              onClick={() => setIsFilterOpen(false)}
              aria-label="Закрыть фильтр"
              title="Закрыть (Esc)"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="filter-sidebar__content">
            <FiltersPanel uploadedFiles={uploadedFiles} />
          </div>
        </aside>
      )}

      {/* Основной контент (сдвигается при открытом сайдбаре) */}
      <main className="analysis-content">
        
        <div className="analysis-top-section">
          <div className="analysis-filter">
            <button
              className="filter-toggle-btn"
              onClick={() => setIsFilterOpen(true)}
              aria-label="Открыть фильтр"
            >
              Параметры
            </button>

            <div className="chart-mode-toggle-wrapper">
              <Select
                options={CHART_MODE_OPTIONS}
                value={selectedOption}
                onChange={handleChartModeChange}
                isSearchable={false}
                classNamePrefix="chart-mode-toggle"
              />
            </div>

            <div className="analysis-buttons">
              <div className="export-section">
                <button
                  className="export-add-btn"
                  onClick={handleSaveToHistory}
                  disabled={!state.result}
                >
                  Сохранить в историю
                </button>
              </div>
            </div>
          </div>

          <div className="analysis-metrics-section">
            {state.result && (
              <MetricsSummary data={state.result} isLoading={state.loading} />
            )}
          </div>
        </div>

        <div className="analysis-bottom-section">
          {/* === Сравнение === */}
          {chartMode === "comparison" && state.result && state.actualData.length > 0 && (
            <>
              <StockSimulationPlot data={state.result} product={state.selectedProduct} />
              <div className="analysis-bottom-section__devider"></div>
              <ActualDataPlot data={state.actualData} product={state.selectedProduct} threshold={state.threshold} />
            </>
          )}

          {/* === Моделирование === */}
          {chartMode === "simulation" && state.result && (
            <StockSimulationPlot data={state.result} product={state.selectedProduct} />
          )}

          {/* === Фактические данные === */}
          {chartMode === "actual" && state.actualData.length > 0 && (
            <ActualDataPlot data={state.actualData} product={state.selectedProduct} threshold={state.threshold} />
          )}

          {/* === Анализ расходов === */}
          {chartMode === "frequency" && (
            <div className="frequency-plot-wrapper">
              {frequencyLoading ? (
                <div className="plot-loading" style={{ height: "75vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  Расчет распределения...
                </div>
              ) : frequencyData ? (
                <ValueFrequencyPlot 
                  data={frequencyData} 
                  product={state.selectedProduct}
                />
              ) : (
                <div className="plot-loading" style={{ height: "75vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  Нет данных для отображения
                </div>
              )}
            </div>
          )}

          {/* === План === */}
          {chartMode === "plan" && (
            <div className="plan-plot-wrapper">
              {planLoading ? (
                <div className="plot-loading" style={{ height: "75vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  Распределение плана...
                </div>
              ) : planData ? (
                <PlanPlot 
                  planData={planData} 
                  product={state.selectedProduct}
                  actualExpenses={state.actualData.map(d => ({
                    date: d.date,
                    expense: d.expense
                  }))}
                />
              ) : (
                <div className="plot-loading" style={{ height: "75vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  Нет данных плана для номенклатуры "{state.selectedProduct}"
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Мобильный: оверлей + модальное окно */}
      {!isDesktop && isFilterOpen && (
        <div
          className="filter-overlay"
          onClick={() => setIsFilterOpen(false)}
          role="presentation"
        >
          <div
            className="filter-panel filter-panel--modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Параметры фильтра"
          >
            <div className="filter-header">
              <h3>Параметры</h3>
              <button
                className="filter-close-btn"
                onClick={() => setIsFilterOpen(false)}
                aria-label="Закрыть фильтр"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <FiltersPanel uploadedFiles={uploadedFiles} />
          </div>
        </div>
      )}
    </div>
  );
}