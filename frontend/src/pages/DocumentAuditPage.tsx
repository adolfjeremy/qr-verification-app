import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Loader2, ArrowLeft, Clock, ShieldCheck, User, Globe, FileText } from 'lucide-react';
import logoApp from '../assets/logo.webp';

interface AuditLog {
  id: string;
  documentId: string;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  details: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
  } | null;
  document: {
    title: string;
  };
}

export default function DocumentAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/audit')
      .then(res => setLogs(res.data))
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'UPLOADED': return 'text-blue-600 bg-blue-50';
      case 'SIGNATURE_REQUESTED': return 'text-orange-600 bg-orange-50';
      case 'SIGNED': return 'text-emerald-600 bg-emerald-50';
      case 'PUBLISHED': return 'text-purple-600 bg-purple-50';
      case 'DELETED': return 'text-red-600 bg-red-50';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <img src={logoApp} alt="Logo" className="h-8 object-contain" />
              <div className="hidden sm:block h-5 w-px bg-slate-200 mx-1"></div>
              <span className="text-slate-700">Audit Trail</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Global Document Activity Log
            </h2>
            <p className="text-sm text-slate-500 mt-1">Tamper-evident logs of all system activities.</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No audit logs found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                    <th className="p-4 font-medium">Timestamp</th>
                    <th className="p-4 font-medium">Document</th>
                    <th className="p-4 font-medium">Action</th>
                    <th className="p-4 font-medium">User/Identity</th>
                    <th className="p-4 font-medium">IP / Browser</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 align-top">
                        <div className="flex items-center gap-1 text-slate-600 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <FileText className="w-4 h-4 text-slate-400" />
                          {log.document.title}
                        </div>
                        {log.details && <p className="text-xs text-slate-500 mt-1 max-w-xs">{log.details}</p>}
                      </td>
                      <td className="p-4 align-top">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 align-top">
                        {log.user ? (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <User className="w-4 h-4 text-slate-400" />
                            {log.user.name}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">External Signer</span>
                        )}
                      </td>
                      <td className="p-4 align-top text-xs text-slate-500">
                        <div className="flex items-center gap-1 mb-1">
                          <Globe className="w-3.5 h-3.5" />
                          {log.ipAddress || 'Unknown IP'}
                        </div>
                        <div className="truncate max-w-[200px]" title={log.userAgent || ''}>
                          {log.userAgent || 'Unknown Agent'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
