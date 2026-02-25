import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import Scan from './pages/Scan';
import TrafficLogs from './pages/TrafficLogs';
import OfficialDetail from './pages/OfficialDetail';
import OfficialsList from './pages/OfficialsList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/register" element={<Register />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/logs" element={<TrafficLogs />} />
          <Route path="/official/:id" element={<OfficialDetail />} />
          <Route path="/officials" element={<OfficialsList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
