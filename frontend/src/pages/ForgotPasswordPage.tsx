import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await api.post('/auth/forgot-password', { email });
      setIsSent(true);
      toast.success('Reset link sent to your email.');
    } catch (error) {
      toast.error('Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Forgot Password</h1>
          <p className="text-slate-500 text-sm mt-1 text-center">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {isSent ? (
          <div className="text-center space-y-6">
            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm font-medium border border-emerald-100">
              Check your email for the reset link!
            </div>
            <Link to="/login" className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 mt-2 shadow-md hover:shadow-lg border border-transparent"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
            </button>
            <div className="text-center mt-4">
              <Link to="/login" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
