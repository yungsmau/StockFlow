import "./ModelParameters.css";

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

interface Props {
  label: string;
  value: number;
  type?: 'integer' | 'float';
}

export default function RecommendationField({
  label,
  value,
  type = 'integer'
}: Props) {
  let formattedValue: string;

  if (type === 'integer') {
    formattedValue = formatNumber(Math.round(value));
  } else {
    if (value > 0) {
      formattedValue = formatNumber(parseFloat(value.toFixed(2)));
    } else {
      formattedValue = '—';
    }
  }

  return (
    <div className="param-card param-recommendation">
      <div className="param-content">
        <div className="recommendation-value-display">
          {formattedValue}
        </div>
        <span className="param-label">{label}</span>
      </div>
    </div>
  );
}