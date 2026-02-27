import Plot from "react-plotly.js";
import { useTheme } from "../../../context/ThemeContext";
import "../AnalysisView.css";

interface ActualDataPoint {
  date: string;
  income: number;
  expense: number;
  stock: number;
}

interface ActualDataPlotProps {
  data: ActualDataPoint[];
  product: string;
  heightPercent?: number;
}

const ActualDataPlot = ({ 
  data, 
  product,
  heightPercent = 30
}: ActualDataPlotProps) => {
  const { theme, colors } = useTheme();

  if (!data || data.length === 0) {
    return (
      <div className="plot-container" style={{ height: `${heightPercent}vh` }}>
        <div className="plot-loading">
          Загрузка данных...
        </div>
      </div>
    );
  }

  const dates = data.map(d => d.date);
  const incomes = data.map(d => d.income);
  const expenses = data.map(d => -d.expense); 
  const stocks = data.map(d => d.stock);

  const bgColor = colors.bgPrimary;
  const plotBgColor = colors.bgSecondary;
  const textColor = colors.textPrimary;
  const gridColor = colors.borderColor;
  const tooltipBg = theme === 'dark' ? '#2d2d2d' : '#ffffff';
  const tooltipBorder = theme === 'dark' ? '#444' : '#ddd';

  const plotKey = `${theme}-${product}-${data.length}-${data[0]?.date}-${data[data.length - 1]?.date}`;

  return (
    <div className="plot-container" style={{ height: `${heightPercent}vh` }}>
      <Plot
        key={plotKey}
        data={[
          {
            x: dates,
            y: stocks,
            text: stocks.map(v => v > 0 ? v.toString() : ''),
            type: "bar",
            name: "Остаток",
            marker: { color: "#3d3d95" },
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
            x: dates,
            y: expenses,
            text: data.map(d => d.expense > 0 ? d.expense.toString() : ''),
            type: "bar",
            name: "Расход",
            marker: { color: "orange" },
            textposition: "outside",
            hovertemplate: `Расход: %{text}`,
            hoverlabel: { 
              bgcolor: tooltipBg, 
              bordercolor: tooltipBorder, 
              namelength: 0
            }
          },
          {
            x: dates,
            y: incomes,
            text: incomes.map(v => v > 0 ? v.toString() : ''),
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
          }
        ]}
        layout={{
          barmode: "overlay",
          autosize: true,
          xaxis: { 
            tickfont: { color: textColor },
            spikemode: 'across',
            spikecolor: textColor,
            spikedash: 'solid'
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

export default ActualDataPlot;