import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function ViewDocumentPage() {
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const pdfUrl = `${API_URL}/uploads/${id}.pdf`;
      window.location.replace(pdfUrl);
    }
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
      <h2 className="text-xl font-semibold text-slate-800">Membuka Dokumen...</h2>
      <p className="text-slate-500 mt-2 text-center max-w-md">
        Mohon tunggu sebentar, Anda sedang dialihkan ke dokumen digital.
      </p>
    </div>
  );
}
