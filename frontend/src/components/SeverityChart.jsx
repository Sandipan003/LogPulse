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
    cutout: '75%', 
    plugins: {
      legend: {
        display: false, // Disable built-in legend for perfect custom control
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
    labels: ['Errors', 'Warnings', 'Infos', 'Unstructured'],
    datasets: [
      {
        data: [
          summary.errorCount, 
          summary.warnCount, 
          summary.infoCount, 
          summary.unstructuredCount || 0
        ],
        backgroundColor: [
          '#ef4444', // red-500
          '#f59e0b', // amber-500
          '#10b981', // emerald-500
          '#6366f1'  // indigo-500
        ],
        borderWidth: 0,
        hoverOffset: 15
      }
    ]
  };

  const legendItems = [
    { label: 'Errors', color: '#ef4444', count: summary.errorCount },
    { label: 'Warnings', color: '#f59e0b', count: summary.warnCount },
    { label: 'Infos', color: '#10b981', count: summary.infoCount },
    { label: 'Unstructured', color: '#6366f1', count: summary.unstructuredCount || 0 },
  ];

  return (
    <div className="flex flex-col h-full w-full">
      <div className="relative flex-1 min-h-0">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-4xl font-black text-white leading-none">{summary.totalLogs.toLocaleString()}</span>
          <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-[0.2em] mt-2">Total Logs</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-8 px-2">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div 
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)] border border-white/10" 
              style={{ backgroundColor: item.color }} 
            />
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">{item.label}</span>
              <span className="text-xs font-bold text-white/90">{item.count.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
