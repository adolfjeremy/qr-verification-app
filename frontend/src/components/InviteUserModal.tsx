import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Loader2, MailPlus } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteUserModal({ isOpen, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await api.post('/auth/invite', { email });
      toast.success('Invitation sent successfully!');
      setEmail('');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
            <MailPlus className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Invite New User</h3>
            <p className="text-slate-500 text-sm">Send a registration link via email</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              required
              placeholder="colleague@example.com"
            />
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
