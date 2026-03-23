import Plot from "react-plotly.js";
import { useMemo } from "react";
import { Data, Layout } from "plotly.js";
import { useTheme } from "../../../context/ThemeContext";
import "../AnalysisView.css";

interface DailyPlanItem {
  nomenclature: string;
  date: string;
  planned_expense: number;
}

interface ActualExpensePoint {
  date: string;
  expense: number;
}

interface PlanPlotProps {
  planData: DailyPlanItem[];
  actualExpenses?: ActualExpensePoint[];
  product: string;
}

// Функция нормализации даты к YYYY-MM-DD (UTC)
function normalizeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr;
  }
}

export default function PlanPlot({
  planData,
  actualExpenses = [],
  product,
}: PlanPlotProps) {
  const { theme, colors } = useTheme();

  // Подготовка данных с нормализацией дат
  const { planDates, planValues, actualDates, actualValues } = useMemo(() => {
    if (!planData || planData.length === 0) {
      return { planDates: [], planValues: [], actualDates: [], actualValues: [] };
    }

    // План: нормализуем даты через UTC
    const planDates = planData.map(d => normalizeDate(d.date));
    const planValues = planData.map(d => d.planned_expense);
    
    // Факт: нормализуем даты через UTC
    const actualDates = actualExpenses.map(e => normalizeDate(e.date));
    const actualValues = actualExpenses.map(e => e.expense);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PlanPlot] ${product}:`, {
        planRange: `${planDates[0]} → ${planDates[planDates.length - 1]}`,
        actualRange: `${actualDates[0]} → ${actualDates[actualDates.length - 1]}`,
        planCount: planDates.length,
        actualCount: actualDates.length,
        firstActualValue: actualValues[0]
      });
    }
    
    return { planDates, planValues, actualDates, actualValues };
  }, [planData, actualExpenses, product]);

  // Формирование данных для Plotly
  const plotData: Data[] = useMemo(() => {
    if (!planData || planData.length === 0) return [];

    const tooltipBg = theme === "dark" ? "#2d2d2d" : "#ffffff";
    const tooltipBorder = theme === "dark" ? "#444" : "#ddd";
    const textColor = colors.textPrimary || "#000";

    // Серия 1: План (пунктирная линия)
    const planTrace: Data = {
      x: planDates,
      y: planValues,
      type: "scatter",
      mode: "lines",
      name: "План",
      line: { 
        color: "#4A90E2", 
        width: 2.5, 
        dash: "longdashdot" 
      },
      hovertemplate: `План: %{y:,.0f}<extra>${product}</extra>`,
      hoverlabel: { bgcolor: tooltipBg, bordercolor: tooltipBorder, font: { color: textColor, size: 12 }, namelength: 0 }
    };

    // Серия 2: Факт (столбцы)
    const actualTrace: Data = {
      x: actualDates,
      y: actualValues,
      type: "bar",
      name: "Факт",
      marker: { 
        color: "rgba(34, 197, 94, 0.3)",  // Полупрозрачный зелёный
        line: { 
          color: "#22c55e", 
          width: 1 
        }
      },
      opacity: 0.7,  // Прозрачность, чтобы план был виден сквозь столбцы
      hovertemplate: `Факт: %{y:,.0f}<extra>${product}</extra>`,
      hoverlabel: { bgcolor: tooltipBg, bordercolor: tooltipBorder, font: { color: textColor, size: 12 }, namelength: 0 }
    };

    // План последним = отрисовывается поверх столбцов
    return [actualTrace, planTrace];
  }, [planDates, planValues, actualDates, actualValues, theme, colors, product, planData]);

  const plotKey = `${theme}-${product}-${planDates.length}-${actualDates.length}`;

  if (!planData || planData.length === 0) {
    return (
      <div className="plot-container">
        <div className="plot-loading" style={{ color: colors.textPrimary }}>
          Нет данных плана для номенклатуры "{product}"
        </div>
      </div>
    );
  }

  // Вычисляем общий диапазон значений
  const maxValue = Math.max(...planValues, ...actualValues, 1);
  
  // Безопасное вычисление диапазона дат
  const minDate = Math.min(
    new Date(planDates[0]).getTime(), 
    actualDates.length > 0 ? new Date(actualDates[0]).getTime() : Infinity
  );
  const maxDate = Math.max(
    new Date(planDates[planDates.length - 1]).getTime(), 
    actualDates.length > 0 ? new Date(actualDates[actualDates.length - 1]).getTime() : 0
  );

  const layout: Partial<Layout> = {
    autosize: true,
    barmode: "overlay",  // Столбцы под линией
    bargap: 0.1,  // Маленький зазор между столбцами (для ежедневных данных)
    xaxis: {
      tickfont: { size: 10, color: colors.textPrimary, family: '"Helvetica", sans-serif' },
      spikemode: "across",
      spikecolor: colors.borderColor,
      showline: true,
      linewidth: 1,
      linecolor: colors.borderColor,
      ticklabelposition: "inside bottom",
      type: 'date',
      range: [minDate, maxDate]
    },
    yaxis: {
      tickfont: { size: 10, color: colors.textPrimary },
      tickformat: ',.0f',
      gridcolor: colors.borderColor,
      zeroline: true,
      rangemode: 'tozero',
      range: [0, maxValue * 1.1]
    },
    paper_bgcolor: colors.bgSecondary,
    plot_bgcolor: colors.bgSecondary,
    font: { family: '"Helvetica", sans-serif', color: colors.textPrimary },
    legend: {
      font: { color: colors.textPrimary, size: 10 },
      orientation: "h",
      x: 0.5, y: 1, yanchor: "bottom", xanchor: "center",
      bgcolor: colors.bgSecondary,
    },
    margin: { l: 0, r: 0, t: 0, b: 0 },
    hovermode: "x unified",
  };

  return (
    <div className="plot-container">
      <Plot
        key={plotKey}
        data={plotData}
        layout={layout}
        config={{ responsive: true, displaylogo: false, doubleClick: "reset" }}
        style={{ width: "100%", height: "100%" }}
        useResizeHandler={true}
      />
    </div>
  );
}