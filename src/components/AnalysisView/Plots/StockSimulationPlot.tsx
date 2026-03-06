import Plot from "react-plotly.js";
import { useTheme } from "../../../context/ThemeContext";
import "../AnalysisView.css";

interface ComputeResponse {
  dates: string[];
  starting_stock: number[];
  incoming: number[];
  spent: number[];
  threshold: number;
}

interface StockSimulationPlotProps {
  data: ComputeResponse;
  product: string;
  heightPercent?: number;
}

const StockSimulationPlot = ({ 
  data, 
  product,
  heightPercent = 50 
}: StockSimulationPlotProps) => {
  const { theme, colors } = useTheme();

  if (!data || data.dates.length === 0) {
    return (
      <div className="plot-container" style={{ height: `${heightPercent}vh` }}>
        <div className="plot-loading">
          Загрузка данных...
        </div>
      </div>
    );
  }

  const bgColor = colors.bgPrimary;
  const plotBgColor = colors.bgSecondary;
  const textColor = colors.textPrimary;
  const gridColor = colors.borderColor;
  const tooltipBg = theme === 'dark' ? '#2d2d2d' : '#ffffff';
  const tooltipBorder = theme === 'dark' ? '#444' : '#ddd';

  const plotKey = `${theme}-${product}-${data.threshold}-${data.dates.length}-${data.dates[0]}-${data.dates[data.dates.length - 1]}`;

  return (
    <div className="plot-container" style={{ height: `${heightPercent}vh` }}>
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
            marker: { color: "orange" },
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
          paper_bgcolor: bgColor,
          plot_bgcolor: plotBgColor,
          font: {
            family: '"Helvetica", sans-serif',
            color: textColor
          },
          legend: {
            font: { color: textColor, size: 10 },
            orientation: "h",
            yanchor: "bottom",
            x: 0,
            y: 1,
            xanchor: "left"
          },
          margin: { l: 30, r: 30, t: 20, b: 0 },
          hovermode: "x unified"
        }}
        config={{ 
          responsive: true,
          displaylogo: false,
          doubleClick: 'reset'
        }}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default StockSimulationPlot;