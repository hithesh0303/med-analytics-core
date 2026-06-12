import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  ArcElement, BarElement, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend, Filler,
);

export const CHART_COLORS = [
  "#0f9a9a", // teal
  "#22b07d", // green
  "#e0a23a", // amber
  "#a45ad1", // purple
  "#dc4c4c", // red
  "#4c7adc", // blue
];

export const CHART_DEFAULTS = {
  plugins: {
    legend: { labels: { color: "#3a4a5a", font: { size: 11 } } },
  },
  scales: {
    x: { ticks: { color: "#6b7a8a" }, grid: { color: "rgba(0,0,0,0.04)" } },
    y: { ticks: { color: "#6b7a8a" }, grid: { color: "rgba(0,0,0,0.04)" } },
  },
};
