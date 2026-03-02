import { useState } from "react";

interface Props {
  recommendedThreshold: number;
}

export default function RecommendationCard({
  recommendedThreshold,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="param-card param-recommendation">
      {!open ? (
        <>
          <div className="param-content">
            <span className="param-label">Рекомендуемый порог</span>
            <div className="recommendation-value-display">{recommendedThreshold}</div>
          </div>
          <span
            className="hint-icon"
            onClick={() => setOpen(true)}
          />
        </>
      ) : (
        <div
          className="param-hint-overlay"
          onClick={() => setOpen(false)}
        >
          Рассчитано на основе модели спроса.
        </div>
      )}
    </div>
  );
}