import { Routes, Route } from 'react-router-dom';
import SignDocumentPage from './pages/SignDocumentPage';
import VerifySignaturePage from './pages/VerifySignaturePage';
import ViewDocumentPage from './pages/ViewDocumentPage';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Routes>
        <Route path="/" element={<SignDocumentPage />} />
        <Route path="/verify/:id" element={<VerifySignaturePage />} />
        <Route path="/doc/:id" element={<ViewDocumentPage />} />
      </Routes>
    </div>
  );
}

export default App;
