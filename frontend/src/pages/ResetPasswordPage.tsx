import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid or missing reset token.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    try {
      setIsLoading(true);
      await api.post('/auth/reset-password', { token, newPassword });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to reset password. The link might be expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center border border-slate-100">
          <h2 className="text-xl font-bold text-red-600 mb-2">Invalid Link</h2>
          <p className="text-slate-600 mb-4">The password reset link is invalid or missing the token.</p>
          <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline font-medium">Go back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Set New Password</h1>
          <p className="text-slate-500 text-sm mt-1">Please enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              required
              minLength={6}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 mt-2 shadow-md hover:shadow-lg border border-transparent"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
