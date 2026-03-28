import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SeverityChart({ summary }) {
  if (!summary) return null;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%', // Make it a thin ring
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#a1a1aa',
          usePointStyle: true,
          padding: 20,
          font: {
            family: "'Inter', sans-serif",
            size: 13,
            weight: '600'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(24, 24, 27, 0.9)',
        titleColor: '#f4f4f5',
        bodyColor: '#d4d4d8',
        borderColor: 'rgba(63, 63, 70, 0.5)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      }
    }
  };

  const data = {
    labels: ['Errors', 'Warnings', 'Infos'],
    datasets: [
      {
        data: [summary.errorCount, summary.warnCount, summary.infoCount],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)', // red-500
          'rgba(245, 158, 11, 0.8)', // amber-500
          'rgba(16, 185, 129, 0.8)'  // emerald-500
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(16, 185, 129, 1)'
        ],
        borderWidth: 2,
        hoverOffset: 10
      }
    ]
  };

  return (
    <div className="relative h-full w-full flex items-center justify-center">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-black text-white">{summary.totalLogs.toLocaleString()}</span>
        <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Total Logs</span>
      </div>
    </div>
  );
}
