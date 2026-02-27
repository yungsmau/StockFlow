import { useState, useRef, useEffect } from "react";
import "./ModelParameters.css";

interface ModelParametersProps {
  initialStock: number;
  threshold: number;
  deliveryDays: number;
  unitCost: number;
  recommendedThreshold?: number;
  onInitialStockChange: (value: number) => void;
  onThresholdChange: (value: number) => void;
  onDeliveryDaysChange: (value: number) => void;
  onUnitCostChange: (value: number) => void;
}

const MAX_VALUES = {
  initialStock: 10000000,
  threshold: 10000000,
  deliveryDays: 365,
  unitCost: 1000000
};

const PARAMETER_HINTS = {
  initialStock: "Определяет начальный запас товара на складе",
  threshold: "При достижении этого уровня оформляется поставка",
  deliveryDays: "Дней от оформления заказа до прихода",
  unitCost: "Себестоимость одной единицы товара в рублях.",
  recommendedThreshold: "Стартовая точка для подбора параметра порога."
};

export default function ModelParameters({
  initialStock,
  threshold,
  deliveryDays,
  unitCost,
  recommendedThreshold,
  onInitialStockChange,
  onThresholdChange,
  onDeliveryDaysChange,
  onUnitCostChange
}: ModelParametersProps) {
  const [initialStockInput, setInitialStockInput] = useState(String(initialStock));
  const [thresholdInput, setThresholdInput] = useState(String(threshold));
  const [deliveryDaysInput, setDeliveryDaysInput] = useState(String(deliveryDays));
  const [unitCostInput, setUnitCostInput] = useState(unitCost.toFixed(2));

  const [errors, setErrors] = useState({
    initialStock: '',
    threshold: '',
    deliveryDays: '',
    unitCost: ''
  });

  const validateValue = (value: number, paramName: keyof typeof MAX_VALUES): string => {
    if (value > MAX_VALUES[paramName]) {
      return `Максимальное значение: ${MAX_VALUES[paramName].toLocaleString('ru-RU')}`;
    }
    if (value < 0) {
      return 'Значение не может быть отрицательным';
    }
    return '';
  };

  const updateValue = (
    input: string, 
    setter: (v: number) => void, 
    paramName: keyof typeof MAX_VALUES,
    fallback: number = 0
  ) => {
    const val = parseFloat(input);
    
    if (!isNaN(val)) {
      const error = validateValue(val, paramName);
      setErrors(prev => ({ ...prev, [paramName]: error }));
      
      if (!error) {
        setter(val);
      }
    } else {
      setErrors(prev => ({ ...prev, [paramName]: 'Введите корректное число' }));
      setter(fallback);
    }
  };

  const handleBlur = (
    input: string,
    setter: (v: number) => void,
    paramName: keyof typeof MAX_VALUES,
    fallback: number,
    displaySetter: (v: string) => void
  ) => {
    updateValue(input, setter, paramName, fallback);
    displaySetter(String(input));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    input: string,
    setter: (v: number) => void,
    paramName: keyof typeof MAX_VALUES,
    fallback: number,
    displaySetter: (v: string) => void
  ) => {
    if (e.key === "Enter") {
      updateValue(input, setter, paramName, fallback);
      displaySetter(String(input));
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <>
      <ParameterWithTooltip
        label="Поставка"
        hint={PARAMETER_HINTS.initialStock}
        value={initialStockInput}
        onChange={(e) => setInitialStockInput(e.target.value)}
        onBlur={() => handleBlur(
          initialStockInput, 
          onInitialStockChange, 
          'initialStock', 
          100, 
          setInitialStockInput
        )}
        onKeyDown={(e) => handleKeyDown(
          e, 
          initialStockInput, 
          onInitialStockChange, 
          'initialStock', 
          100, 
          setInitialStockInput
        )}
        type="number"
        step="1"
        min="0"
        max={MAX_VALUES.initialStock.toString()}
        error={errors.initialStock}
      />

      <ParameterWithTooltip
        label="Порог"
        hint={PARAMETER_HINTS.threshold}
        value={thresholdInput}
        onChange={(e) => setThresholdInput(e.target.value)}
        onBlur={() => handleBlur(
          thresholdInput, 
          onThresholdChange, 
          'threshold', 
          100, 
          setThresholdInput
        )}
        onKeyDown={(e) => handleKeyDown(
          e, 
          thresholdInput, 
          onThresholdChange, 
          'threshold', 
          100, 
          setThresholdInput
        )}
        type="number"
        step="1"
        min="0"
        max={MAX_VALUES.threshold.toString()}
        error={errors.threshold}
      />

      <ParameterWithTooltip
        label="Дней доставки"
        hint={PARAMETER_HINTS.deliveryDays}
        value={deliveryDaysInput}
        onChange={(e) => setDeliveryDaysInput(e.target.value)}
        onBlur={() => handleBlur(
          deliveryDaysInput, 
          onDeliveryDaysChange, 
          'deliveryDays', 
          10, 
          setDeliveryDaysInput
        )}
        onKeyDown={(e) => handleKeyDown(
          e, 
          deliveryDaysInput, 
          onDeliveryDaysChange, 
          'deliveryDays', 
          10, 
          setDeliveryDaysInput
        )}
        type="number"
        step="1"
        min="0"
        max={MAX_VALUES.deliveryDays.toString()}
        error={errors.deliveryDays}
      />

      <ParameterWithTooltip
        label="Цена, руб./ед"
        hint={PARAMETER_HINTS.unitCost}
        value={unitCostInput}
        onChange={(e) => setUnitCostInput(e.target.value)}
        onBlur={() => handleBlur(
          unitCostInput, 
          onUnitCostChange, 
          'unitCost', 
          1, 
          setUnitCostInput
        )}
        onKeyDown={(e) => handleKeyDown(
          e, 
          unitCostInput, 
          onUnitCostChange, 
          'unitCost', 
          1, 
          setUnitCostInput
        )}
        type="number"
        step="0.01"
        min="0"
        max={MAX_VALUES.unitCost.toString()}
        error={errors.unitCost}
      />

      {/* Карточка рекомендации */}
      {recommendedThreshold !== undefined && recommendedThreshold !== threshold && (
        <RecommendationCard 
          recommendedThreshold={recommendedThreshold}
          hint={PARAMETER_HINTS.recommendedThreshold}
        />
      )}
    </>
  );
}

interface RecommendationCardProps {
  recommendedThreshold: number;
  hint: string;
}

function RecommendationCard({ recommendedThreshold, hint }: RecommendationCardProps) {
  const [showHint, setShowHint] = useState(false);
  const iconRef = useRef<HTMLSpanElement>(null);

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        iconRef.current && 
        !iconRef.current.contains(event.target as Node)
      ) {
        setShowHint(false);
      }
    };

    if (showHint) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHint]);

  return (
    <div className="param-card param-recommendation">
      {!showHint ? (
        <>
          <div className="param-content">
            <span className="param-label">Рекомендуемый порог</span>
            <div className="recommendation-value-display">
              {recommendedThreshold}
            </div>
          </div>
          <span 
            ref={iconRef}
            className="hint-icon"
            onClick={toggleHint}
          >
          </span>
        </>
      ) : (
        <div 
          className="param-hint-overlay"
          onClick={toggleHint}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

interface ParameterWithTooltipProps {
  label: string;
  hint: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  type: string;
  step?: string;
  min?: string;
  max?: string; 
  error?: string; 
}

function ParameterWithTooltip({
  label,
  hint,
  value,
  onChange,
  onBlur,
  onKeyDown,
  type,
  step,
  min,
  max,
  error
}: ParameterWithTooltipProps) {
  const [showHint, setShowHint] = useState(false);
  const iconRef = useRef<HTMLSpanElement>(null);

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        iconRef.current && 
        !iconRef.current.contains(event.target as Node)
      ) {
        setShowHint(false);
      }
    };

    if (showHint) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHint]);

  return (
    <div className={`param-card param-card-metrics ${error ? 'param-card-error' : ''}`}>
      {!showHint ? (
        <>
          <div className="param-content">
            <span className="param-label">{label}</span>
            <input
              type={type}
              step={step}
              min={min}
              max={max} 
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              className={`param-input ${error ? 'param-input-error' : ''}`}
            />
          </div>
          <span 
            ref={iconRef}
            className="hint-icon"
            onClick={toggleHint}
          >
          </span>
        </>
      ) : (
        <div 
          className="param-hint-overlay"
          onClick={toggleHint}
        >
          {hint}
        </div>
      )}
      
      {/* Отображение ошибки */}
      {error && (
        <div className="param-error-message">
          {error}
        </div>
      )}
    </div>
  );
}
