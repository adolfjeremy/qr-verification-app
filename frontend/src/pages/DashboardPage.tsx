import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { FileText, LogOut, Plus, Calendar, Loader2, Trash2, ExternalLink, ShieldCheck } from 'lucide-react';
import logoApp from '../assets/logo.webp';

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
  const ITEMS_PER_PAGE = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await api.get('/documents');
        setDocuments(response.data);
      } catch (error) {
        toast.error('Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      navigate('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  const handleDelete = async (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium">Are you sure you want to delete this document?</span>
        <div className="flex gap-2 justify-end">
          <button autoFocus onClick={() => toast.dismiss(t.id)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm text-slate-700 transition-colors">Cancel</button>
          <button onClick={async () => {
            toast.dismiss(t.id);
            try {
              await api.delete(`/documents/${id}`);
              setDocuments(docs => docs.filter(doc => doc.id !== id));
              toast.success('Document deleted successfully');
            } catch (error) {
              toast.error('Failed to delete document');
            }
          }} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors">Delete</button>
        </div>
      </div>
    ), { duration: 5000, position: 'top-center' });
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const filteredDocuments = documents.filter(doc => filterStatus === 'ALL' || doc.status === filterStatus);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <img src={logoApp} alt="Logo" className="h-8 object-contain" />
            <div className="hidden sm:block h-5 w-px bg-slate-200 mx-1"></div>
            <span className="hidden sm:inline text-blue-500">BAPP Document Verification</span>
          </h1>
          <div className="flex items-center gap-4">
            <Link to="/audit" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors">
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Audit Trail</span>
            </Link>
            <div className="h-4 w-px bg-slate-200"></div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
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
            <Link to="/" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap">
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
          <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">No documents found</h3>
            <p className="text-slate-500 mt-1 max-w-sm">There are no documents matching your selected filter.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <ul className="divide-y divide-slate-100">
                {filteredDocuments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((doc) => (
                  <li key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 sm:gap-0 hover:bg-slate-50 transition-colors group">
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
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
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
          
          {filteredDocuments.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-xl sm:px-6">
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700">
                    Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredDocuments.length)}</span> of <span className="font-medium">{filteredDocuments.length}</span> results
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
                    {Array.from({ length: Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE) }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx + 1)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-300 focus:z-20 focus:outline-offset-0 ${currentPage === idx + 1 ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600' : 'text-slate-900 hover:bg-slate-50'}`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE), p + 1))}
                      disabled={currentPage === Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE)}
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
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE), p + 1))}
                  disabled={currentPage === Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE)}
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
    </div>
  );
}
