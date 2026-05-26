import ParameterField from "./ParameterField";
import RecommendationField from "./RecommendationField";
import { useModelForm } from "../../../hooks/useModelForm";
import { ModelData } from "../../../model/modelSchema";
import './ModelParameters.css';

interface Props extends ModelData {
  recommendedThreshold?: number;
  avgExpense?: number;
  optimalOrder?: number;
  minimalOrder?: number;
  onChange: (data: ModelData) => void;
  enableOverlapping: boolean;
  overlapCount: number;
  onOverlappingChange: (enable: boolean, count: number) => void;
}

export default function ModelParameters({
  initialStock,
  threshold,
  deliveryDays,
  unitCost,
  recommendedThreshold,
  avgExpense,
  optimalOrder,
  minimalOrder,
  onChange,
  enableOverlapping,
  overlapCount,
  onOverlappingChange,
}: Props) {
  const { values, errors, updateField, commit } = useModelForm({
    initialStock,
    threshold,
    deliveryDays,
    unitCost,
  });

  const recommendedMax = recommendedThreshold !== undefined 
    ? Math.max(100, Math.ceil(recommendedThreshold * 1.1)) 
    : 5_000_000;

  const maxInitialStock = recommendedMax;
  const maxThreshold = Math.min(recommendedMax, values.initialStock);

  const resetInitialStock = () => {
    const newValue = minimalOrder ?? 100;
    updateField("initialStock", String(newValue));
    onChange({
      initialStock: newValue,
      threshold: values.threshold,
      deliveryDays: values.deliveryDays,
      unitCost: values.unitCost
    });
  };

  const resetThreshold = () => {
    const newValue = minimalOrder ?? 100;
    updateField("threshold", String(newValue));
    onChange({
      initialStock: values.initialStock,
      threshold: newValue,
      deliveryDays: values.deliveryDays,
      unitCost: values.unitCost
    });
  };

  const resetDeliveryDays = () => {
    const newValue = 10;
    updateField("deliveryDays", String(newValue));
    onChange({
      initialStock: values.initialStock,
      threshold: values.threshold,
      deliveryDays: newValue,
      unitCost: values.unitCost
    });
  };

  const resetUnitCost = () => {
    const newValue = 1;
    updateField("unitCost", String(newValue));
    onChange({
      initialStock: values.initialStock,
      threshold: values.threshold,
      deliveryDays: values.deliveryDays,
      unitCost: newValue
    });
  };

  const handleOverlappingToggle = (checked: boolean) => {
    onOverlappingChange(checked, checked ? Math.max(overlapCount, 2) : 1);
  }

  const handleOverlapCountChange = (value: string) => {
    const num = parseInt(value) || 2;
    const clamped = Math.max(2, Math.min(10, num));
    onOverlappingChange(true, clamped)
  }

  return (
    <>
      <ParameterField
        label="Поставка, ед."
        value={values.initialStock}
        error={errors.initialStock}
        type="integer"
        min={1}
        max={maxInitialStock}
        onInput={(v) => updateField("initialStock", v)}
        onConfirm={() => commit(onChange)}
        onResetToDefault={resetInitialStock}
      />

      <ParameterField
        label="Порог, ед."
        value={values.threshold}
        error={errors.threshold}
        type="integer"
        min={1}
        max={maxThreshold}
        onInput={(v) => updateField("threshold", v)}
        onConfirm={() => commit(onChange)}
        onResetToDefault={resetThreshold}
      />

      <ParameterField
        label="Скор поставки, дни"
        value={values.deliveryDays}
        error={errors.deliveryDays}
        type="integer"
        onInput={(v) => updateField("deliveryDays", v)}
        onConfirm={() => commit(onChange)}
        onResetToDefault={resetDeliveryDays}
      />

      <ParameterField
        label="Цена, руб./ед"
        value={values.unitCost}
        error={errors.unitCost}
        type="float"
        onInput={(v) => updateField("unitCost", v)}
        onConfirm={() => commit(onChange)}
        onResetToDefault={resetUnitCost}
      />

      {/* Рекомендации из модели */}
      {recommendedThreshold !== undefined && (
        <RecommendationField
          label="Максимальный расход, ед."
          value={recommendedThreshold}
          type="integer"
        />
      )}

      {avgExpense !== undefined && (
        <RecommendationField
          label="Средний расход, ед."
          value={avgExpense}
          type="integer" 
        />
      )}

      {/* Рекомендации из справочника */}
      {minimalOrder !== undefined && (
        <RecommendationField
          label="Минимальный объем закупа, ед."
          value={minimalOrder}
          type="integer"
        />
      )}

      {optimalOrder !== undefined && (
        <RecommendationField
          label="Оптимальный объем закупа, ед."
          value={optimalOrder}
          type="integer"
        />
      )}

      <div className="model-section overlapping-section">
        <h4 className="section-title">Стратегия закупок</h4>
        
        {/* Переключатель */}
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={enableOverlapping}
            onChange={(e) => handleOverlappingToggle(e.target.checked)}
            className="toggle-input"
          />
          <span className="toggle-text">Наложение поставок</span>
        </label>

        {/* Контрол количества заказов (показывается только если включено) */}
        {enableOverlapping && (
          <div className="overlap-control">
            <label className="overlap-label">
              <span className="overlap-label-text">Параллельных заказов:</span>
              <input
                type="number"
                min="2"
                max="10"
                value={overlapCount}
                onChange={(e) => handleOverlapCountChange(e.target.value)}
                className="overlap-input"
              />
            </label>
            
            {/* Подсказка с расчётом интервала */}
            <div className="overlap-hint">
              Интервал заказа: ~<strong>{Math.floor(deliveryDays / overlapCount)}</strong> дн.
              {overlapCount > 1 && (
                <span className="hint-note"> (из {deliveryDays} / {overlapCount})</span>
              )}
            </div>
          </div>
        )}
      </div>

    </>
  );
}