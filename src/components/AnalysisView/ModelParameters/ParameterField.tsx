import { useState, useEffect } from 'react';
import { NumericFormat } from 'react-number-format';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

import "./ModelParameters.css";

interface Props {
  label: string;
  value: number;
  error?: string;
  onInput: (raw: string) => void;
  onConfirm: (raw: string) => void;
  type?: 'integer' | 'float';
  min?: number;
  max?: number;
  onResetToDefault?: () => void;
}

export default function ParameterField({
  label,
  value,
  error,
  onInput,
  onConfirm,
  type = 'float',
  min = -Infinity,
  max = Infinity,
  onResetToDefault, 
}: Props) {
  const [inputValue, setInputValue] = useState(String(value));
  const [sliderValue, setSliderValue] = useState(value);

  const sliderMin = isFinite(min) ? min : 0;
  const sliderMax = isFinite(max) ? max : 100;

  useEffect(() => {
    setInputValue(String(value));
    setSliderValue(value);
  }, [value]);

  const handleValueChange = (values: { value: string }) => {
    const raw = values.value;
    setInputValue(raw);
    onInput(raw);
  };

  const handleBlur = () => {
    onConfirm(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onConfirm(inputValue);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleSliderChange = (newValue: number | number[]) => {
    const numValue = Array.isArray(newValue) ? newValue[0] : newValue;
    const formatted = type === 'integer' 
      ? Math.round(numValue) 
      : parseFloat(numValue.toFixed(2));
    
    setSliderValue(formatted);
    setInputValue(String(formatted));
    onInput(String(formatted));
  };

  const handleSliderAfterChange = (newValue: number | number[]) => {
    const numValue = Array.isArray(newValue) ? newValue[0] : newValue;
    const formatted = type === 'integer' 
      ? Math.round(numValue) 
      : parseFloat(numValue.toFixed(2));
    
    onConfirm(String(formatted));
  };

  // Обработчик сброса
  const handleReset = () => {
    if (onResetToDefault) {
      onResetToDefault();
    }
  };

  return (
    <div className={`param-card param-card-parameters ${error ? "param-card-error" : ""}`}>
      <div className="param-content">
        <span className="param-label">{label}</span>
        
        {/* Контейнер для инпута и кнопки */}
        <div className="param-input-container">
          <NumericFormat
            className="param-input"
            value={inputValue}
            onValueChange={handleValueChange}
            thousandSeparator=" "
            decimalSeparator=","
            decimalScale={type === 'float' ? 2 : 0}
            fixedDecimalScale={type === 'float'}
            allowNegative={min < 0}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            isAllowed={(values) => {
              const { floatValue } = values;
              return floatValue === undefined || (floatValue >= min && floatValue <= max);
            }}
          />
          
          {/* Кнопка сброса */}
          {onResetToDefault && (
            <button
              className="param-reset-btn"
              onClick={handleReset}
              title="Сбросить к значению по умолчанию (1)"
            >
              ↺
            </button>
          )}
        </div>

        {/* Ползунок */}
        {isFinite(min) && isFinite(max) && (
          <div className="param-slider">
            <Slider
              min={sliderMin}
              max={sliderMax}
              value={sliderValue}
              onChange={handleSliderChange}
              onChangeComplete={handleSliderAfterChange}
              step={type === 'integer' ? 1 : 0.01}
            />
          </div>
        )}
      </div>
      {error && <div className="param-error-message">{error}</div>}
    </div>
  );
}