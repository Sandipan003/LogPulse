import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TimelineChart({ timelineData }) {
  if (!timelineData) return null;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    color: '#a1a1aa', // text-zinc-400
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: '#a1a1aa',
          usePointStyle: true,
          boxWidth: 8,
          font: {
            family: "'Inter', sans-serif",
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(24, 24, 27, 0.9)', // zinc-900
        titleColor: '#f4f4f5', // zinc-100
        bodyColor: '#d4d4d8', // zinc-300
        borderColor: 'rgba(63, 63, 70, 0.5)', // zinc-700
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(63, 63, 70, 0.2)', // zinc-700 with opacity
          drawBorder: false,
        },
        ticks: {
          color: '#a1a1aa', // zinc-400
          maxTicksLimit: 10
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(63, 63, 70, 0.2)',
          drawBorder: false,
        },
        ticks: {
          color: '#a1a1aa',
          stepSize: 10
        }
      }
    },
    elements: {
      line: {
        tension: 0.4 // smooth curve
      },
      point: {
        radius: 0,
        hitRadius: 10,
        hoverRadius: 6
      }
    }
  };

  const data = {
    labels: timelineData.labels,
    datasets: timelineData.datasets.map(dataset => ({
      ...dataset,
      fill: true,
      borderWidth: 2,
    }))
  };

  return <Line options={options} data={data} />;
}
