import { useState } from "react";
import "./AnalysisView.css";

import ProductSelector from "./ProductSelector/ProductSelector";
import ModelParameters from "./ModelParameters/ModelParameters";
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
  exportData: ExportItem[];
  onAddToExport: (item: ExportItem) => void;
  onViewExport: () => void;
}

export default function AnalysisView({ 
  uploadedFiles,
  onAddToExport,
}: AnalysisViewProps) {
  const { state, updateParameter, retry } = useAnalysis();
  const [chartMode, setChartMode] = useState<'comparison' | 'actual' | 'simulation'>('comparison');

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

  const handleModelChange = (newData: {
    initialStock: number;
    threshold: number;
    deliveryDays: number;
    unitCost: number;
  }) => {
    updateParameter({
      initialStock: newData.initialStock,
      threshold: newData.threshold,
      deliveryDays: newData.deliveryDays,
      unitCost: newData.unitCost,
    });
  };

  if (uploadedFiles.flatMap(f => f.data).length === 0) {
    return <div>Нет доступных данных</div>;
  }

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

      <div className="analysis-controls">
        <div className="product-selector-container">
          <ProductSelector
            uploadedFiles={uploadedFiles}
            selectedProduct={state.selectedProduct}
            onProductChange={(product) => updateParameter({ selectedProduct: product })}
          />
        </div>
        
        <div className="model-parameters-container">
          <ModelParameters
            initialStock={state.initialStock}
            threshold={state.threshold}
            deliveryDays={state.deliveryDays}
            unitCost={state.unitCost}
            recommendedThreshold={state.result?.recommended_threshold}
            onChange={handleModelChange}
          />
        </div>
      </div>

      {state.result && <MetricsSummary data={state.result} isLoading={state.loading} />}

      {/* Переключатель графиков */}
      <div className="analysis-buttons">
        <div className="chart-toggle">
          <button 
            className={chartMode === 'comparison' ? 'active' : ''} 
            onClick={() => setChartMode('comparison')}
          >
            Сравнение   
          </button>

          <button 
            className={chartMode === 'simulation' ? 'active' : ''}
            onClick={() => setChartMode('simulation')}
          >
            Моделирование 
          </button>

          <button 
            className={chartMode === 'actual' ? 'active' : ''}
            onClick={() => setChartMode('actual')}
          >
            Фактические данные
          </button>
        </div>

        {/* Блок экспорта */}
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
            heightPercent={30}
          />
        </>
      )}

      {chartMode === 'simulation' && state.result && (
        <StockSimulationPlot 
          data={state.result} 
          product={state.selectedProduct} 
          heightPercent={70}
        />
      )}

      {chartMode === 'actual' && state.actualData.length > 0 && (
        <ActualDataPlot 
          data={state.actualData} 
          product={state.selectedProduct} 
          heightPercent={70}
        />
      )}
    </div>
  );
}