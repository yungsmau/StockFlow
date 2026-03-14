import { useState, useEffect } from "react";
import Select, { SingleValue } from "react-select";
import "./AnalysisView.css";

import FiltersPanel from "./FilterPanel/FilterPanel";
import MetricsSummary from "./Metrics/MetricsSummary";
import StockSimulationPlot from "./Plots/StockSimulationPlot";
import ActualDataPlot from "./Plots/ActualDataPlot";
import ValueFrequencyPlot from "./Plots/ValueFrequencyPlot";
import ErrorDisplay from "./ErrorDisplay/ErrorDisplay";

import { saveHistoryItem } from "../../utils/historyService";
import { useAnalysis } from "../../context/AnalysisContext";
import { invoke } from "@tauri-apps/api/core";

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
}

const CHART_MODE_OPTIONS = [
  { value: "comparison", label: "Сравнение" },
  { value: "simulation", label: "Моделирование" },
  { value: "actual", label: "Фактические данные" },
  { value: "frequency", label: "Анализ расходов" },
  { value: "frequency", label: "Потребности" },
];

export default function AnalysisView({ uploadedFiles }: AnalysisViewProps) {
  const { state, retry, setChartMode } = useAnalysis(); 
  
  const chartMode = state.chartMode; 
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [frequencyData, setFrequencyData] = useState<ValueFrequencyResult | null>(null);
  const [frequencyLoading, setFrequencyLoading] = useState(false);

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
          state.result.efficiency_abs
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
    <div className="analysis-view">
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

          {isFilterOpen && (
            <div
              className="filter-overlay"
              onClick={() => setIsFilterOpen(false)}
            >
              <div
                className="filter-panel"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="filter-header">
                  <h3>Параметры</h3>
                  <button
                    className="filter-close-btn"
                    onClick={() => setIsFilterOpen(false)}
                    aria-label="Закрыть фильтр"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4L4 12M4 4L12 12" stroke="#1E1E1E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                <FiltersPanel uploadedFiles={uploadedFiles} />
              </div>
            </div>
          )}
        </div>

        <div className="analysis-metrics-section">
          {state.result && (
            <MetricsSummary data={state.result} isLoading={state.loading} />
          )}
        </div>
      </div>

      {/* Графики */}
      <div className="analysis-bottom-section">
        {chartMode === "comparison" && state.result && state.actualData.length > 0 && (
          <>
            <StockSimulationPlot data={state.result} product={state.selectedProduct} heightPercent={40} />
            <ActualDataPlot data={state.actualData} product={state.selectedProduct} threshold={state.threshold} heightPercent={35} />
          </>
        )}

        {chartMode === "simulation" && state.result && (
          <StockSimulationPlot data={state.result} product={state.selectedProduct} heightPercent={75} />
        )}

        {chartMode === "actual" && state.actualData.length > 0 && (
          <ActualDataPlot data={state.actualData} product={state.selectedProduct} threshold={state.threshold} heightPercent={75} />
        )}

        {/* ✅ Режим: Распределение */}
        {chartMode === "frequency" && (
          <div className="frequency-plot-wrapper">
            {frequencyLoading ? (
              <div className="plot-loading" style={{ height: "35vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                Расчет распределения...
              </div>
            ) : frequencyData ? (
              <ValueFrequencyPlot 
                data={frequencyData} 
                product={state.selectedProduct}
                heightPercent={75}
              />
            ) : (
              <div className="plot-loading" style={{ height: "35vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                Нет данных для отображения
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}