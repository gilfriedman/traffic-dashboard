import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ChartsPage } from './pages/ChartsPage';
import { DataPage } from './pages/DataPage';
import { NetworkPage } from './pages/NetworkPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/charts" element={<ChartsPage />} />
          <Route path="/data" element={<DataPage />} />
          <Route path="/network" element={<NetworkPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
