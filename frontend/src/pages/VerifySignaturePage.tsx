import { useParams, Link } from 'react-router-dom';
import { CheckCircle, ShieldCheck, Calendar, User, FileText } from 'lucide-react';

export default function VerifySignaturePage() {
  const { id } = useParams();
  
  // In a real application, we would fetch data from the backend using the id.
  // For the MVP, we use mock data.
  const mockData = {
    documentId: id || 'DOC-2026-07',
    signedDate: new Date().toLocaleDateString('id-ID', {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    signerName: 'Pejabat BAPP Berwenang',
    documentTitle: 'Dokumen Persetujuan Resmi',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden relative z-10">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center text-white relative">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
            <div className="w-[200%] h-[200%] absolute -top-1/2 -left-1/2 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-[spin_60s_linear_infinite]"></div>
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
              <ShieldCheck className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Dokumen Valid</h1>
            <p className="text-blue-100 text-sm">Tanda tangan digital telah diverifikasi</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Dokumen</p>
              <p className="font-semibold text-slate-800">{mockData.documentTitle}</p>
              <p className="text-xs text-slate-500 mt-1">ID: {mockData.documentId}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Penandatangan</p>
              <p className="font-semibold text-slate-800">{mockData.signerName}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Waktu Tanda Tangan</p>
              <p className="font-semibold text-slate-800">{mockData.signedDate}</p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-green-600 bg-green-50 py-3 rounded-xl border border-green-100 shadow-sm">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium text-sm">Diverifikasi secara resmi oleh BAPP</span>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <a 
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/uploads/${id || 'DOC-2026-07'}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-md hover:shadow-lg"
            >
              Lihat Dokumen Digital
            </a>
            
            <div className="text-center">
              <Link to="/" className="text-sm text-slate-500 font-medium hover:text-slate-800 transition-colors">
                &larr; Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
