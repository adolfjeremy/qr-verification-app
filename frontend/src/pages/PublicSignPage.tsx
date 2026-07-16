import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Loader2, Send } from 'lucide-react';
import { PdfViewer } from '../components/PdfViewer';
import { SignaturePad } from '../components/SignaturePad';
import logoApp from '../assets/logo.webp';

export default function PublicSignPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [documentData, setDocumentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureBase64, setSignatureBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      api.get(`/documents/request/${token}`)
        .then(res => {
          setDocumentData(res.data);
        })
        .catch(err => {
          console.error(err);
          toast.error(err.response?.data?.message || 'Invalid or expired signature link');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [token]);

  const handleSign = (base64: string) => {
    setSignatureBase64(base64);
    setShowSignaturePad(false);
  };

  const handleSubmit = async () => {
    if (!signatureBase64) {
      toast.error('Please draw your signature first');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await api.post(`/documents/request/${token}/sign`, {
        signatureBase64
      });
      setIsSuccess(true);
      toast.success('Document signed successfully!');
    } catch (err) {
      toast.error('Failed to submit signature');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Thank You!</h2>
          <p className="text-slate-600 mb-6">You have successfully signed the document: <strong>{documentData?.documentTitle}</strong>.</p>
          <p className="text-sm text-slate-400">You may now close this window.</p>
        </div>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Link Expired or Invalid</h2>
        <p className="text-slate-600 mb-6">This signature request link is no longer valid.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoApp} alt="Logo" className="h-8 object-contain" />
            <div className="h-5 w-px bg-slate-200 mx-1"></div>
            <span className="font-semibold text-slate-800 truncate max-w-[150px] sm:max-w-sm">Signature Request</span>
          </div>
          
          <button
            onClick={() => {
              if (signatureBase64) handleSubmit();
              else setShowSignaturePad(true);
            }}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-medium rounded-lg transition-colors shadow-md"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {signatureBase64 ? 'Submit Signature' : 'Sign Now'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 overflow-hidden flex flex-col items-center">
        <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{documentData.documentTitle}</h2>
            <p className="text-sm text-slate-500 mt-1">Hello, <strong>{documentData.signerName}</strong>. Please review and sign below.</p>
          </div>
        </div>

        <div className="w-full relative shadow-lg rounded-xl overflow-hidden border border-slate-200">
          <PdfViewer file={documentData.fileViewUrl} onPageChange={setCurrentPage}>
            {/* Show where they need to sign if on the correct page */}
            {documentData.coordinateData.pageNumber === currentPage && (
              <div
                style={{
                  position: 'absolute',
                  left: `${documentData.coordinateData.x}%`,
                  top: `${documentData.coordinateData.y}%`,
                  width: `${documentData.coordinateData.width}px`,
                  height: `${documentData.coordinateData.height}px`,
                  pointerEvents: 'none',
                }}
                className={`border-2 flex items-center justify-center rounded overflow-hidden ${signatureBase64 ? 'border-transparent' : 'border-dashed border-blue-500 bg-blue-50/50'}`}
              >
                {signatureBase64 ? (
                  <img src={signatureBase64} alt="Your Signature" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-blue-600">SIGN HERE</span>
                  </div>
                )}
              </div>
            )}
          </PdfViewer>
        </div>
      </main>

      {showSignaturePad && (
        <SignaturePad
          onSave={handleSign}
          onClose={() => setShowSignaturePad(false)}
        />
      )}
    </div>
  );
}
