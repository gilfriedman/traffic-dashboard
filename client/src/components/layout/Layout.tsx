import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { GlobalFiltersProvider } from '../../contexts/GlobalFiltersContext';
import { ToastProvider } from '../../contexts/ToastContext';

export function Layout() {
  return (
    <ToastProvider>
      <GlobalFiltersProvider>
        <div className="min-h-screen bg-slate-50">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </main>
        </div>
      </GlobalFiltersProvider>
    </ToastProvider>
  );
}
