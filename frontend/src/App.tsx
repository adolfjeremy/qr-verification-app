import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import SignDocumentPage from './pages/SignDocumentPage';
import VerifySignaturePage from './pages/VerifySignaturePage';
import ViewDocumentPage from './pages/ViewDocumentPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify/:id" element={<VerifySignaturePage />} />
        <Route path="/doc/:id" element={<ViewDocumentPage />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<SignDocumentPage />} />
          <Route path="/sign/:id" element={<SignDocumentPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
