import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DocumentUpload } from '../components/DocumentUpload';
import { PdfViewer } from '../components/PdfViewer';
import { SignaturePad } from '../components/SignaturePad';
import { DraggableOverlay, type DraggableItem } from '../components/DraggableOverlay';
import { publishDocument, exportDocument, saveDocumentToServer, createDraftDocument } from '../services/document.service';
import { FileSignature, QrCode, Download, Loader2, Save, Send, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import logoApp from '../assets/logo.webp';

export default function SignDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [documentId, setDocumentId] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [documentStatus, setDocumentStatus] = useState<string>('DRAFT');

  const [isSaved, setIsSaved] = useState(false);
  const [items, setItems] = useState<DraggableItem[]>([]);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [requestEmail, setRequestEmail] = useState('');
  const [requestName, setRequestName] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState<{id: string, name: string, email: string}[]>([]);
  const [selectedUserType, setSelectedUserType] = useState<'custom'|'internal'>('custom');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Ref for the container to maintain relative positioning bounds
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      setIsProcessing(true);
      api.get(`/documents/${id}`).then(res => {
        setDocumentId(id);
        setPdfUrl(res.data.fileViewUrl);

        // Handle legacy items format just in case, but usually it's an array
        let parsedItems = res.data.items;
        if (typeof parsedItems === 'string') {
          try { parsedItems = JSON.parse(parsedItems); } catch (e) { parsedItems = []; }
        }
        setItems(parsedItems || []);
        setItems(parsedItems || []);

        setDocumentStatus(res.data.status);
        setIsSaved(res.data.status === 'PUBLISHED');
      }).catch(() => {
        toast.error('Document not found or unauthorized');
        navigate('/dashboard');
      }).finally(() => {
        setIsProcessing(false);
      });
    } else {
      setPdfUrl(null);
      setItems([]);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (showRequestModal && registeredUsers.length === 0) {
      api.get('/users').then(res => {
        setRegisteredUsers(res.data);
      }).catch(err => console.error('Failed to fetch users', err));
    }
  }, [showRequestModal, registeredUsers.length]);

  const handleFileUpload = async (f: File) => {
    try {
      setIsProcessing(true);
      const res = await createDraftDocument(f);
      navigate(`/sign/${res.id}`);
    } catch (error) {
      console.error('Error creating draft', error);
      toast.error('Failed to upload document');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddSignature = (base64: string) => {
    setItems([
      ...items,
      {
        id: `sig-${Date.now()}`,
        type: 'signature',
        base64Image: base64,
        x: 50,
        y: 50,
        width: 150,
        height: 80,
        pageNumber: currentPage,
      },
    ]);
    setShowSignaturePad(false);
  };

  const BASE_URL = import.meta.env.VITE_APP_URL || window.location.origin;

  const handleAddQrCode = () => {
    setItems([
      ...items,
      {
        id: `qr-${Date.now()}`,
        type: 'qrcode_doc',
        qrContent: `${BASE_URL}/doc/${documentId}`,
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        pageNumber: currentPage,
      },
    ]);
  };

  const handleAddVerifyQrCode = () => {
    setItems([
      ...items,
      {
        id: `qr-verify-${Date.now()}`,
        type: 'qrcode_verify',
        qrContent: `${BASE_URL}/verify/${documentId}`,
        x: 160,
        y: 50,
        width: 100,
        height: 100,
        pageNumber: currentPage,
      },
    ]);
  };

  const handleAddRequestSignature = () => {
    setShowRequestModal(true);
  };

  const submitRequestSignatureModal = () => {
    if (!requestEmail || !requestName) {
      toast.error('Email and Name are required');
      return;
    }
    setItems([
      ...items,
      {
        id: `request-${Date.now()}`,
        type: 'signature_request',
        signerEmail: requestEmail,
        signerName: requestName,
        x: 50,
        y: 50,
        width: 150,
        height: 60,
        pageNumber: currentPage,
      },
    ]);
    setShowRequestModal(false);
    setRequestEmail('');
    setRequestName('');
  };

  const handleUpdateItem = (id: string, updates: Partial<DraggableItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSaveDocument = async () => {
    if (!documentId) return;
    try {
      setIsProcessing(true);
      await saveDocumentToServer(items, documentId);
      toast.success('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving document', error);
      toast.error('Failed to save document. Please check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!documentId) return;
    try {
      setIsProcessing(true);
      await publishDocument(items, documentId);
      setIsSaved(true);
      setDocumentStatus('PUBLISHED');
      setPdfUrl(prev => prev ? `${prev.split('?')[0]}?t=${Date.now()}` : prev);
      toast.success('Document published successfully!');
    } catch (error) {
      console.error('Error publishing document', error);
      toast.error('Failed to publish document. Please check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendSignatureRequest = async () => {
    if (!documentId) return;
    const requestItem = items.find(item => item.type === 'signature_request');
    if (!requestItem) return;

    try {
      setIsProcessing(true);
      // Save current items including the signature_request placeholder
      await saveDocumentToServer(items, documentId);
      
      await api.post(`/documents/${documentId}/request-signature`, {
        email: requestItem.signerEmail,
        name: requestItem.signerName,
        coordinateData: JSON.stringify({
          pageNumber: requestItem.pageNumber,
          x: requestItem.x,
          y: requestItem.y,
          width: requestItem.width,
          height: requestItem.height,
          id: requestItem.id,
        })
      });
      setIsSaved(true);
      toast.success(`Signature request sent to ${requestItem.signerEmail}`);
    } catch (error) {
      console.error('Error sending request', error);
      toast.error('Failed to send signature request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    if (!documentId || !isSaved) return;
    try {
      setIsProcessing(true);

      const signedPdfBlob = await exportDocument(documentId);

      // Trigger download
      const url = URL.createObjectURL(signedPdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `signed-document.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting document', error);
      toast.error('Failed to export document. Please check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-40 shadow-sm h-16 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src={logoApp} alt="Logo" className="h-8 object-contain" />
              <div className="hidden sm:block h-5 w-px bg-slate-200 mx-2"></div>
              <h1 className="text-sm font-normal text-slate-800 hidden sm:block">
                Kembali ke dashboard
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider shadow-sm border border-black/5
              ${documentStatus === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : 
                documentStatus === 'SIGNED' ? 'bg-sky-50 text-sky-700' : 
                (documentStatus === 'SIGNATURE_REQUESTED' || documentStatus === 'PENDING_SIGNATURE') ? 'bg-amber-50 text-amber-700 animate-pulse' : 
                'bg-slate-100 text-slate-600'}`}>
              {documentStatus.replace('_', ' ')}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto mt-6 sm:mt-8 px-4 pb-24 sm:pb-8">
        {!pdfUrl ? (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4 mt-8 sm:mt-12">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-600 font-medium">Uploading Document...</p>
              </div>
            ) : (
              <DocumentUpload onFileSelect={handleFileUpload} />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">

            {/* Editor Toolbar */}
            <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 p-2 sm:p-3 mb-6 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 sticky top-20 z-30">
              {/* Left: Tools */}
              <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowSignaturePad(true)}
                  disabled={isSaved}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 px-1 sm:px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-xl transition-colors border border-slate-200"
                >
                  <FileSignature className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="text-[10px] sm:text-sm text-center leading-tight">Signature</span>
                </button>
                <button
                  onClick={handleAddQrCode}
                  disabled={isSaved}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 px-1 sm:px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-xl transition-colors border border-slate-200"
                >
                  <QrCode className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="text-[10px] sm:text-sm text-center leading-tight">QR Code</span>
                </button>
                <button
                  onClick={handleAddVerifyQrCode}
                  disabled={isSaved}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed text-indigo-700 font-medium rounded-xl transition-all shadow-sm border border-indigo-100 hover:border-indigo-200"
                >
                  <QrCode className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="text-[10px] sm:text-sm text-center leading-tight">Verify QR</span>
                </button>
                <button
                  onClick={handleAddRequestSignature}
                  disabled={isSaved}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed text-orange-700 font-medium rounded-xl transition-all shadow-sm border border-orange-100 hover:border-orange-200"
                >
                  <Mail className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="text-[10px] sm:text-sm text-center leading-tight">Req. Sign</span>
                </button>
              </div>

              {/* Right: Actions */}
              {/* Removed original action buttons from here to move to FAB */}
            </div>

            <div className="w-full" ref={containerRef}>
              <PdfViewer
                file={pdfUrl}
                onPageChange={setCurrentPage}
              >
                {/* Render items that belong to the current page as children of PdfViewer */}
                {!isSaved && items.filter(item => item.pageNumber === currentPage).map(item => (
                  <DraggableOverlay
                    key={item.id}
                    item={item}
                    onChange={handleUpdateItem}
                    onRemove={handleRemoveItem}
                    scale={1.2} // Matching the scale in PdfViewer
                    disabled={isSaved}
                  />
                ))}
              </PdfViewer>
            </div>
          </div>
        )}
      </main>

      {/* Signature Modal */}
      {showSignaturePad && (
        <SignaturePad
          onSave={handleAddSignature}
          onClose={() => setShowSignaturePad(false)}
        />
      )}

      {showRequestModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Request Remote Signature</h3>
              <p className="text-slate-500 text-sm mt-1">
                An email will be sent with a secure link to sign this document.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Registered User</label>
                <select
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setSelectedUserType('custom');
                      setRequestName('');
                      setRequestEmail('');
                    } else {
                      const user = registeredUsers.find(u => u.id === val);
                      if (user) {
                        setSelectedUserType('internal');
                        setRequestName(user.name);
                        setRequestEmail(user.email);
                      }
                    }
                  }}
                >
                  <option value="custom">-- Custom / External User --</option>
                  {registeredUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Signer Name</label>
                <input
                  type="text"
                  value={requestName}
                  readOnly={selectedUserType === 'internal'}
                  onChange={(e) => setRequestName(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedUserType === 'internal' ? 'bg-slate-50 text-slate-500' : ''}`}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Signer Email</label>
                <input
                  type="email"
                  value={requestEmail}
                  readOnly={selectedUserType === 'internal'}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedUserType === 'internal' ? 'bg-slate-50 text-slate-500' : ''}`}
                  placeholder="e.g. john@example.com"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitRequestSignatureModal}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Add Placeholder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Bar (FAB) */}
      {pdfUrl && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl p-2 flex items-center gap-2">
            {!isSaved ? (
              <>
                <button
                  onClick={handleSaveDocument}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-5 py-3 bg-slate-100/80 hover:bg-slate-200 disabled:opacity-70 disabled:cursor-not-allowed text-slate-700 text-sm font-semibold rounded-xl transition-all"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Save className="h-4 w-4 shrink-0" />}
                  <span className="hidden sm:inline">Save Draft</span>
                </button>
                
                {items.some(i => i.type === 'signature_request') ? (
                  <button
                    onClick={handleSendSignatureRequest}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Send className="h-4 w-4 shrink-0" />}
                    <span>Send Request</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowPublishModal(true)}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Send className="h-4 w-4 shrink-0" />}
                    <span>Publish Document</span>
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleExport}
                disabled={isProcessing}
                className="flex items-center gap-2 px-8 py-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-70 text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:-translate-y-0.5"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Download className="h-4 w-4 shrink-0" />}
                <span>Export Final PDF</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Send className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Publish Document?</h3>
              <p className="text-slate-500 mb-6">
                This action will permanently lock the document and bake all signatures and QR codes into the PDF. <strong>You will not be able to edit their positions after this.</strong>
              </p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="px-6 py-3 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors w-full"
                >
                  Go Back
                </button>
                <button
                  autoFocus
                  onClick={() => {
                    setShowPublishModal(false);
                    handlePublish();
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full"
                >
                  Yes, Publish Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
