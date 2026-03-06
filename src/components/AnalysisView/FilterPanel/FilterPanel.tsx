import { useAnalysis } from '../../../context/AnalysisContext';
import "./FilterPanel.css";

import ProductSelector from "../ProductSelector/ProductSelector";
import ModelParameters from "../ModelParameters/ModelParameters";

interface FiltersPanelProps {
  uploadedFiles: any[];
}

export default function FiltersPanel({ uploadedFiles }: FiltersPanelProps) {
  const { state, updateParameter } = useAnalysis();

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
          optimalOrder={state.optimalOrder}
          minimalOrder={state.minimalOrder}
          avgExpense={state.result?.avg_expense}
          recommendedThreshold={state.result?.recommended_threshold}
          onChange={handleModelChange}
        />
      </div>
    </div>
  );
}