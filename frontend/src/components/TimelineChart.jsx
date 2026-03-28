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
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: '#71717a',
          usePointStyle: true,
          boxWidth: 6,
          padding: 15,
          font: { family: "'Inter', sans-serif", size: 11, weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(9, 9, 11, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#a1a1aa',
        borderColor: 'rgba(39, 39, 42, 1)',
        borderWidth: 1,
        padding: 14,
        cornerRadius: 10,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) label += context.parsed.y.toLocaleString();
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#52525b',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
          callback: function(val, index) {
            const label = this.getLabelForValue(val);
            if (label && typeof label === 'string' && label.includes('T')) {
              return label.split('T')[1].slice(0, 5); // Return HH:mm
            }
            return label;
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(39, 39, 42, 0.5)', drawBorder: false },
        ticks: { color: '#52525b', padding: 10 }
      }
    },
    elements: {
      line: { tension: 0.4, borderWidth: 2.5 },
      point: { radius: 0, hoverRadius: 6, hitRadius: 20 }
    }
  };

  const data = {
    labels: timelineData.labels,
    datasets: timelineData.datasets.map(dataset => ({
      ...dataset,
      fill: true,
      borderWidth: 2,
      pointBackgroundColor: dataset.borderColor,
    }))
  };

  return <Line options={options} data={data} />;
}
