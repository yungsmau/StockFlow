import ParameterField from "./ParameterField";
import RecommendationCard from "./RecommendationCard";
import { useModelForm } from "../../../hooks/useModelForm";
import { ModelData } from "../../../model/modelSchema";
import './ModelParameters.css';

interface Props extends ModelData {
  recommendedThreshold?: number;
  onChange: (data: ModelData) => void;
}

export default function ModelParameters({
  initialStock,
  threshold,
  deliveryDays,
  unitCost,
  recommendedThreshold,
  onChange,
}: Props) {
  const { values, errors, updateField, commit } = useModelForm({
    initialStock,
    threshold,
    deliveryDays,
    unitCost,
  });

  return (
    <>
      <ParameterField
        label="Поставка"
        value={values.initialStock}
        error={errors.initialStock}
        type="integer"
        min={1}
        max={5_000_000}
        onInput={(v) => updateField("initialStock", v)}
        onConfirm={() => commit(onChange)}
      />

      <ParameterField
        label="Порог"
        value={values.threshold}
        error={errors.threshold}
        type="integer"
        min={1}
        max={5_000_000}
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
        <RecommendationCard recommendedThreshold={recommendedThreshold} />
      )}
    </>
  );
}