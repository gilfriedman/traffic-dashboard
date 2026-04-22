import { NavLink } from 'react-router-dom';
import { BarChart3, BookOpen, LayoutDashboard, Network } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { useGlobalFilters } from '../../contexts/GlobalFiltersContext';

function ToggleSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
      <span>{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        dir="ltr"
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

function LanguageToggle() {
  const { i18n } = useTranslation();
  const isHebrew = i18n.language === 'he';

  function toggle() {
    i18n.changeLanguage(isHebrew ? 'en' : 'he');
  }

  return (
    <button
      onClick={toggle}
      className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
    >
      {isHebrew ? 'EN' : 'HE'}
    </button>
  );
}

export function Header() {
  const { beerShevaOnly, setBeerShevaOnly, hideMidnight, setHideMidnight } = useGlobalFilters();
  const { t } = useTranslation();

  const navItems = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/charts', label: t('nav.charts'), icon: BarChart3 },
    { to: '/network', label: t('nav.network'), icon: Network },
    { to: '/sources', label: t('nav.sources'), icon: BookOpen },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold text-slate-900">{t('header.title')}</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <ToggleSwitch label={t('header.beerShevaOnly')} checked={beerShevaOnly} onChange={() => setBeerShevaOnly(!beerShevaOnly)} />
            <ToggleSwitch label={t('header.hideMidnight')} checked={hideMidnight} onChange={() => setHideMidnight(!hideMidnight)} />
            <nav className="flex gap-1">
              {navItems.map((item) => (
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
