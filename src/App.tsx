import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Clubes from './pages/Clubes';
import Universos from './pages/Universos';
import UniversoDetail from './pages/UniversoDetail';
import TemporadaDetail from './pages/TemporadaDetail';
import CompeticaoDetail from './pages/CompeticaoDetail';
import { ToastProvider } from './components/Toast';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/clubes" element={<Clubes />} />
        <Route path="/universos" element={<Universos />} />
        <Route path="/universos/:id" element={<UniversoDetail />} />
        <Route path="/universos/:universoId/temporadas/:id" element={<TemporadaDetail />} />
        <Route path="/competicoes/:id" element={<CompeticaoDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  );
}

export default App;

