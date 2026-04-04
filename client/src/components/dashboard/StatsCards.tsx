import { useTranslation } from 'react-i18next';
import { useChartData } from '../../hooks/useChartData';
import { getHealth } from '../../lib/api';
import { Activity, MapPin, TrendingUp, Calendar } from 'lucide-react';

export function StatsCards() {
  const { data: health } = useChartData(() => getHealth());
  const { t } = useTranslation();

  if (!health) return null;

  const cards = [
    { label: t('stats.totalRecords'), value: health.total_records.toLocaleString(), icon: Activity, color: 'text-blue-600 bg-blue-50' },
    { label: t('stats.status'), value: health.status.toUpperCase(), icon: MapPin, color: 'text-green-600 bg-green-50' },
    { label: t('stats.firstRecord'), value: health.first_record?.slice(0, 10) ?? 'N/A', icon: Calendar, color: 'text-amber-600 bg-amber-50' },
    { label: t('stats.lastRecord'), value: health.last_record?.slice(0, 10) ?? 'N/A', icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{card.label}</p>
              <p className="text-lg font-semibold text-slate-900">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
