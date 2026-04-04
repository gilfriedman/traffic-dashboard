import { NavLink } from 'react-router-dom';
import { BarChart3, Table, LayoutDashboard } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useGlobalFilters } from '../../contexts/GlobalFiltersContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/charts', label: 'Charts', icon: BarChart3 },
  { to: '/data', label: 'Data', icon: Table },
];

function ToggleSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
      <span>{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
          checked ? 'bg-blue-600' : 'bg-slate-300'
        )}
      >
        <span
          className={cn(
            'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
            checked ? 'translate-x-4.5' : 'translate-x-0.5'
          )}
        />
      </button>
    </label>
  );
}

export function Header() {
  const { beerShevaOnly, setBeerShevaOnly, hideMidnight, setHideMidnight } = useGlobalFilters();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold text-slate-900">Traffic Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <ToggleSwitch label="Beer Sheva only" checked={beerShevaOnly} onChange={() => setBeerShevaOnly(!beerShevaOnly)} />
            <ToggleSwitch label="Hide midnight" checked={hideMidnight} onChange={() => setHideMidnight(!hideMidnight)} />
            <nav className="flex gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
