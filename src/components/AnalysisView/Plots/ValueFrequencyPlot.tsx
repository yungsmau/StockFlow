import Plot from "react-plotly.js";
import { useMemo } from "react";
import { Data, Layout } from "plotly.js";
import { useTheme } from "../../../context/ThemeContext";

interface ValueFrequencyBin {
  value: number;
  count: number;
  percentage: number;
}

interface ValueFrequencyResult {
  bins: ValueFrequencyBin[];
  total_windows: number;
  window_size: number;
  value_type: "stock" | "expense";
  min_value: number;
  max_value: number;
  avg_value: number;
}

interface ValueFrequencyPlotProps {
  data: ValueFrequencyResult;
  product?: string;
  heightPercent?: number;
}

export default function ValueFrequencyPlot({
  data,
  product,
  heightPercent = 30
}: ValueFrequencyPlotProps) {
  const { theme, colors } = useTheme();

  const sortedBins = useMemo(() => {
    if (!data || data.bins.length === 0) return [];
    return [...data.bins].sort((a, b) => a.value - b.value);
  }, [data]);

  function getCategoryAxisPosition(avgValue: number, categories: number[]): number {
    const exactIndex = categories.findIndex(v => v === avgValue);
    if (exactIndex !== -1) return exactIndex;
    
    for (let i = 0; i < categories.length - 1; i++) {
      if (avgValue >= categories[i] && avgValue <= categories[i + 1]) {
        const range = categories[i + 1] - categories[i];
        if (range === 0) return i;
        const fraction = (avgValue - categories[i]) / range;
        return i + fraction;
      }
    }
    
    if (avgValue < categories[0]) return -0.5;
    return categories.length - 0.5;
  }

  const categoryValues = sortedBins.map(bin => bin.value);
  
  const avgPosition = getCategoryAxisPosition(data.avg_value, categoryValues);

  const plotData: Data[] = useMemo(() => {
    if (!data || data.bins.length === 0) return [];

    const tooltipBg = theme === "dark" ? "#2d2d2d" : "#ffffff";
    const tooltipBorder = theme === "dark" ? "#444" : "#ddd";
    const textColor = colors.textPrimary || "#000";

    const valueLabel = data.value_type === "stock" ? "Остаток" : "Расход";
    const unit = data.value_type === "stock" ? "ед." : "ед./период";

    const barColors = sortedBins.map((bin) => {
      const intensity = Math.min(bin.count / 10, 1);
      const hue = 200 - (intensity * 200);
      return `hsl(${hue}, 65%, 75%)`;
    });

    const histogram: Data = {
      x: sortedBins.map((bin) => bin.value),
      y: sortedBins.map((bin) => bin.count),
      text: sortedBins.map((bin) => bin.count.toString()),
      type: "bar",
      name: "Частота",
      marker: { 
        color: barColors,
        line: { 
          color: colors.bgPrimary || "#fff", 
          width: 1.5 
        }
      },
      textposition: "outside",
      hovertemplate:
        `${valueLabel}: %{x} ${unit}<br>` +
        `Частота: %{y}<br>` +
        `<extra></extra>`,
      hoverlabel: {
        bgcolor: tooltipBg,
        bordercolor: tooltipBorder,
        font: { color: textColor, size: 12 },
        namelength: 0
      }
    };

    return [histogram];
  }, [data, theme, colors, sortedBins]);

  const plotKey = `${theme}-${product}-${data.value_type}-${data.bins.length}`;

  const avgLineShape: Layout["shapes"] = [
    {
      type: "line",
      x0: avgPosition,
      y0: 0,
      x1: avgPosition,
      y1: 1,
      yref: "paper",
      xref: "x",
      line: {
        color: "#EF553B",
        width: 2,
        dash: "dash"
      }
    }
  ];

  const avgAnnotation: Layout["annotations"] = [
    {
      x: avgPosition,
      y: 1.02,
      yref: "paper",
      xref: "x",
      text: `Ср: ${Math.round(data.avg_value)}`,
      showarrow: false,
      font: {
        size: 10,
        color: "#EF553B",
        family: '"Helvetica", sans-serif'
      },
      bgcolor: colors.bgPrimary || "#fff",
      borderpad: 4,
      borderwidth: 1,
      bordercolor: "#EF553B"
    }
  ];

  if (!data || data.bins.length === 0) {
    return (
      <div className="plot-container" style={{ height: `${heightPercent}vh` }}>
        <div className="plot-loading" style={{ color: colors.textPrimary }}>
          Нет данных для отображения
        </div>
      </div>
    );
  }

  return (
    <div className="plot-container" style={{ height: `${heightPercent}vh` }}>
      <Plot
        key={plotKey}
        data={plotData}
        layout={{
          barmode: "overlay",
          bargap: 0.3,
          autosize: true,
          xaxis: {
            type: "category",
            tickfont: { 
              size: 10, 
              color: colors.textPrimary,
              family: '"Helvetica", sans-serif'
            },
            tickangle: -45,
            spikemode: "across",
            spikecolor: colors.borderColor,
            showline: true,
            linewidth: 1,
            linecolor: colors.borderColor,
            ticklabelposition: "inside bottom"
          },
          yaxis: {
            gridcolor: colors.borderColor,
            ticklabelposition: 'inside top',
            zeroline: false
          },
          paper_bgcolor: colors.bgPrimary,
          plot_bgcolor: colors.bgSecondary,
          font: {
            family: '"Helvetica", sans-serif',
            color: colors.textPrimary
          },
          legend: {
            font: { color: colors.textPrimary, size: 10 },
            orientation: "h",
            yanchor: "bottom",
            x: 0,
            y: 1,
            xanchor: "left"
          },
          
          shapes: avgLineShape,
          // annotations: avgAnnotation,
          
          margin: { l: 30, r: 30, t: 40, b: 0 },
          hovermode: "x unified"
        }}
        config={{
          responsive: true,
          displaylogo: false,
          doubleClick: "reset",
          scrollZoom: false
        }}
        style={{ width: "100%", height: "100%" }}
        useResizeHandler={true}
      />
    </div>
  );
}