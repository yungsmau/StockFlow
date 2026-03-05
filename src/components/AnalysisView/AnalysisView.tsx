import { useState } from "react";
import Select, { SingleValue } from 'react-select';
import "./AnalysisView.css";

import FiltersPanel from "./FilterPanel/FilterPanel";
import MetricsSummary from "./Metrics/MetricsSummary";
import StockSimulationPlot from "./Plots/StockSimulationPlot";
import ActualDataPlot from "./Plots/ActualDataPlot";
import ErrorDisplay from "./ErrorDisplay/ErrorDisplay";

import { useAnalysis } from '../../context/AnalysisContext';

interface ExportItem {
  product: string;
  initialStock: number;
  threshold: number;
  deliveryDays: number;
  unitCost: number;
  efficiency: number;
  avgStock: number;
  actualAvgStock: number;
}

interface RowData {
  nomenclature: string;
  date: string;
  income: number;
  expense: number;
  stock: number;
}

interface UploadedFile {
  name: string;
  format: string;
  data: RowData[];
}

interface AnalysisViewProps {
  uploadedFiles: UploadedFile[];
  onAddToExport: (item: ExportItem) => void;
}

const CHART_MODE_OPTIONS = [
  { value: 'comparison', label: 'Сравнение' },
  { value: 'simulation', label: 'Моделирование' },
  { value: 'actual', label: 'Факт' },
];

export default function AnalysisView({ 
  uploadedFiles,
  onAddToExport,
}: AnalysisViewProps) {
  const { state, retry } = useAnalysis();
  const [chartMode, setChartMode] = useState<'comparison' | 'actual' | 'simulation'>('comparison');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleAddToExport = () => {
    if (state.result && state.selectedProduct) {
      const exportItem: ExportItem = {
        product: state.selectedProduct,
        initialStock: state.initialStock,
        threshold: state.threshold,
        deliveryDays: state.deliveryDays,
        unitCost: state.unitCost,
        efficiency: state.result.efficiency,
        avgStock: state.result.avg_stock,
        actualAvgStock: state.result.actual_avg_stock,
      };
      onAddToExport(exportItem);
    }
  };

  if (uploadedFiles.flatMap(f => f.data).length === 0) {
    return <div>Нет доступных данных</div>;
  }

  const selectedOption = CHART_MODE_OPTIONS.find(opt => opt.value === chartMode) || null;

  const handleChartModeChange = (newValue: SingleValue<{ value: string; label: string }>) => {
    if (newValue) {
      setChartMode(newValue.value as any);
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
          {/* Кнопка "Фильтр" */}
          <button
            className="filter-toggle-btn"
            onClick={() => setIsFilterOpen(true)}
            aria-label="Открыть фильтр"
          >
            Параметры
          </button>

          {/* Кнопка переключения графиков — ПОД "Фильтром" */}
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
                onClick={handleAddToExport}
                disabled={!state.result}
              >
                Добавить в экспорт
              </button>
            </div>
          </div>

          {/* Всплывающий фильтр */}
          {isFilterOpen && (
            <div className="filter-overlay" onClick={() => setIsFilterOpen(false)}>
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

        {/* Основной контент — ТОЛЬКО метрики */}
        <div className="analysis-metrics-section">
          {state.result && <MetricsSummary data={state.result} isLoading={state.loading} />}
        </div>
      </div>

      {/* Графики и экспорт */}
      <div className="analysis-bottom-section">

        {/* Графики */}
        {chartMode === 'comparison' && state.result && state.actualData.length > 0 && (
          <>
            <StockSimulationPlot 
              data={state.result} 
              product={state.selectedProduct} 
              heightPercent={40}
            />
            <ActualDataPlot 
              data={state.actualData} 
              product={state.selectedProduct} 
              threshold={state.threshold}
              heightPercent={35}
            />
          </>
        )}

        {chartMode === 'simulation' && state.result && (
          <StockSimulationPlot 
            data={state.result} 
            product={state.selectedProduct} 
            heightPercent={75}
          />
        )}

        {chartMode === 'actual' && state.actualData.length > 0 && (
          <ActualDataPlot 
            data={state.actualData} 
            product={state.selectedProduct} 
            threshold={state.threshold}
            heightPercent={75}
          />
        )}
      </div>
    </div>
  );
}