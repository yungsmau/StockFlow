import { useAnalysis } from '../../../context/AnalysisContext';
import "./FilterPanel.css";

import ProductSelector from "../ProductSelector/ProductSelector";
import ModelParameters from "../ModelParameters/ModelParameters";
import DateFilter from "../DateFilter/DateFilter";

interface FiltersPanelProps {
  uploadedFiles: any[];
}

export default function FiltersPanel({ uploadedFiles }: FiltersPanelProps) {
  const { state, updateParameter, setDateFilter } = useAnalysis();

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

  return (
    <div className="filters-panel-grid">
      <div className="product-selector-container panel-selector">
        <ProductSelector
          uploadedFiles={uploadedFiles}
          selectedProduct={state.selectedProduct}
          onProductChange={(product) => updateParameter({ selectedProduct: product })}
        />
      </div>

      <div className="date-filter-container panel-selector">
        <DateFilter
          value={state.dateFilter}
          onChange={setDateFilter}
          availableRange={state.availableDateRange}
        />
      </div>

      <div className="model-parameters-container">
        <ModelParameters
          initialStock={state.initialStock}
          threshold={state.threshold}
          deliveryDays={state.deliveryDays}
          unitCost={state.unitCost}
          optimalOrder={state.optimalOrder}
          minimalOrder={state.minimalOrder}
          avgExpense={state.result?.avg_expense}
          recommendedThreshold={state.result?.recommended_threshold}
          enableOverlapping={state.enableOverlapping}
          overlapCount={state.overlapCount}
          onOverlappingChange={(enable, count) => 
            updateParameter({ enableOverlapping: enable, overlapCount: count })
          }
          onChange={handleModelChange}
        />
      </div>
    </div>
  );
}