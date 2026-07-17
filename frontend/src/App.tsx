import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import SignDocumentPage from './pages/SignDocumentPage';
import VerifySignaturePage from './pages/VerifySignaturePage';
import ViewDocumentPage from './pages/ViewDocumentPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PublicSignPage from './pages/PublicSignPage';
import DocumentAuditPage from './pages/DocumentAuditPage';
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RegisterPage from './pages/RegisterPage';
import InternalSignRequestPage from './pages/InternalSignRequestPage';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <Toaster position="top-right" />
      <main className="flex-grow">
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify/:id" element={<VerifySignaturePage />} />
        <Route path="/doc/:id" element={<ViewDocumentPage />} />
        <Route path="/sign-request/:token" element={<PublicSignPage />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<SignDocumentPage />} />
          <Route path="/sign/:id" element={<SignDocumentPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/audit" element={<DocumentAuditPage />} />
          <Route path="/internal-sign-request/:token" element={<InternalSignRequestPage />} />
        </Route>
        </Routes>
      </main>
      
      {/* Global Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-slate-500 font-medium">
            Powered by{' '}
            <a 
              href="https://wa.me/6285110555352" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 font-bold hover:text-blue-700 transition-colors"
            >
              Pixby PastiSign
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
