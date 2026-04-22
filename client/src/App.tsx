import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ChartsPage } from './pages/ChartsPage';
import { DataPage } from './pages/DataPage';
import { NetworkPage } from './pages/NetworkPage';
import { SourcesPage } from './pages/SourcesPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/charts" element={<ChartsPage />} />
          <Route path="/data" element={<DataPage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/sources" element={<SourcesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
