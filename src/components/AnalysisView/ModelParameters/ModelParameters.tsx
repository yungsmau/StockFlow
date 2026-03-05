import ParameterField from "./ParameterField";
import RecommendationField from "./RecommendationField";
import { useModelForm } from "../../../hooks/useModelForm";
import { ModelData } from "../../../model/modelSchema";
import './ModelParameters.css';

interface Props extends ModelData {
  recommendedThreshold?: number;
  avgExpense?: number;
  onChange: (data: ModelData) => void;
}

export default function ModelParameters({
  initialStock,
  threshold,
  deliveryDays,
  unitCost,
  recommendedThreshold,
  avgExpense,
  onChange,
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
  const maxThreshold = recommendedMax;

  return (
    <>
      <ParameterField
        label="Поставка"
        value={values.initialStock}
        error={errors.initialStock}
        type="integer"
        min={1}
        max={maxInitialStock}
        onInput={(v) => updateField("initialStock", v)}
        onConfirm={() => commit(onChange)}
      />

      <ParameterField
        label="Порог"
        value={values.threshold}
        error={errors.threshold}
        type="integer"
        min={1}
        max={maxThreshold}
        onInput={(v) => updateField("threshold", v)}
        onConfirm={() => commit(onChange)}
      />

      <ParameterField
        label="Дней доставки"
        value={values.deliveryDays}
        error={errors.deliveryDays}
        type="integer"
        onInput={(v) => updateField("deliveryDays", v)}
        onConfirm={() => commit(onChange)}
      />

      <ParameterField
        label="Цена"
        value={values.unitCost}
        error={errors.unitCost}
        type="float"
        onInput={(v) => updateField("unitCost", v)}
        onConfirm={() => commit(onChange)}
      />

      {recommendedThreshold !== undefined && (
        <RecommendationField
          label="Рекомендуемый порог"
          value={recommendedThreshold}
          type="integer"
        />
      )}

      {avgExpense !== undefined && (
        <RecommendationField
          label="Средний расход"
          value={avgExpense}
          type="integer" 
        />
      )}
    </>
  );
}