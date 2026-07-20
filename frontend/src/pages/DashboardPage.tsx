import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { FileText, LogOut, Plus, Calendar, Loader2, Trash2, ExternalLink, ShieldCheck, KeyRound, MailPlus, Users } from 'lucide-react';
import logoApp from '../assets/logo.webp';
import ChangePasswordModal from '../components/ChangePasswordModal';
import InviteUserModal from '../components/InviteUserModal';

interface Document {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}
export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('USER');
  const [currentUserName, setCurrentUserName] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const ITEMS_PER_PAGE = 10;
  const navigate = useNavigate();

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-100 text-slate-700';
      case 'PENDING_SIGNATURE': return 'bg-amber-50 text-amber-700 animate-pulse';
      case 'SIGNED': return 'bg-sky-50 text-sky-700';
      case 'PUBLISHED': return 'bg-emerald-50 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  useEffect(() => {
    const fetchDocumentsAndProfile = async () => {
      try {
        const [docsRes, profileRes] = await Promise.all([
          api.get('/documents'),
          api.get('/auth/me')
        ]);
        setDocuments(docsRes.data);
        setCurrentUserRole(profileRes.data.user.role);
        setCurrentUserName(profileRes.data.user.name || profileRes.data.user.email);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocumentsAndProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      navigate('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  const handleDelete = (id: string) => {
    setDeleteDocId(id);
  };

  const confirmDelete = async () => {
    if (!deleteDocId) return;
    try {
      await api.delete(`/documents/${deleteDocId}`);
      setDocuments(docs => docs.filter(doc => doc.id !== deleteDocId));
      toast.success('Document deleted successfully');
    } catch (error) {
      toast.error('Failed to delete document');
    } finally {
      setDeleteDocId(null);
    }
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const filteredDocuments = documents.filter(doc => filterStatus === 'ALL' || doc.status === filterStatus);
  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <img src={logoApp} alt="Logo" className="h-8 object-contain" />
          </h1>
          <div className="flex items-center gap-4">
            <Link to="/" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg text-white font-medium rounded-lg transition-all flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Upload Document</span>
            </Link>
            
            {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN') && (
              <>
                <div className="h-4 w-px bg-slate-200"></div>
                <Link to="/audit" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-medium">Audit Trail</span>
                </Link>
                <div className="h-4 w-px bg-slate-200"></div>
                <Link to="/users" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-medium">Manage Users</span>
                </Link>
                <div className="h-4 w-px bg-slate-200"></div>
                <button onClick={() => setShowInviteUser(true)} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors">
                  <MailPlus className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-medium">Invite User</span>
                </button>
              </>
            )}

            <div className="h-4 w-px bg-slate-200"></div>
            
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {currentUserName ? currentUserName.charAt(0).toUpperCase() : 'U'}
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 border border-slate-100 z-50">
                  <div className="px-4 py-2 border-b border-slate-50 mb-2">
                    <p className="text-sm font-medium text-slate-800 truncate">{currentUserName}</p>
                    <p className="text-xs text-slate-500">{currentUserRole}</p>
                  </div>
                  <button 
                    onClick={() => { setShowChangePassword(true); setIsDropdownOpen(false); }} 
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    Change Password
                  </button>
                  <button 
                    onClick={() => { handleLogout(); setIsDropdownOpen(false); }} 
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold text-slate-800">My Documents</h2>
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => { setFilterStatus('ALL'); setCurrentPage(1); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterStatus === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                All
              </button>
              <button
                onClick={() => { setFilterStatus('PUBLISHED'); setCurrentPage(1); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterStatus === 'PUBLISHED' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Published
              </button>
              <button
                onClick={() => { setFilterStatus('DRAFT'); setCurrentPage(1); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterStatus === 'DRAFT' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Draft
              </button>
            </div>
            <Link to="/" className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg whitespace-nowrap border border-transparent">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Document</span>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 transform scale-150"></div>
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-full flex items-center justify-center relative z-10 shadow-sm">
                <FileText className="w-10 h-10 text-blue-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No documents found</h3>
            <p className="text-slate-500 mb-8 max-w-md">
              {filterStatus === 'ALL'
                ? "You haven't uploaded any documents yet. Get started by uploading your first document to verify and sign."
                : `There are no documents matching the "${filterStatus}" status.`}
            </p>
            <Link to="/" className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              <Plus className="w-5 h-5" />
              <span>Upload Document Now</span>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="bg-transparent overflow-hidden">
              <ul className="space-y-3">
                {filteredDocuments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((doc) => (
                  <li key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 sm:gap-0 bg-white hover:bg-slate-50 transition-all group hover:shadow-md hover:-translate-y-0.5 rounded-2xl border border-slate-200">
                    <div className="flex items-start gap-4 w-full sm:w-auto">
                      <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {doc.title}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(doc.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${getStatusStyles(doc.status)}`}>
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 sm:mt-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity w-full sm:w-auto justify-end">
                      <Link
                        to={`/sign/${doc.id}`}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={doc.status === 'DRAFT' ? "Edit Document" : "View / Export"}
                      >
                        <FileText className="w-5 h-5" />
                      </Link>
                      {doc.status !== 'DRAFT' && (
                        <a
                          href={`${API_URL}/documents/${doc.id}/view`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Open PDF"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-xl shadow-sm">
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-700">
                      Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredDocuments.length)}</span> of{' '}
                      <span className="font-medium">{filteredDocuments.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {Array.from({ length: totalPages }).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentPage(idx + 1)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-300 focus:z-20 focus:outline-offset-0 ${currentPage === idx + 1 ? 'z-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600' : 'text-slate-900 hover:bg-slate-50'}`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>

                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Premium Delete Modal */}
      {deleteDocId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Document?</h3>
              <p className="text-slate-500 mb-8">
                Are you sure you want to delete this document? This action cannot be undone.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDelete}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors w-full shadow-md hover:shadow-lg"
                >
                  Yes, Delete it
                </button>
                <button
                  autoFocus
                  onClick={() => setDeleteDocId(null)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors w-full"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ChangePasswordModal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} />
      <InviteUserModal isOpen={showInviteUser} onClose={() => setShowInviteUser(false)} />
    </div>
  );
}
