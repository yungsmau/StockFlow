import { useState, useEffect } from 'react';
import { NumericFormat } from 'react-number-format';

interface Props {
  label: string;
  value: number;
  error?: string;
  onInput: (raw: string) => void;
  onConfirm: (raw: string) => void;
  type?: 'integer' | 'float';
  min?: number;
  max?: number;
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
}: Props) {
  const [inputValue, setInputValue] = useState(String(value));

  useEffect(() => {
    setInputValue(String(value));
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

  return (
    <div className={`param-card ${error ? "param-card-error" : ""}`}>
      <div className="param-content">
        <span className="param-label">{label}</span>
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
      </div>
      {error && <div className="param-error-message">{error}</div>}
    </div>
  );
}