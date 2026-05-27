import Plot from "react-plotly.js";
import { useTheme } from "../../../context/ThemeContext";
import "../AnalysisView.css";

interface ComputeResponse {
  dates: string[];
  starting_stock: number[];
  incoming: number[];
  spent: number[];
  threshold: number;
  order_created?: number[]; 
}

interface StockSimulationPlotProps {
  data: ComputeResponse;
  product: string;
}

const StockSimulationPlot = ({ 
  data, 
  product,
}: StockSimulationPlotProps) => {
  const { theme, colors } = useTheme();

  if (!data || data.dates.length === 0) {
    return (
      <div className="plot-container">
        <div className="plot-loading">
          Загрузка данных...
        </div>
      </div>
    );
  }

  const plotBgColor = colors.bgSecondary;
  const textColor = colors.textPrimary;
  const gridColor = colors.borderColor;
  const tooltipBg = theme === 'dark' ? '#2d2d2d' : '#ffffff';
  const tooltipBorder = theme === 'dark' ? '#444' : '#ddd';

  const expenseColors = data.spent.map((spent, i) => {
    if (spent > 0 && data.starting_stock[i] === 0) {
      return '#dc3545';
    }
    return 'orange';
  });

  // ✅ Подготовка данных для маркеров создания заказа
  // Показываем точку (уровень порога) только если order_created[i] === 1
  const orderMarkersY = data.order_created 
    ? data.order_created.map((val) => val === 1 ? data.threshold : null)
    : [];
  
  const orderMarkersText = data.order_created
    ? data.order_created.map((val) => val === 1 ? 'Заказ создан' : '')
    : [];

  const plotKey = `${theme}-${product}-${data.threshold}-${data.dates.length}-${data.dates[0]}-${data.dates[data.dates.length - 1]}`;

  return (
    <div className="plot-container">
      <Plot
        key={plotKey}
        data={[
          {
            x: data.dates,
            y: data.starting_stock,
            text: data.starting_stock.map(v => v.toString()),
            type: "bar",
            name: "Остаток",
            marker: { color: "#4A90E2" },
            textposition: "outside",
            hovertemplate: `Остаток: %{y}`,
            hoverlabel: { 
              bgcolor: tooltipBg, 
              bordercolor: tooltipBorder, 
              font: { color: textColor, size: 12 },
              namelength: 0
            }
          },
          {
            x: data.dates,
            y: data.spent.map((v: number) => -v),
            text: data.spent.map(v => v > 0 ? v.toString() : ''),
            type: "bar",
            name: "Расход",
            marker: { color: expenseColors },
            textposition: "outside",
            hovertemplate: `Расход: %{text}`,
            hoverlabel: { 
              bgcolor: tooltipBg, 
              bordercolor: tooltipBorder, 
              font: { color: textColor, size: 10 },
              namelength: 0
            }
          },
          {
            x: data.dates,
            y: data.incoming,
            type: "bar",
            name: "Приход",
            marker: { color: "green" },
            textposition: "outside",
            hovertemplate: `Приход: %{y}`,
            hoverlabel: { 
              bgcolor: tooltipBg, 
              bordercolor: tooltipBorder, 
              font: { color: textColor, size: 12 },
              namelength: 0
            }
          },
          {
            x: data.dates,
            y: data.dates.map(() => data.threshold),
            type: "scatter",
            mode: "lines",
            name: "Порог",
            line: { color: "red", dash: "dash", width: 2 },
            hovertemplate: `Порог: %{y}`,
            hoverlabel: { 
              bgcolor: tooltipBg, 
              bordercolor: tooltipBorder, 
              font: { color: textColor, size: 12 },
              namelength: 0
            }
          },
          // ✅ НОВОЕ: Серия данных для отображения звездочек (моментов создания заказа)
          {
            x: data.dates,
            y: orderMarkersY,
            text: orderMarkersText,
            type: "scatter",
            mode: "markers",
            name: "Заказ создан",
            marker: { 
              color: "lightpurple", // Золотой цвет
              size: 5,
              symbol: "circle",   // Форма звезды
              line: { color: 'black', width: 0.3 } // Обводка для контраста
            },
            hovertemplate: `%{text}<extra></extra>`,
            hoverlabel: { 
              bgcolor: tooltipBg, 
              bordercolor: tooltipBorder, 
              font: { color: textColor, size: 12 },
              namelength: 0
            }
          }
        ]}
        layout={{
          barmode: "overlay",
          autosize: true, 
          xaxis: { 
            tickfont: { color: textColor },
            spikemode: 'across',
            spikecolor: textColor,
            spikedash: 'solid',
          },
          yaxis: {
            tickfont: { size: 10, color: textColor },
            ticklabelposition: 'inside top',
            gridcolor: gridColor,
            zeroline: false 
          },
          paper_bgcolor: plotBgColor,
          plot_bgcolor: plotBgColor,
          font: {
            family: '"Helvetica", sans-serif',
            color: textColor
          },
          legend: {
            font: { color: textColor, size: 10 },
            orientation: "h",
            x: 0.5,
            y: 1,
            yanchor: "bottom",
            xanchor: "center",
            bgcolor: plotBgColor,
          },
          margin: { l: 0, r: 0, t: 0, b: 0 },
          hovermode: "x unified"
        }}
        config={{ 
          responsive: true,
          displaylogo: false,
          doubleClick: 'reset',
        }}
        useResizeHandler={true}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default StockSimulationPlot;